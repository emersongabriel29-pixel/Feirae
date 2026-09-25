-- Feiraê operational flow extensions
-- This migration prepares the real backend for the end-to-end flows now exercised by the frontend prototype.

alter type public.order_status add value if not exists 'driver_assigned';
alter type public.order_status add value if not exists 'collected';

alter table public.vendor_stores
  add column if not exists delivery_enabled boolean not null default true,
  add column if not exists pickup_enabled boolean not null default true,
  add column if not exists absorb_delivery_fee boolean not null default false,
  add column if not exists accept_cash_on_delivery boolean not null default true,
  add column if not exists accept_card_on_delivery boolean not null default true,
  add column if not exists custom_opening_hours jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table public.products
  add column if not exists min_stock numeric(12,3) not null default 0,
  add column if not exists weight_kg numeric(12,3) not null default 0 check (weight_kg >= 0),
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.orders
  add column if not exists customer_key_snapshot text,
  add column if not exists payment_method_snapshot text,
  add column if not exists payment_status text not null default 'pending',
  add column if not exists promotion_discount numeric(12,2) not null default 0,
  add column if not exists delivery_subsidy numeric(12,2) not null default 0,
  add column if not exists wallet_used numeric(12,2) not null default 0,
  add column if not exists change_for numeric(12,2),
  add column if not exists refund_amount numeric(12,2) not null default 0,
  add column if not exists pickup_confirmed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.order_items
  add column if not exists estimated_weight_kg numeric(12,3) not null default 0,
  add column if not exists actual_weight_kg numeric(12,3),
  add column if not exists unavailable boolean not null default false,
  add column if not exists substitution_note text;

alter table public.deliveries
  add column if not exists vehicle_id uuid,
  add column if not exists to_vendor_km numeric(10,2),
  add column if not exists vendor_to_customer_km numeric(10,2),
  add column if not exists total_distance_km numeric(10,2),
  add column if not exists eta_minutes integer,
  add column if not exists route_source text,
  add column if not exists collected_at timestamptz,
  add column if not exists out_for_delivery_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.delivery_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  approved boolean not null default false,
  cpf text,
  birth_date date,
  receiving_method text,
  pix_key text,
  bank_name text,
  agency text,
  account_number text,
  cnh text,
  cnh_category text,
  city text,
  state text default 'DF',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_vehicles (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.delivery_profiles(id) on delete cascade,
  vehicle_type text not null,
  brand_model text,
  plate text,
  capacity_kg numeric(12,3) not null check (capacity_kg > 0),
  active boolean not null default true,
  document_status text not null default 'pending',
  document_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deliveries
  drop constraint if exists deliveries_vehicle_id_fkey;
alter table public.deliveries
  add constraint deliveries_vehicle_id_fkey
  foreign key (vehicle_id) references public.delivery_vehicles(id) on delete set null;

create table if not exists public.delivery_preferences (
  delivery_id uuid primary key references public.delivery_profiles(id) on delete cascade,
  online boolean not null default false,
  radius_km numeric(8,2) not null default 10 check (radius_km > 0),
  preferred_distance_km numeric(8,2),
  regions text[] not null default '{}',
  auto_schedule boolean not null default false,
  schedule_start time,
  schedule_end time,
  base_location geography(point,4326),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  file_path text,
  status text not null default 'pending'
    check (status in ('pending','under_review','approved','correction_required','rejected')),
  expires_at date,
  correction_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, document_type)
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendor_profiles(id) on delete cascade,
  store_id uuid references public.vendor_stores(id) on delete cascade,
  promotion_type text not null,
  name text not null,
  rule_text text not null,
  discount_value numeric(12,2),
  target text,
  minimum_order numeric(12,2) not null default 0,
  usage_limit integer not null default 0,
  used_count integer not null default 0,
  vendor_pays_delivery boolean not null default false,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_usages (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  discount_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(promotion_id, order_id)
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.app_role,
  event_key text not null,
  label text not null,
  reason text,
  details text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  opened_by uuid not null references public.profiles(id),
  actor_role public.app_role not null,
  topic text not null,
  details text,
  priority text not null default 'normal' check (priority in ('normal','urgent')),
  status text not null default 'open' check (status in ('open','resolved','closed')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  author_role public.app_role not null,
  target_role text not null check (target_role in ('customer','vendor','delivery','product','app')),
  target_id text,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  role public.app_role not null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'available'
    check (status in ('pending','available','requested','paid','failed')),
  provider_reference text,
  requested_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  entry_type text not null check (entry_type in ('refund_credit','purchase_debit','adjustment')),
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists delivery_vehicles_delivery_idx on public.delivery_vehicles(delivery_id);
create index if not exists order_events_order_created_idx on public.order_events(order_id, created_at);
create index if not exists support_tickets_order_idx on public.support_tickets(order_id);
create index if not exists order_reviews_order_idx on public.order_reviews(order_id);
create index if not exists payouts_profile_status_idx on public.payouts(profile_id, status);
create index if not exists promotions_vendor_active_idx on public.promotions(vendor_id, active);

alter table public.delivery_profiles enable row level security;
alter table public.delivery_vehicles enable row level security;
alter table public.delivery_preferences enable row level security;
alter table public.onboarding_documents enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_usages enable row level security;
alter table public.order_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.order_reviews enable row level security;
alter table public.payouts enable row level security;
alter table public.wallet_entries enable row level security;

drop policy if exists "delivery manages own profile" on public.delivery_profiles;
create policy "delivery manages own profile"
on public.delivery_profiles for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "delivery manages own vehicles" on public.delivery_vehicles;
create policy "delivery manages own vehicles"
on public.delivery_vehicles for all
using (delivery_id = auth.uid())
with check (delivery_id = auth.uid());

drop policy if exists "delivery manages own preferences" on public.delivery_preferences;
create policy "delivery manages own preferences"
on public.delivery_preferences for all
using (delivery_id = auth.uid())
with check (delivery_id = auth.uid());

drop policy if exists "users view own onboarding documents" on public.onboarding_documents;
create policy "users view own onboarding documents"
on public.onboarding_documents for select
using (profile_id = auth.uid());

drop policy if exists "users upload own onboarding documents" on public.onboarding_documents;
create policy "users upload own onboarding documents"
on public.onboarding_documents for insert
with check (profile_id = auth.uid());

drop policy if exists "users update own pending onboarding documents" on public.onboarding_documents;
create policy "users update own pending onboarding documents"
on public.onboarding_documents for update
using (profile_id = auth.uid() and status in ('pending','correction_required'))
with check (profile_id = auth.uid() and status = 'under_review');

drop policy if exists "public views active promotions" on public.promotions;
create policy "public views active promotions"
on public.promotions for select
using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));

drop policy if exists "vendors manage own promotions" on public.promotions;
create policy "vendors manage own promotions"
on public.promotions for all
using (vendor_id = auth.uid())
with check (vendor_id = auth.uid());

drop policy if exists "order participants view events" on public.order_events;
create policy "order participants view events"
on public.order_events for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.customer_id = auth.uid()
        or exists (
          select 1 from public.order_vendors ov
          where ov.order_id = o.id and ov.vendor_id = auth.uid()
        )
        or exists (
          select 1 from public.deliveries d
          where d.order_id = o.id and d.delivery_id = auth.uid()
        )
      )
  )
);

drop policy if exists "users view own wallet entries" on public.wallet_entries;
create policy "users view own wallet entries"
on public.wallet_entries for select
using (customer_id = auth.uid());

drop policy if exists "users view own payouts" on public.payouts;
create policy "users view own payouts"
on public.payouts for select
using (profile_id = auth.uid());

-- Critical mutations (payment confirmation, stock reservation, order transitions,
-- document approval, payout settlement and wallet credits) must be performed
-- through trusted server-side functions / Edge Functions using idempotency keys.
