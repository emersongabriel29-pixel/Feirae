-- Feiraê: harden row-level access and protect privileged/financial fields.
-- Apply after 0001_feirae_core.sql, 0002_feirae_operations.sql and 0003_vendor_store_minimum_order.sql.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.prevent_privileged_field_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  request_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  before_row jsonb;
  after_row jsonb;
  protected_fields text[];
  field_name text;
begin
  if auth.uid() is null or request_role in ('service_role', 'supabase_admin') then
    return new;
  end if;

  before_row := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  after_row := to_jsonb(new);

  protected_fields := case tg_table_schema || '.' || tg_table_name
    when 'public.profiles' then array['role']
    when 'public.vendor_profiles' then array['approved']
    when 'public.delivery_profiles' then array['approved']
    when 'public.orders' then array['status','subtotal','delivery_fee','total','payment_status','promotion_discount','delivery_subsidy','wallet_used','refund_amount']
    when 'public.deliveries' then array['delivery_id','status','fee','proof_url','accepted_at','delivered_at','collected_at','out_for_delivery_at','canceled_at','cancel_reason']
    when 'public.payments' then array['provider_payment_id','status','amount','commission','vendor_amount','delivery_amount']
    when 'public.payouts' then array['status','provider_reference','requested_at','paid_at']
    when 'public.onboarding_documents' then array['status','reviewed_by','reviewed_at','correction_reason']
    else array[]::text[]
  end;

  if tg_op = 'UPDATE' then
    foreach field_name in array protected_fields loop
      if before_row -> field_name is distinct from after_row -> field_name then
        raise exception 'Campo protegido: %', field_name using errcode = '42501';
      end if;
    end loop;
  end if;

  if tg_op = 'INSERT' and tg_table_schema = 'public' and tg_table_name = 'profiles'
     and coalesce(after_row ->> 'role', 'customer') <> 'customer' then
    raise exception 'O perfil deve iniciar como cliente; privilégios são atribuídos pelo servidor.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and tg_table_schema = 'public' and tg_table_name in ('vendor_profiles','delivery_profiles')
     and coalesce(after_row ->> 'approved', 'false') = 'true' then
    raise exception 'A aprovação deve ser realizada pelo servidor.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and tg_table_schema = 'public' and tg_table_name = 'onboarding_documents'
     and coalesce(after_row ->> 'status', 'pending') <> 'pending' then
    raise exception 'Documentos devem iniciar pendentes.' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_privileged_field_changes() from public, anon, authenticated;

drop trigger if exists protect_profiles_privileged_fields on public.profiles;
create trigger protect_profiles_privileged_fields before insert or update on public.profiles
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_vendor_privileged_fields on public.vendor_profiles;
create trigger protect_vendor_privileged_fields before insert or update on public.vendor_profiles
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_delivery_profile_privileged_fields on public.delivery_profiles;
create trigger protect_delivery_profile_privileged_fields before insert or update on public.delivery_profiles
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_orders_privileged_fields on public.orders;
create trigger protect_orders_privileged_fields before insert or update on public.orders
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_deliveries_privileged_fields on public.deliveries;
create trigger protect_deliveries_privileged_fields before insert or update on public.deliveries
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_payments_privileged_fields on public.payments;
create trigger protect_payments_privileged_fields before insert or update on public.payments
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_payouts_privileged_fields on public.payouts;
create trigger protect_payouts_privileged_fields before insert or update on public.payouts
for each row execute function private.prevent_privileged_field_changes();
drop trigger if exists protect_onboarding_document_privileged_fields on public.onboarding_documents;
create trigger protect_onboarding_document_privileged_fields before insert or update on public.onboarding_documents
for each row execute function private.prevent_privileged_field_changes();

alter table public.profiles enable row level security;
alter table public.fairs enable row level security;
alter table public.vendor_profiles enable row level security;
alter table public.fair_vendor_memberships enable row level security;
alter table public.vendor_stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_vendors enable row level security;
alter table public.order_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
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

drop policy if exists "public can view active fairs" on public.fairs;
create policy "public can view active fairs" on public.fairs for select to anon, authenticated using (is_active = true);

drop policy if exists "public can view available products" on public.products;
drop policy if exists "public views approved available products" on public.products;
create policy "public views approved available products" on public.products for select to anon, authenticated
using (
  available = true and archived_at is null
  and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true)
  and (store_id is null or exists (select 1 from public.vendor_stores s where s.id = store_id and s.is_open = true))
);

drop policy if exists "public views active categories" on public.categories;
create policy "public views active categories" on public.categories for select to anon, authenticated using (active = true);

drop policy if exists "public views approved vendors" on public.vendor_profiles;
create policy "public views approved vendors" on public.vendor_profiles for select to anon, authenticated using (approved = true or id = (select auth.uid()));

drop policy if exists "vendors manage own vendor profile" on public.vendor_profiles;
create policy "vendors manage own vendor profile" on public.vendor_profiles for insert to authenticated
with check (id = (select auth.uid()) and approved = false);
drop policy if exists "vendors update own vendor profile" on public.vendor_profiles;
create policy "vendors update own vendor profile" on public.vendor_profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "public views approved fair memberships" on public.fair_vendor_memberships;
create policy "public views approved fair memberships" on public.fair_vendor_memberships for select to anon, authenticated
using (
  (active = true and exists (select 1 from public.fairs f where f.id = fair_id and f.is_active = true)
   and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true))
  or vendor_id = (select auth.uid())
);

drop policy if exists "public views open approved stores" on public.vendor_stores;
create policy "public views open approved stores" on public.vendor_stores for select to anon, authenticated
using ((is_open = true and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true))
  or vendor_id = (select auth.uid()));
drop policy if exists "approved vendors manage own stores" on public.vendor_stores;
create policy "approved vendors manage own stores" on public.vendor_stores for all to authenticated
using (vendor_id = (select auth.uid()) and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true))
with check (vendor_id = (select auth.uid()) and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true));

drop policy if exists "approved vendors manage own products" on public.products;
create policy "approved vendors manage own products" on public.products for all to authenticated
using (vendor_id = (select auth.uid()) and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true))
with check (
  vendor_id = (select auth.uid())
  and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true)
  and (store_id is null or exists (select 1 from public.vendor_stores s where s.id = store_id and s.vendor_id = (select auth.uid())))
);

drop policy if exists "users manage own profile" on public.profiles;
create policy "users view own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "users create own customer profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()) and role = 'customer');
create policy "users update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "users manage own addresses" on public.addresses;
create policy "users manage own addresses" on public.addresses for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "customers manage own carts" on public.carts;
create policy "customers manage own carts" on public.carts for all to authenticated using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));
drop policy if exists "customers manage own cart items" on public.cart_items;
create policy "customers manage own cart items" on public.cart_items for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.customer_id = (select auth.uid())))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.customer_id = (select auth.uid())));

drop policy if exists "customers view own orders" on public.orders;
drop policy if exists "participants view own orders" on public.orders;
create policy "participants view own orders" on public.orders for select to authenticated
using (customer_id = (select auth.uid())
  or exists (select 1 from public.order_vendors ov where ov.order_id = id and ov.vendor_id = (select auth.uid()))
  or exists (select 1 from public.deliveries d where d.order_id = id and d.delivery_id = (select auth.uid())));

drop policy if exists "participants view order vendors" on public.order_vendors;
create policy "participants view order vendors" on public.order_vendors for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  or vendor_id = (select auth.uid())
  or exists (select 1 from public.deliveries d where d.order_id = order_id and d.delivery_id = (select auth.uid())));

drop policy if exists "participants view order items" on public.order_items;
create policy "participants view order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  or exists (select 1 from public.order_vendors ov where ov.id = order_vendor_id and ov.vendor_id = (select auth.uid()))
  or exists (select 1 from public.deliveries d where d.order_id = order_id and d.delivery_id = (select auth.uid())));

drop policy if exists "participants view deliveries" on public.deliveries;
create policy "participants view deliveries" on public.deliveries for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  or delivery_id = (select auth.uid())
  or exists (select 1 from public.order_vendors ov where ov.order_id = order_id and ov.vendor_id = (select auth.uid())));

drop policy if exists "customers create reviews for delivered orders" on public.reviews;
create policy "customers create reviews for delivered orders" on public.reviews for insert to authenticated
with check (customer_id = (select auth.uid()) and exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()) and o.status = 'delivered'));
drop policy if exists "public views reviews" on public.reviews;
create policy "public views reviews" on public.reviews for select to anon, authenticated using (true);

drop policy if exists "delivery manages own profile" on public.delivery_profiles;
create policy "delivery views own profile" on public.delivery_profiles for select to authenticated using (id = (select auth.uid()));
create policy "delivery creates own profile" on public.delivery_profiles for insert to authenticated with check (id = (select auth.uid()) and approved = false);
create policy "delivery updates own profile" on public.delivery_profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "delivery manages own vehicles" on public.delivery_vehicles;
create policy "delivery manages own vehicles" on public.delivery_vehicles for all to authenticated using (delivery_id = (select auth.uid())) with check (delivery_id = (select auth.uid()));
drop policy if exists "delivery manages own preferences" on public.delivery_preferences;
create policy "delivery manages own preferences" on public.delivery_preferences for all to authenticated using (delivery_id = (select auth.uid())) with check (delivery_id = (select auth.uid()));

drop policy if exists "users view own onboarding documents" on public.onboarding_documents;
create policy "users view own onboarding documents" on public.onboarding_documents for select to authenticated using (profile_id = (select auth.uid()));
drop policy if exists "users upload own onboarding documents" on public.onboarding_documents;
create policy "users create own pending onboarding documents" on public.onboarding_documents for insert to authenticated with check (profile_id = (select auth.uid()) and status = 'pending');
drop policy if exists "users update own pending onboarding documents" on public.onboarding_documents;
create policy "users update own pending onboarding documents" on public.onboarding_documents for update to authenticated
using (profile_id = (select auth.uid()) and status in ('pending','correction_required'))
with check (profile_id = (select auth.uid()) and status in ('pending','correction_required'));

drop policy if exists "public views active promotions" on public.promotions;
create policy "public views active promotions" on public.promotions for select to anon, authenticated
using (active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
drop policy if exists "vendors manage own promotions" on public.promotions;
drop policy if exists "approved vendors manage own promotions" on public.promotions;
create policy "approved vendors manage own promotions" on public.promotions for all to authenticated
using (vendor_id = (select auth.uid()) and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true))
with check (vendor_id = (select auth.uid()) and exists (select 1 from public.vendor_profiles v where v.id = vendor_id and v.approved = true));

drop policy if exists "participants view promotion usages" on public.promotion_usages;
create policy "participants view promotion usages" on public.promotion_usages for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  or exists (select 1 from public.promotions p where p.id = promotion_id and p.vendor_id = (select auth.uid())));

drop policy if exists "order participants view events" on public.order_events;
create policy "order participants view events" on public.order_events for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = (select auth.uid())
  or exists (select 1 from public.order_vendors ov where ov.order_id = o.id and ov.vendor_id = (select auth.uid()))
  or exists (select 1 from public.deliveries d where d.order_id = o.id and d.delivery_id = (select auth.uid())))));

drop policy if exists "users view own support tickets" on public.support_tickets;
create policy "users view own support tickets" on public.support_tickets for select to authenticated using (opened_by = (select auth.uid()));
drop policy if exists "users open own support tickets" on public.support_tickets;
create policy "users open own support tickets" on public.support_tickets for insert to authenticated with check (opened_by = (select auth.uid()) and status = 'open');
drop policy if exists "users update own open support tickets" on public.support_tickets;
create policy "users update own open support tickets" on public.support_tickets for update to authenticated
using (opened_by = (select auth.uid()) and status = 'open')
with check (opened_by = (select auth.uid()) and status = 'open');

drop policy if exists "participants view order reviews" on public.order_reviews;
create policy "participants view order reviews" on public.order_reviews for select to anon, authenticated using (true);
drop policy if exists "participants create order reviews" on public.order_reviews;
create policy "participants create order reviews" on public.order_reviews for insert to authenticated
with check (
  author_id = (select auth.uid()) and exists (
    select 1 from public.orders o where o.id = order_id and o.status = 'delivered'
      and (o.customer_id = (select auth.uid())
        or exists (select 1 from public.order_vendors ov where ov.order_id = o.id and ov.vendor_id = (select auth.uid()))
        or exists (select 1 from public.deliveries d where d.order_id = o.id and d.delivery_id = (select auth.uid())))
  )
);

drop policy if exists "users view own wallet entries" on public.wallet_entries;
create policy "users view own wallet entries" on public.wallet_entries for select to authenticated using (customer_id = (select auth.uid()));
drop policy if exists "users view own payouts" on public.payouts;
create policy "users view own payouts" on public.payouts for select to authenticated using (profile_id = (select auth.uid()));

-- Payments intentionally have no client policies: they contain commission and settlement details.
