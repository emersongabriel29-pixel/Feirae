-- Feiraê: explicit state machine for each vendor participating in a multi-vendor order.
-- This migration is additive to the existing order status model; it does not connect the frontend
-- to Supabase or apply itself to any live database.

do $$
begin
  create type public.order_vendor_status as enum (
    'pending',
    'accepted',
    'preparing',
    'ready',
    'collected',
    'delivered',
    'rejected'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.order_vendors
  alter column status drop default;

alter table public.order_vendors
  alter column status type public.order_vendor_status
  using (
    case status::text
      when 'pending' then 'pending'
      when 'pending_payment' then 'pending'
      when 'paid' then 'accepted'
      when 'accepted' then 'accepted'
      when 'preparing' then 'preparing'
      when 'ready' then 'ready'
      when 'ready_for_pickup' then 'ready'
      when 'driver_assigned' then 'ready'
      when 'collected' then 'collected'
      when 'out_for_delivery' then 'collected'
      when 'delivered' then 'delivered'
      when 'rejected' then 'rejected'
      when 'canceled' then 'rejected'
      when 'refunded' then 'rejected'
      else 'pending'
    end
  )::public.order_vendor_status;

alter table public.order_vendors
  alter column status set default 'pending'::public.order_vendor_status;

alter table public.order_vendors enable row level security;

create index if not exists order_vendors_vendor_order_idx
  on public.order_vendors (vendor_id, order_id);

drop policy if exists "customers view their order vendor rows" on public.order_vendors;
create policy "customers view their order vendor rows"
  on public.order_vendors
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_vendors.order_id
        and o.customer_id = (select auth.uid())
    )
  );

drop policy if exists "vendors view their own order vendor rows" on public.order_vendors;
create policy "vendors view their own order vendor rows"
  on public.order_vendors
  for select
  to authenticated
  using (vendor_id = (select auth.uid()));

-- Prevent direct client writes to order participation rows. Mutations go through the
-- authenticated, ownership-checking RPC below.
revoke all on public.order_vendors from PUBLIC, anon;
revoke insert, update, delete on public.order_vendors from authenticated;
grant select on public.order_vendors to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.update_order_vendor_status(
  p_order_id uuid,
  p_vendor_id uuid,
  p_status public.order_vendor_status,
  p_reason text default null
)
returns table (
  new_order_status public.order_status,
  new_vendor_status public.order_vendor_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_vendor_status public.order_vendor_status;
  v_fulfillment public.fulfillment_type;
  v_current_order_status public.order_status;
  v_next_order_status public.order_status;
  v_active_count integer;
  v_delivered_count integer;
  v_all_ready boolean;
  v_all_collected boolean;
  v_has_accepted boolean;
  v_has_preparing boolean;
  v_transition_allowed boolean := false;
  v_reason text := nullif(btrim(p_reason), '');
begin
  if (select auth.uid()) is null
     or p_vendor_id <> (select auth.uid())
     or not exists (
       select 1
       from public.profiles p
       where p.id = (select auth.uid())
         and p.role = 'vendor'::public.app_role
     ) then
    raise exception 'Not authorized to update this vendor participation'
      using errcode = '42501';
  end if;

  select ov.status, o.fulfillment, o.status
    into v_current_vendor_status, v_fulfillment, v_current_order_status
  from public.order_vendors ov
  join public.orders o on o.id = ov.order_id
  where ov.order_id = p_order_id
    and ov.vendor_id = p_vendor_id
  for update of ov, o;

  if not found then
    raise exception 'Order vendor participation not found'
      using errcode = 'P0002';
  end if;

  if v_current_order_status in (
    'canceled'::public.order_status,
    'refunded'::public.order_status,
    'delivered'::public.order_status
  ) then
    raise exception 'The order is already in a terminal state'
      using errcode = '55000';
  end if;

  if p_status = v_current_vendor_status then
    return query select v_current_order_status, v_current_vendor_status;
    return;
  end if;

  v_transition_allowed := case v_current_vendor_status
    when 'pending' then p_status in ('accepted', 'rejected')
    when 'accepted' then p_status in ('preparing', 'rejected')
    when 'preparing' then p_status in ('ready', 'rejected')
    when 'ready' then (
      (v_fulfillment = 'delivery'::public.fulfillment_type and p_status = 'collected')
      or (v_fulfillment = 'pickup'::public.fulfillment_type and p_status = 'delivered')
      or p_status = 'rejected'
    )
    when 'collected' then p_status = 'delivered'
    else false
  end;

  if not v_transition_allowed then
    raise exception 'Invalid vendor status transition: % -> %',
      v_current_vendor_status, p_status
      using errcode = '22023';
  end if;

  if p_status = 'rejected' and v_reason is null then
    raise exception 'A reason is required when rejecting a vendor participation'
      using errcode = '22023';
  end if;

  update public.order_vendors
  set status = p_status
  where order_id = p_order_id
    and vendor_id = p_vendor_id;

  insert into public.order_events (
    order_id,
    actor_id,
    actor_role,
    event_key,
    label,
    reason,
    details
  )
  values (
    p_order_id,
    (select auth.uid()),
    'vendor'::public.app_role,
    'order_vendor_status_changed',
    'Status da banca atualizado',
    v_reason,
    format('Banca %s: %s -> %s', p_vendor_id, v_current_vendor_status, p_status)
  );

  select
    count(*) filter (where ov.status <> 'rejected'),
    count(*) filter (where ov.status = 'delivered'),
    coalesce(bool_and(ov.status in ('ready', 'collected', 'delivered'))
      filter (where ov.status <> 'rejected'), false),
    coalesce(bool_and(ov.status in ('collected', 'delivered'))
      filter (where ov.status <> 'rejected'), false),
    coalesce(bool_or(ov.status = 'accepted'), false),
    coalesce(bool_or(ov.status = 'preparing'), false)
  into
    v_active_count,
    v_delivered_count,
    v_all_ready,
    v_all_collected,
    v_has_accepted,
    v_has_preparing
  from public.order_vendors ov
  where ov.order_id = p_order_id;

  v_next_order_status := v_current_order_status;

  if v_active_count = 0 then
    v_next_order_status := 'canceled'::public.order_status;
  elsif v_delivered_count = v_active_count then
    v_next_order_status := 'delivered'::public.order_status;
  elsif v_fulfillment = 'pickup'::public.fulfillment_type and v_all_ready then
    v_next_order_status := 'ready_for_pickup'::public.order_status;
  elsif v_fulfillment = 'delivery'::public.fulfillment_type and v_all_collected then
    if v_current_order_status <> 'out_for_delivery'::public.order_status then
      v_next_order_status := 'collected'::public.order_status;
    end if;
  elsif v_fulfillment = 'delivery'::public.fulfillment_type and v_all_ready then
    if v_current_order_status not in (
      'driver_assigned'::public.order_status,
      'out_for_delivery'::public.order_status,
      'collected'::public.order_status
    ) then
      v_next_order_status := 'ready_for_pickup'::public.order_status;
    end if;
  elsif v_has_preparing
    and v_current_order_status in (
      'pending_payment'::public.order_status,
      'paid'::public.order_status,
      'accepted'::public.order_status,
      'preparing'::public.order_status
    ) then
    v_next_order_status := 'preparing'::public.order_status;
  elsif v_has_accepted
    and v_current_order_status in (
      'pending_payment'::public.order_status,
      'paid'::public.order_status
    ) then
    v_next_order_status := 'accepted'::public.order_status;
  end if;

  if v_next_order_status <> v_current_order_status then
    update public.orders
    set status = v_next_order_status,
        updated_at = now()
    where id = p_order_id;

    insert into public.order_events (
      order_id,
      actor_id,
      actor_role,
      event_key,
      label,
      details
    )
    values (
      p_order_id,
      (select auth.uid()),
      'vendor'::public.app_role,
      'order_status_derived_from_vendors',
      'Status geral do pedido atualizado',
      format('Pedido: %s -> %s', v_current_order_status, v_next_order_status)
    );
  end if;

  return query select v_next_order_status, p_status;
end;
$$;

revoke all on function private.update_order_vendor_status(
  uuid, uuid, public.order_vendor_status, text
) from PUBLIC, anon, authenticated;

-- Public API wrapper: only authenticated callers can execute it. The implementation remains
-- in the non-exposed private schema and performs the ownership and transition checks.
create or replace function public.update_order_vendor_status(
  p_order_id uuid,
  p_vendor_id uuid,
  p_status public.order_vendor_status,
  p_reason text default null
)
returns table (
  new_order_status public.order_status,
  new_vendor_status public.order_vendor_status
)
language sql
security definer
set search_path = ''
as $
  select *
  from private.update_order_vendor_status(p_order_id, p_vendor_id, p_status, p_reason);
$$;

grant usage on type public.order_vendor_status to authenticated;
revoke all on function public.update_order_vendor_status(
  uuid, uuid, public.order_vendor_status, text
) from PUBLIC, anon;
grant execute on function public.update_order_vendor_status(
  uuid, uuid, public.order_vendor_status, text
) to authenticated;
