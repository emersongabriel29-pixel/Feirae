-- Feiraê management console and runtime configuration
-- This migration creates data-driven settings so the application can be operated
-- without editing source code for routine commercial and operational changes.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_feirae_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    );
$;

revoke all on function private.is_feirae_admin() from public, anon, authenticated;
grant execute on function private.is_feirae_admin() to authenticated;

create table if not exists public.platform_settings (
  key text primary key,
  category text not null,
  label text not null,
  value jsonb not null,
  description text,
  public_readable boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.service_states (
  code text primary key check (char_length(code) = 2),
  name text not null,
  customer_orders_enabled boolean not null default false,
  vendor_registration_enabled boolean not null default false,
  delivery_enabled boolean not null default false,
  active boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.service_regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  state text not null default 'DF' references public.service_states(code),
  city text,
  customer_orders_enabled boolean not null default true,
  vendor_registration_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  default_radius_km numeric(8,2) not null default 10 check (default_radius_km > 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_type_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  default_capacity_kg numeric(12,3) not null check (default_capacity_kg > 0),
  requires_plate boolean not null default false,
  requires_vehicle_document boolean not null default false,
  requires_cnh boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_fee_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  priority integer not null default 100,
  region_id uuid references public.service_regions(id) on delete set null,
  vehicle_code text,
  base_fee numeric(12,2) not null default 0 check (base_fee >= 0),
  per_km numeric(12,2) not null default 0 check (per_km >= 0),
  per_minute numeric(12,2) not null default 0 check (per_minute >= 0),
  per_kg numeric(12,2) not null default 0 check (per_kg >= 0),
  minimum_charge numeric(12,2) not null default 0 check (minimum_charge >= 0),
  maximum_charge numeric(12,2),
  minimum_driver_payout numeric(12,2) not null default 0 check (minimum_driver_payout >= 0),
  platform_fee_percent numeric(6,3) not null default 0 check (platform_fee_percent >= 0),
  max_distance_km numeric(8,2),
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_fee_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope text not null check (scope in ('order','vendor','delivery','payment')),
  percentage numeric(6,3) not null default 0 check (percentage >= 0),
  fixed_amount numeric(12,2) not null default 0 check (fixed_amount >= 0),
  active boolean not null default true,
  priority integer not null default 100,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.cancellation_reasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  actor_role text not null check (actor_role in ('customer','vendor','delivery','admin')),
  flow_stage text not null default 'before_pickup',
  label text not null,
  requires_details boolean not null default false,
  opens_support_ticket boolean not null default false,
  penalty_amount numeric(12,2) not null default 0 check (penalty_amount >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_method_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  method_type text not null check (method_type in ('pix','credit_card','debit_card','cash','card_on_delivery','wallet','other')),
  active boolean not null default true,
  customer_enabled boolean not null default true,
  vendor_enabled boolean not null default true,
  delivery_enabled boolean not null default true,
  requires_online_provider boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_requirements (
  id uuid primary key default gen_random_uuid(),
  profile_role public.app_role not null,
  document_type text not null,
  vehicle_type text,
  label text not null,
  required boolean not null default true,
  critical boolean not null default true,
  expiration_required boolean not null default false,
  instructions text,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(profile_role, document_type, vehicle_type)
);

create table if not exists public.feature_flags (
  key text primary key,
  label text not null,
  enabled boolean not null default false,
  public_readable boolean not null default true,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.content_blocks (
  key text primary key,
  area text not null,
  title text,
  body text,
  media_url text,
  action_label text,
  action_url text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_templates (
  key text primary key,
  channel text not null check (channel in ('in_app','push','email','whatsapp','sms')),
  audience text not null default 'customer',
  title_template text,
  body_template text not null,
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.integration_registry (
  key text primary key,
  provider text not null,
  label text not null,
  enabled boolean not null default false,
  environment text not null default 'sandbox',
  status text not null default 'not_configured',
  public_config jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  notes text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.system_announcements (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'all',
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info','success','warning','critical')),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  request_type text not null check (request_type in ('access','correction','deletion','portability','consent_withdrawal','other')),
  details text,
  status text not null default 'open' check (status in ('open','in_review','completed','rejected')),
  handled_by uuid references public.profiles(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.fairs
  add column if not exists state text not null default 'DF' references public.service_states(code),
  add column if not exists city text;

create table if not exists public.account_enforcements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('suspension','ban','orders_block','sales_block','deliveries_block')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  reason text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (action_type <> 'suspension' or ends_at is not null),
  check (ends_at is null or ends_at > starts_at)
);

create index if not exists account_enforcements_profile_active_idx
  on public.account_enforcements(profile_id, status, starts_at, ends_at);

create or replace function private.stamp_account_enforcement()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $
begin
  new.updated_at := now();
  if new.status = 'revoked' and old.status is distinct from 'revoked' then
    new.revoked_by := (select auth.uid());
    new.revoked_at := now();
  elsif new.status <> 'revoked' then
    new.revoked_by := null;
    new.revoked_at := null;
  end if;
  return new;
end;
$;

revoke all on function private.stamp_account_enforcement() from public, anon, authenticated;

drop trigger if exists feirae_stamp_account_enforcement on public.account_enforcements;
create trigger feirae_stamp_account_enforcement
before update on public.account_enforcements
for each row execute function private.stamp_account_enforcement();

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null,
  granted_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique(profile_id, permission)
);

create or replace function private.feirae_admin_has(required_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $
  select
    (select private.is_feirae_admin())
    and (
      not exists (
        select 1 from public.admin_permissions ap
        where ap.profile_id = (select auth.uid())
      )
      or exists (
        select 1 from public.admin_permissions ap
        where ap.profile_id = (select auth.uid())
          and ap.permission in ('*', required_permission)
      )
    );
$;

revoke all on function private.feirae_admin_has(text) from public, anon, authenticated;
grant execute on function private.feirae_admin_has(text) to authenticated;

create or replace function private.protect_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $
begin
  if tg_op = 'INSERT' then
    if new.role in ('admin','fair_manager')
       and (select auth.uid()) is not null
       and not (select private.feirae_admin_has('permissions.manage')) then
      raise exception 'Administrative roles cannot be self-assigned.';
    end if;
  elsif new.role is distinct from old.role
        and not (select private.feirae_admin_has('permissions.manage')) then
    raise exception 'Only an authorized administrator can change profile roles.';
  end if;
  return new;
end;
$;

revoke all on function private.protect_profile_role() from public, anon, authenticated;

drop trigger if exists feirae_protect_profile_role on public.profiles;
create trigger feirae_protect_profile_role
before insert or update of role on public.profiles
for each row execute function private.protect_profile_role();

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.order_reviews
  add column if not exists visible boolean not null default true,
  add column if not exists moderation_reason text,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_at timestamptz;

alter table public.reviews
  add column if not exists visible boolean not null default true,
  add column if not exists moderation_reason text,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_at timestamptz;

-- Runtime defaults. These are intentionally non-secret.
insert into public.platform_settings (key, category, label, value, description, public_readable)
values
  ('general.maintenance_mode','general','Modo manutenção','false'::jsonb,'Bloqueia novas operações quando ativado.',true),
  ('general.registrations_enabled','general','Novos cadastros','true'::jsonb,'Permite novos cadastros no aplicativo.',true),
  ('general.support_email','general','E-mail de suporte','""'::jsonb,'Contato exibido no aplicativo.',true),
  ('general.support_whatsapp','general','WhatsApp de suporte','""'::jsonb,'Contato exibido no aplicativo.',true),
  ('general.whatsapp_consent_text','general','Texto de consentimento WhatsApp','"Autorizo receber mensagens via WhatsApp sobre meu pedido."'::jsonb,'Texto mostrado no checkout.',true),
  ('orders.cancel_before_pickup_enabled','orders','Cancelamento antes da coleta','true'::jsonb,'Permite cancelamento simples antes da coleta.',true),
  ('orders.post_pickup_requires_support','orders','Após coleta abrir suporte','true'::jsonb,'Depois da coleta, direciona o cancelamento para suporte.',true),
  ('orders.auto_expire_minutes','orders','Expiração de pedido (min)','15'::jsonb,'Tempo padrão para expiração quando aplicável.',false),
  ('logistics.default_delivery_radius_km','logistics','Raio padrão de entrega','10'::jsonb,'Raio inicial sugerido para entregadores.',true),
  ('logistics.max_order_weight_kg','logistics','Peso máximo operacional','500'::jsonb,'Limite global antes de regras específicas.',true),
  ('logistics.driver_offer_timeout_seconds','logistics','Tempo de oferta da corrida','60'::jsonb,'Tempo de resposta antes de ofertar a outro entregador.',false),
  ('finance.minimum_payout_amount','finance','Saque mínimo','20'::jsonb,'Valor mínimo de saque, se o provedor permitir saque manual.',false),
  ('finance.payout_delay_days','finance','Prazo padrão de liberação','2'::jsonb,'Dias para tornar o valor disponível quando aplicável.',false),
  ('catalog.allow_multi_fair_cart','catalog','Carrinho com várias feiras','false'::jsonb,'Mantém uma compra vinculada a uma feira por padrão.',true),
  ('documents.storage_bucket','documents','Bucket de documentos','"onboarding-documents"'::jsonb,'Bucket privado usado para documentos de cadastro. O nome do bucket não é segredo.',true)
on conflict (key) do nothing;

insert into public.service_states
  (code, name, customer_orders_enabled, vendor_registration_enabled, delivery_enabled, active, sort_order)
values
  ('AC','Acre',false,false,false,false,10),
  ('AL','Alagoas',false,false,false,false,20),
  ('AP','Amapá',false,false,false,false,30),
  ('AM','Amazonas',false,false,false,false,40),
  ('BA','Bahia',false,false,false,false,50),
  ('CE','Ceará',false,false,false,false,60),
  ('DF','Distrito Federal',true,true,true,true,70),
  ('ES','Espírito Santo',false,false,false,false,80),
  ('GO','Goiás',false,false,false,false,90),
  ('MA','Maranhão',false,false,false,false,100),
  ('MT','Mato Grosso',false,false,false,false,110),
  ('MS','Mato Grosso do Sul',false,false,false,false,120),
  ('MG','Minas Gerais',false,false,false,false,130),
  ('PA','Pará',false,false,false,false,140),
  ('PB','Paraíba',false,false,false,false,150),
  ('PR','Paraná',false,false,false,false,160),
  ('PE','Pernambuco',false,false,false,false,170),
  ('PI','Piauí',false,false,false,false,180),
  ('RJ','Rio de Janeiro',false,false,false,false,190),
  ('RN','Rio Grande do Norte',false,false,false,false,200),
  ('RS','Rio Grande do Sul',false,false,false,false,210),
  ('RO','Rondônia',false,false,false,false,220),
  ('RR','Roraima',false,false,false,false,230),
  ('SC','Santa Catarina',false,false,false,false,240),
  ('SP','São Paulo',false,false,false,false,250),
  ('SE','Sergipe',false,false,false,false,260),
  ('TO','Tocantins',false,false,false,false,270)
on conflict (code) do nothing;

insert into public.feature_flags (key, label, enabled, description)
values
  ('cash_on_delivery','Pagamento na entrega',false,'Libera dinheiro/maquininha quando banca e operação permitirem.'),
  ('multi_vendor_checkout','Checkout multi-banca',true,'Permite compra em mais de uma banca da mesma feira.'),
  ('driver_auto_schedule','Horário automático do entregador',true,'Permite disponibilidade programada.'),
  ('whatsapp_order_updates','Atualizações via WhatsApp',false,'Habilita mensagens transacionais após integração.'),
  ('promotions','Promoções e cupons',true,'Controla recursos promocionais.'),
  ('wallet_credit','Crédito em carteira',true,'Permite uso de créditos de estorno.')
on conflict (key) do nothing;

insert into public.vehicle_type_rules
  (code, display_name, default_capacity_kg, requires_plate, requires_vehicle_document, requires_cnh, sort_order)
values
  ('bike','Bicicleta',10,false,false,false,10),
  ('cargo_bike','Bicicleta cargueira/triciclo',40,false,false,false,20),
  ('motorcycle','Moto',12,true,true,true,30),
  ('motorcycle_box','Moto com baú',20,true,true,true,40),
  ('car','Carro',80,true,true,true,50),
  ('pickup','Utilitário/Pickup',250,true,true,true,60),
  ('van','Van',500,true,true,true,70),
  ('other','Outro',10,false,false,false,80)
on conflict (code) do nothing;

insert into public.payment_method_rules
  (code, label, method_type, active, requires_online_provider, sort_order)
values
  ('pix','Pix','pix',true,true,10),
  ('credit_card','Cartão de crédito','credit_card',true,true,20),
  ('debit_card','Cartão de débito','debit_card',true,true,30),
  ('wallet','Crédito Feiraê','wallet',true,false,40),
  ('cash_on_delivery','Dinheiro na entrega','cash',false,false,50),
  ('card_on_delivery','Maquininha na entrega','card_on_delivery',false,false,60)
on conflict (code) do nothing;

insert into public.cancellation_reasons
  (code, actor_role, flow_stage, label, requires_details, opens_support_ticket, sort_order)
values
  ('customer_changed_mind','customer','before_pickup','Desisti da compra',false,false,10),
  ('customer_wrong_address','customer','before_pickup','Endereço incorreto',true,false,20),
  ('vendor_item_unavailable','vendor','before_pickup','Produto indisponível',true,false,30),
  ('vendor_operational_issue','vendor','before_pickup','Problema operacional na banca',true,false,40),
  ('delivery_vehicle_issue','delivery','before_pickup','Problema com o veículo',true,false,50),
  ('delivery_unsafe_route','delivery','before_pickup','Rota ou local inseguro',true,true,60),
  ('post_pickup_issue','admin','after_pickup','Ocorrência após coleta',true,true,70)
on conflict (code) do nothing;

insert into public.integration_registry (key, provider, label, enabled, status)
values
  ('maps','google_maps','Mapas e rotas',false,'not_configured'),
  ('payments','payment_provider','Pagamentos e split',false,'not_configured'),
  ('whatsapp','whatsapp_provider','WhatsApp transacional',false,'not_configured'),
  ('push','push_provider','Notificações push',false,'not_configured')
on conflict (key) do nothing;

-- Explicit Data API grants. Supabase no longer guarantees automatic exposure for new tables.
grant select on table
  public.platform_settings,
  public.service_states,
  public.service_regions,
  public.vehicle_type_rules,
  public.cancellation_reasons,
  public.payment_method_rules,
  public.onboarding_requirements,
  public.feature_flags,
  public.content_blocks,
  public.system_announcements
to anon;

grant select on table
  public.platform_settings,
  public.service_states,
  public.service_regions,
  public.vehicle_type_rules,
  public.delivery_fee_rules,
  public.platform_fee_rules,
  public.cancellation_reasons,
  public.payment_method_rules,
  public.onboarding_requirements,
  public.feature_flags,
  public.content_blocks,
  public.notification_templates,
  public.integration_registry,
  public.system_announcements,
  public.privacy_requests,
  public.account_enforcements,
  public.admin_permissions,
  public.admin_audit_logs
to authenticated;

grant insert, update, delete on table
  public.platform_settings,
  public.service_states,
  public.service_regions,
  public.vehicle_type_rules,
  public.delivery_fee_rules,
  public.platform_fee_rules,
  public.cancellation_reasons,
  public.payment_method_rules,
  public.onboarding_requirements,
  public.feature_flags,
  public.content_blocks,
  public.notification_templates,
  public.integration_registry,
  public.system_announcements,
  public.privacy_requests,
  public.account_enforcements,
  public.admin_permissions
to authenticated;

grant insert on table public.admin_audit_logs to authenticated;
grant usage, select on sequence public.admin_audit_logs_id_seq to authenticated;

-- Explicit privileges for legacy operational tables used by the management console.
grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.deliveries to authenticated;

-- Reporting reads. RLS below decides which rows an administrator may see.
grant select on table
  public.profiles,
  public.orders,
  public.payouts,
  public.support_tickets,
  public.onboarding_documents,
  public.order_reviews
to authenticated;

-- RLS for management data.
alter table public.categories enable row level security;
alter table public.deliveries enable row level security;
alter table public.platform_settings enable row level security;
alter table public.service_states enable row level security;
alter table public.service_regions enable row level security;
alter table public.vehicle_type_rules enable row level security;
alter table public.delivery_fee_rules enable row level security;
alter table public.platform_fee_rules enable row level security;
alter table public.cancellation_reasons enable row level security;
alter table public.payment_method_rules enable row level security;
alter table public.onboarding_requirements enable row level security;
alter table public.feature_flags enable row level security;
alter table public.content_blocks enable row level security;
alter table public.notification_templates enable row level security;
alter table public.integration_registry enable row level security;
alter table public.system_announcements enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.account_enforcements enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories"
on public.categories for select
to anon, authenticated
using (active);

create policy "admins manage categories"
on public.categories for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

drop policy if exists "order participants read deliveries" on public.deliveries;
create policy "order participants read deliveries"
on public.deliveries for select
to authenticated
using (
  delivery_id = (select auth.uid())
  or exists (
    select 1
    from public.orders o
    where o.id = order_id
      and (
        o.customer_id = (select auth.uid())
        or exists (
          select 1
          from public.order_vendors ov
          where ov.order_id = o.id
            and ov.vendor_id = (select auth.uid())
        )
      )
  )
);

create policy "admins manage deliveries"
on public.deliveries for all
to authenticated
using ((select private.feirae_admin_has('operations.manage')))
with check ((select private.feirae_admin_has('operations.manage')));

create policy "admins view profiles in reports"
on public.profiles for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view orders in reports"
on public.orders for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view deliveries in reports"
on public.deliveries for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view payouts in reports"
on public.payouts for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view support in reports"
on public.support_tickets for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view document metadata in reports"
on public.onboarding_documents for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view reviews in reports"
on public.order_reviews for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "admins view enforcements in reports"
on public.account_enforcements for select
to authenticated
using ((select private.feirae_admin_has('reports.view')));

create policy "public read public settings"
on public.platform_settings for select
to anon, authenticated
using (public_readable);

create policy "public read active states"
on public.service_states for select
to anon, authenticated
using (active);

create policy "public read active regions"
on public.service_regions for select
to anon, authenticated
using (active);

create policy "public read active vehicle rules"
on public.vehicle_type_rules for select
to anon, authenticated
using (active);

create policy "public read active cancellation reasons"
on public.cancellation_reasons for select
to anon, authenticated
using (active);

create policy "public read active payment methods"
on public.payment_method_rules for select
to anon, authenticated
using (active);

create policy "public read active onboarding requirements"
on public.onboarding_requirements for select
to anon, authenticated
using (active);

create policy "public read public feature flags"
on public.feature_flags for select
to anon, authenticated
using (public_readable);

create policy "public read active content"
on public.content_blocks for select
to anon, authenticated
using (
  active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy "public read active announcements"
on public.system_announcements for select
to anon, authenticated
using (
  active
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

create policy "admins manage platform settings"
on public.platform_settings for all
to authenticated
using ((select private.feirae_admin_has('settings.manage')))
with check ((select private.feirae_admin_has('settings.manage')));

create policy "admins manage service states"
on public.service_states for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage service regions"
on public.service_regions for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage vehicle rules"
on public.vehicle_type_rules for all
to authenticated
using ((select private.feirae_admin_has('rules.manage')))
with check ((select private.feirae_admin_has('rules.manage')));

create policy "admins manage delivery fee rules"
on public.delivery_fee_rules for all
to authenticated
using ((select private.feirae_admin_has('rules.manage')))
with check ((select private.feirae_admin_has('rules.manage')));

create policy "admins manage platform fee rules"
on public.platform_fee_rules for all
to authenticated
using ((select private.feirae_admin_has('rules.manage')))
with check ((select private.feirae_admin_has('rules.manage')));

create policy "admins manage cancellation reasons"
on public.cancellation_reasons for all
to authenticated
using ((select private.feirae_admin_has('rules.manage')))
with check ((select private.feirae_admin_has('rules.manage')));

create policy "admins manage payment methods"
on public.payment_method_rules for all
to authenticated
using ((select private.feirae_admin_has('rules.manage')))
with check ((select private.feirae_admin_has('rules.manage')));

create policy "admins manage onboarding requirements"
on public.onboarding_requirements for all
to authenticated
using ((select private.feirae_admin_has('rules.manage')))
with check ((select private.feirae_admin_has('rules.manage')));

create policy "admins manage feature flags"
on public.feature_flags for all
to authenticated
using ((select private.feirae_admin_has('settings.manage')))
with check ((select private.feirae_admin_has('settings.manage')));

create policy "admins manage content blocks"
on public.content_blocks for all
to authenticated
using ((select private.feirae_admin_has('communications.manage')))
with check ((select private.feirae_admin_has('communications.manage')));

create policy "admins manage notification templates"
on public.notification_templates for all
to authenticated
using ((select private.feirae_admin_has('communications.manage')))
with check ((select private.feirae_admin_has('communications.manage')));

create policy "admins manage integration registry"
on public.integration_registry for all
to authenticated
using ((select private.feirae_admin_has('settings.manage')))
with check ((select private.feirae_admin_has('settings.manage')));

create policy "admins manage announcements"
on public.system_announcements for all
to authenticated
using ((select private.feirae_admin_has('communications.manage')))
with check ((select private.feirae_admin_has('communications.manage')));

create policy "admins manage privacy requests"
on public.privacy_requests for all
to authenticated
using ((select private.feirae_admin_has('settings.manage')))
with check ((select private.feirae_admin_has('settings.manage')));

create policy "users read own enforcement history"
on public.account_enforcements for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "admins manage enforcements"
on public.account_enforcements for all
to authenticated
using ((select private.feirae_admin_has('accounts.enforce')))
with check ((select private.feirae_admin_has('accounts.enforce')));

create policy "admins read own permission set"
on public.admin_permissions for select
to authenticated
using (
  profile_id = (select auth.uid())
  and (select private.is_feirae_admin())
);

create policy "admins manage permissions"
on public.admin_permissions for all
to authenticated
using ((select private.feirae_admin_has('permissions.manage')))
with check ((select private.feirae_admin_has('permissions.manage')));

create policy "admins read audit logs"
on public.admin_audit_logs for select
to authenticated
using ((select private.feirae_admin_has('audit.view')));

create policy "admins write audit logs"
on public.admin_audit_logs for insert
to authenticated
with check ((select private.is_feirae_admin()));

-- Private onboarding files remain in Supabase Storage. This policy lets admins
-- read objects from the configured default bucket through the Storage API.
drop policy if exists "feirae admins read onboarding documents" on storage.objects;
create policy "feirae admins read onboarding documents"
on storage.objects for select
to authenticated
using (
  bucket_id = coalesce(
    (
      select ps.value #>> '{}'
      from public.platform_settings ps
      where ps.key = 'documents.storage_bucket'
    ),
    'onboarding-documents'
  )
  and (select private.feirae_admin_has('documents.review'))
);

-- Admin access to operational entities that already use RLS.
create policy "admins manage profiles"
on public.profiles for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage fairs"
on public.fairs for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage vendors"
on public.vendor_profiles for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage products"
on public.products for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage orders"
on public.orders for all
to authenticated
using ((select private.feirae_admin_has('operations.manage')))
with check ((select private.feirae_admin_has('operations.manage')));

create policy "admins manage delivery profiles"
on public.delivery_profiles for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage delivery vehicles"
on public.delivery_vehicles for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage delivery preferences"
on public.delivery_preferences for all
to authenticated
using ((select private.feirae_admin_has('registrations.manage')))
with check ((select private.feirae_admin_has('registrations.manage')));

create policy "admins manage onboarding documents"
on public.onboarding_documents for all
to authenticated
using ((select private.feirae_admin_has('documents.review')))
with check ((select private.feirae_admin_has('documents.review')));

create policy "admins manage promotions"
on public.promotions for all
to authenticated
using ((select private.feirae_admin_has('finance.manage')))
with check ((select private.feirae_admin_has('finance.manage')));

create policy "admins manage promotion usages"
on public.promotion_usages for all
to authenticated
using ((select private.feirae_admin_has('finance.manage')))
with check ((select private.feirae_admin_has('finance.manage')));

create policy "admins manage order events"
on public.order_events for all
to authenticated
using ((select private.feirae_admin_has('operations.manage')))
with check ((select private.feirae_admin_has('operations.manage')));

create policy "admins manage support tickets"
on public.support_tickets for all
to authenticated
using ((select private.feirae_admin_has('operations.manage')))
with check ((select private.feirae_admin_has('operations.manage')));

create policy "admins manage order reviews"
on public.order_reviews for all
to authenticated
using ((select private.feirae_admin_has('finance.manage')))
with check ((select private.feirae_admin_has('finance.manage')));

create policy "admins manage payouts"
on public.payouts for all
to authenticated
using ((select private.feirae_admin_has('finance.manage')))
with check ((select private.feirae_admin_has('finance.manage')));

create policy "admins manage wallet entries"
on public.wallet_entries for all
to authenticated
using ((select private.feirae_admin_has('finance.manage')))
with check ((select private.feirae_admin_has('finance.manage')));

-- Automatic audit trail for management/configuration tables.
create or replace function private.log_feirae_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row jsonb;
  after_row jsonb;
  record_id text;
begin
  if not (select private.is_feirae_admin()) then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  before_row := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  after_row := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  record_id := coalesce(
    after_row->>'id', before_row->>'id',
    after_row->>'key', before_row->>'key',
    after_row->>'code', before_row->>'code'
  );

  insert into public.admin_audit_logs(admin_id, action, entity, entity_id, before_data, after_data)
  values ((select auth.uid()), lower(tg_op), tg_table_name, record_id, before_row, after_row);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.log_feirae_admin_change() from public, anon, authenticated;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'platform_settings',
    'service_states',
    'service_regions',
    'vehicle_type_rules',
    'delivery_fee_rules',
    'platform_fee_rules',
    'cancellation_reasons',
    'payment_method_rules',
    'onboarding_requirements',
    'feature_flags',
    'content_blocks',
    'notification_templates',
    'integration_registry',
    'system_announcements',
    'account_enforcements',
    'admin_permissions'
  ]
  loop
    execute format('drop trigger if exists feirae_admin_audit on public.%I', tbl);
    execute format(
      'create trigger feirae_admin_audit after insert or update or delete on public.%I for each row execute function private.log_feirae_admin_change()',
      tbl
    );
  end loop;
end $$;
