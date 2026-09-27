-- Feiraê — pedido mínimo configurável por banca
-- O aplicativo ainda não consome Supabase; esta migration prepara a fonte de verdade de produção.

alter table public.vendor_stores
  add column if not exists minimum_order_amount numeric(12,2) not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_stores_minimum_order_amount_check'
      and conrelid = 'public.vendor_stores'::regclass
  ) then
    alter table public.vendor_stores
      add constraint vendor_stores_minimum_order_amount_check
      check (minimum_order_amount >= 0 and minimum_order_amount <= 100);
  end if;
end
$$;

comment on column public.vendor_stores.minimum_order_amount is
  'Pedido mínimo de mercadorias da banca. 0 = sem mínimo. Teto atual do protótipo: 100 BRL; produção deve validar política administrativa vigente no servidor.';
