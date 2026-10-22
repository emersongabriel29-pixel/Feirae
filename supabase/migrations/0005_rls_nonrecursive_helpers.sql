-- Feiraê: avoid recursive RLS checks and close direct RPC access to the legacy RLS helper.
-- Private helper functions are not exposed through the Supabase Data API schema list.

grant usage on schema private to authenticated;

create or replace function private.is_order_customer(_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.id = _order_id and o.customer_id = (select auth.uid())
  );
$$;

create or replace function private.is_order_vendor(_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.order_vendors ov
    where ov.order_id = _order_id and ov.vendor_id = (select auth.uid())
  );
$$;

create or replace function private.is_order_delivery(_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.deliveries d
    where d.order_id = _order_id and d.delivery_id = (select auth.uid())
  );
$$;

create or replace function private.is_vendor_order_item(_order_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.order_vendors ov
    where ov.id = _order_vendor_id and ov.vendor_id = (select auth.uid())
  );
$$;

revoke all on function private.is_order_customer(uuid) from public, anon;
revoke all on function private.is_order_vendor(uuid) from public, anon;
revoke all on function private.is_order_delivery(uuid) from public, anon;
revoke all on function private.is_vendor_order_item(uuid) from public, anon;
grant execute on function private.is_order_customer(uuid) to authenticated;
grant execute on function private.is_order_vendor(uuid) to authenticated;
grant execute on function private.is_order_delivery(uuid) to authenticated;
grant execute on function private.is_vendor_order_item(uuid) to authenticated;

drop policy if exists "participants view own orders" on public.orders;
create policy "participants view own orders" on public.orders for select to authenticated
using (private.is_order_customer(id) or private.is_order_vendor(id) or private.is_order_delivery(id));

drop policy if exists "participants view order vendors" on public.order_vendors;
create policy "participants view order vendors" on public.order_vendors for select to authenticated
using (private.is_order_customer(order_id) or vendor_id = (select auth.uid()) or private.is_order_delivery(order_id));

drop policy if exists "participants view order items" on public.order_items;
create policy "participants view order items" on public.order_items for select to authenticated
using (private.is_order_customer(order_id) or private.is_vendor_order_item(order_vendor_id) or private.is_order_delivery(order_id));

drop policy if exists "participants view deliveries" on public.deliveries;
create policy "participants view deliveries" on public.deliveries for select to authenticated
using (private.is_order_customer(order_id) or delivery_id = (select auth.uid()) or private.is_order_vendor(order_id));

drop policy if exists "order participants view events" on public.order_events;
create policy "order participants view events" on public.order_events for select to authenticated
using (private.is_order_customer(order_id) or private.is_order_vendor(order_id) or private.is_order_delivery(order_id));

drop policy if exists "participants view promotion usages" on public.promotion_usages;
create policy "participants view promotion usages" on public.promotion_usages for select to authenticated
using (
  private.is_order_customer(order_id)
  or exists (select 1 from public.promotions p where p.id = promotion_id and p.vendor_id = (select auth.uid()))
);

drop policy if exists "participants create order reviews" on public.order_reviews;
create policy "participants create order reviews" on public.order_reviews for insert to authenticated
with check (
  author_id = (select auth.uid())
  and exists (select 1 from public.orders o where o.id = order_id and o.status = 'delivered')
  and (private.is_order_customer(order_id) or private.is_order_vendor(order_id) or private.is_order_delivery(order_id))
);

-- A legacy SECURITY DEFINER helper was directly callable through /rpc before this hardening.
-- The event trigger can continue to invoke it; client roles do not need direct EXECUTE.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
