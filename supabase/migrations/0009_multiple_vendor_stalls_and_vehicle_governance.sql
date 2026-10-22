-- Multi-stall vendor operations and per-vehicle delivery governance.
-- Existing rows are preserved. Frontend persistence is still local/demo and is not a Supabase integration.

alter table public.vendor_stores
  add column if not exists fair_id uuid references public.fairs(id) on delete restrict,
  add column if not exists stall_label text,
  add column if not exists sector text,
  add column if not exists corridor text,
  add column if not exists box text,
  add column if not exists reference_point text,
  add column if not exists location geography(point,4326),
  add column if not exists internal_x numeric(10,2),
  add column if not exists internal_y numeric(10,2),
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.vendor_stores
  drop constraint if exists vendor_stores_approval_status_check;
alter table public.vendor_stores
  add constraint vendor_stores_approval_status_check
  check (approval_status in ('pending','under_review','approved','correction_required','suspended'));

-- Backfill fair_id only when the legacy vendor has exactly one fair membership.
-- Copy the old membership coordinate only when the vendor has exactly one store as well;
-- never assign one physical coordinate to several distinct stalls.
with single_fair_membership as (
  select m.vendor_id, m.fair_id, m.stall_location
  from public.fair_vendor_memberships m
  where (select count(*) from public.fair_vendor_memberships m2 where m2.vendor_id = m.vendor_id) = 1
)
update public.vendor_stores vs
set fair_id = coalesce(vs.fair_id, m.fair_id),
    location = case
      when (select count(*) from public.vendor_stores sibling where sibling.vendor_id = vs.vendor_id) = 1
      then coalesce(vs.location, m.stall_location)
      else vs.location
    end,
    approval_status = case when vp.approved then 'approved' else 'pending' end
from public.vendor_profiles vp
left join single_fair_membership m on m.vendor_id = vp.id
where vp.id = vs.vendor_id
  and vs.approval_status = 'pending';

create index if not exists vendor_stores_vendor_idx on public.vendor_stores(vendor_id);
create index if not exists vendor_stores_fair_idx on public.vendor_stores(fair_id);
create index if not exists vendor_stores_fair_vendor_idx on public.vendor_stores(fair_id, vendor_id);
create index if not exists vendor_stores_location_gix on public.vendor_stores using gist(location);

-- A delivery worker can own several vehicles, including several vehicles of the same type.
-- Approval is distinct from document review and historical deliveries keep their vehicle_id.
alter table public.delivery_vehicles
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text,
  add column if not exists last_used_at timestamptz;

alter table public.delivery_vehicles
  drop constraint if exists delivery_vehicles_approval_status_check;
alter table public.delivery_vehicles
  add constraint delivery_vehicles_approval_status_check
  check (approval_status in ('pending','under_review','approved','correction_required','suspended'));

create index if not exists delivery_vehicles_eligible_idx
  on public.delivery_vehicles(delivery_id, active, approval_status);
create index if not exists deliveries_vehicle_history_idx
  on public.deliveries(vehicle_id, created_at desc);

-- Prevent authenticated clients from setting or changing approval/suspension metadata.
-- A trusted service-role operation is required for approval decisions.
create or replace function public.guard_operational_approval_metadata()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      if new.approval_status <> 'pending'
        or new.approved_by is not null
        or new.approved_at is not null
        or new.suspended_at is not null
        or new.suspension_reason is not null then
        raise exception 'Approval metadata can only be set by trusted administrative operations'
          using errcode = '42501';
      end if;
    elsif new.approval_status is distinct from old.approval_status
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at
      or new.suspended_at is distinct from old.suspended_at
      or new.suspension_reason is distinct from old.suspension_reason then
      raise exception 'Approval metadata can only be changed by trusted administrative operations'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_stores_guard_approval on public.vendor_stores;
create trigger vendor_stores_guard_approval
before insert or update on public.vendor_stores
for each row execute function public.guard_operational_approval_metadata();

drop trigger if exists delivery_vehicles_guard_approval on public.delivery_vehicles;
create trigger delivery_vehicles_guard_approval
before insert or update on public.delivery_vehicles
for each row execute function public.guard_operational_approval_metadata();

-- Public catalog access is limited to approved stalls attached to active fairs.
alter table public.vendor_stores enable row level security;

drop policy if exists "public views approved vendor stores" on public.vendor_stores;
create policy "public views approved vendor stores"
on public.vendor_stores for select
using (
  approval_status = 'approved'
  and exists (
    select 1 from public.fairs f
    where f.id = fair_id and f.is_active = true
  )
);

drop policy if exists "vendors manage own stores" on public.vendor_stores;
create policy "vendors manage own stores"
on public.vendor_stores for all
using (vendor_id = auth.uid())
with check (vendor_id = auth.uid());

-- The trigger above prevents owners from self-approving or self-suspending vehicles.
-- RLS still limits normal vehicle CRUD to the owning delivery profile.
drop policy if exists "delivery manages own vehicles" on public.delivery_vehicles;
create policy "delivery manages own vehicles"
on public.delivery_vehicles for all
using (delivery_id = auth.uid())
with check (delivery_id = auth.uid());

-- Production rollout still requires SQL execution in a non-production environment,
-- RLS tests for owner/other-user/visitor/admin, and a trusted admin operation that records
-- approval metadata. The current frontend does not yet write these records to Supabase.
