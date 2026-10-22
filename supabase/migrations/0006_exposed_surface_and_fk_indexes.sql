-- Feiraê: document intentionally private payment access and index foreign keys.
-- The PostGIS extension owns its metadata table and helper functions; those platform objects
-- are intentionally not modified here because the migration role is not their owner.

-- Explicit deny policy documents that payment rows (including commissions and settlement amounts)
-- must only be accessed by trusted server-side operations.
drop policy if exists "payments are server only" on public.payments;
create policy "payments are server only" on public.payments
for all to anon, authenticated
using (false)
with check (false);

-- Cover foreign-key columns used by joins, deletes, and row-level authorization checks.
create index if not exists addresses_user_id_idx on public.addresses(user_id);
create index if not exists cart_items_product_id_idx on public.cart_items(product_id);
create index if not exists deliveries_delivery_id_idx on public.deliveries(delivery_id);
create index if not exists deliveries_vehicle_id_idx on public.deliveries(vehicle_id);
create index if not exists fair_vendor_memberships_vendor_id_idx on public.fair_vendor_memberships(vendor_id);
create index if not exists onboarding_documents_reviewed_by_idx on public.onboarding_documents(reviewed_by);
create index if not exists order_events_actor_id_idx on public.order_events(actor_id);
create index if not exists order_items_order_vendor_id_idx on public.order_items(order_vendor_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists order_reviews_author_id_idx on public.order_reviews(author_id);
create index if not exists order_vendors_vendor_id_idx on public.order_vendors(vendor_id);
create index if not exists orders_address_id_idx on public.orders(address_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists payments_order_id_idx on public.payments(order_id);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_store_id_idx on public.products(store_id);
create index if not exists promotion_usages_order_id_idx on public.promotion_usages(order_id);
create index if not exists promotions_store_id_idx on public.promotions(store_id);
create index if not exists reviews_customer_id_idx on public.reviews(customer_id);
create index if not exists reviews_order_id_idx on public.reviews(order_id);
create index if not exists reviews_vendor_id_idx on public.reviews(vendor_id);
create index if not exists support_tickets_opened_by_idx on public.support_tickets(opened_by);
create index if not exists vendor_stores_vendor_id_idx on public.vendor_stores(vendor_id);
create index if not exists wallet_entries_customer_id_idx on public.wallet_entries(customer_id);
create index if not exists wallet_entries_order_id_idx on public.wallet_entries(order_id);
