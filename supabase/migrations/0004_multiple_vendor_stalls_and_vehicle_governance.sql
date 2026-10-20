-- Multi-stall vendor operations and per-vehicle delivery governance.
-- Safe for existing rows: new fields are nullable or have conservative defaults.
-- This prepares the Supabase schema; the current frontend still uses local demo persistence.

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

-- Preserve current vendor approval for legacy stores while requiring review for new ones.
update public.vendor_stores vs
set approval_status = case when vp.approved then 'approved' else 'pending' end
from public.vendor_profiles vp
where vp.id = vs.vendor_id
  and vs.approval_status = 'pending';

create index if not exists vendor_stores_vendor_idx on public.vendor_stores(vendor_id);
create index if not exists vendor_stores_fair_idx on public.vendor_stores(fair_id);
create index if not exists vendor_stores_fair_vendor_idx on public.vendor_stores(fair_id, vendor_id);
create index if not exists vendor_stores_location_gix on public.vendor_stores using gist(location);

-- A delivery worker can own several vehicles, including several vehicles of the same type.
-- Keep approval separate from document review and retain historical vehicle references on deliveries.
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

-- Do not expose unapproved or suspended stalls in public catalog reads.
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

-- Delivery-vehicle RLS already restricts rows to the owning delivery profile.
-- Administrative approval/suspension must be performed only by a trusted server-side
-- operation; do not let a delivery worker self-approve by updating approval_status.
drop policy if exists "delivery manages own vehicles" on public.delivery_vehicles;
create policy "delivery manages own vehicles"
on public.delivery_vehicles for all
using (delivery_id = auth.uid())
with check (
  delivery_id = auth.uid()
  and approval_status = coalesce(
    (select current_vehicle.approval_status
     from public.delivery_vehicles current_vehicle
     where current_vehicle.id = id),
    approval_status
  )
);

-- Before production, replace the policy above with column-safe RPCs:
-- users may edit vehicle details/documents, while only trusted admin functions may approve
-- or suspend vehicles. The frontend is currently demonstrative and does not write to Supabase.
