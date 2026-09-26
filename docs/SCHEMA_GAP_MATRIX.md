# Matriz de lacunas entre frontend e schema — Feiraê

Atualizado em 26/09/2026.

Este documento registra somente divergências concretas entre o código atual e as migrations `0001_feirae_core.sql` / `0002_feirae_operations.sql`.

## 1. Papéis

| Camada              | Valor                                                     |
| ------------------- | --------------------------------------------------------- |
| frontend            | `customer`, `feirante`, `delivery`                        |
| enum SQL `app_role` | `customer`, `vendor`, `delivery`, `admin`, `fair_manager` |

Pendência: definir um único nome canônico para o papel do feirante. Hoje `feirante` e `vendor` coexistem.

## 2. Estado global do pedido

### Frontend — `UnifiedOrderStatus`

- `received`
- `preparing`
- `ready_for_pickup`
- `driver_assigned`
- `collected`
- `out_for_delivery`
- `delivered`
- `cancelled`

### SQL — `public.order_status`

Migration 0001:

- `pending_payment`
- `paid`
- `accepted`
- `preparing`
- `ready_for_pickup`
- `out_for_delivery`
- `delivered`
- `canceled`
- `refunded`

Migration 0002 adiciona:

- `driver_assigned`
- `collected`

### Conflitos

- frontend usa `cancelled`; SQL usa `canceled`;
- SQL mantém `paid`, `accepted` e `refunded` dentro de `order_status`, embora pagamento seja uma máquina separada no frontend;
- frontend inicia em `received`; SQL usa `pending_payment`;
- não existe migration de normalização ainda.

## 3. Estado da banca dentro do pedido

Frontend `VendorOrderStatus`:

- `new`
- `preparing`
- `ready_for_pickup`
- `collected`
- `delivered`
- `rejected`

No `orderBridge`, a participação de banca usa:

- `pending`
- `accepted`
- `preparing`
- `ready`
- `collected`
- `delivered`
- `rejected`

SQL `order_vendors.status` reutiliza `public.order_status`.

Problema objetivo: o enum SQL não possui `pending`, `ready` nem `rejected`, portanto o schema atual não consegue persistir fielmente o estado por banca usado pelo frontend.

Correção necessária: criar enum próprio, por exemplo `order_vendor_status`, e migrar `order_vendors.status`.

A retirada multi-banca também depende desse estado por banca: uma participação pode estar `delivered` enquanto o pedido global continua `ready_for_pickup`; somente todas as participações `delivered` encerram o pedido. O backend precisa derivar essa transição atomicamente.

## 4. Pagamento

Frontend do pedido unificado usa:

- `authorized`
- `due_on_delivery`
- `failed`
- `refunded`

SQL:

- `orders.payment_status` é `text` sem constraint;
- `payments.status` também é `text` sem constraint.

Pendência: criar enum/check próprio para pagamento e impedir que `order_status` represente pagamento.

## 5. Entrega

Frontend deriva parte da entrega pelo estado global e mantém dados de motorista dentro do pedido.

SQL possui `deliveries.status text` sem constraint.

Campos existentes em `deliveries`:

- `delivery_id`
- `vehicle_id`
- `pickup_location`
- `dropoff_location`
- `fee`
- `to_vendor_km`
- `vendor_to_customer_km`
- `total_distance_km`
- `eta_minutes`
- `route_source`
- `accepted_at`
- `collected_at`
- `out_for_delivery_at`
- `delivered_at`
- `canceled_at`
- `cancel_reason`
- `proof_url`

Pendência: constraint/enum de status e máquina server-side.

## 6. Promoções

Frontend `VendorPromotion` possui:

- `couponCode`
- `payQuantity`
- `takeQuantity`
- `discountValue`
- `target`
- `minimumOrder`
- `usageLimit`
- `usedCount`

Tabela SQL `promotions` possui:

- `promotion_type`
- `name`
- `rule_text`
- `discount_value`
- `target`
- `minimum_order`
- `usage_limit`
- `used_count`
- `vendor_pays_delivery`
- `active`
- `starts_at`
- `ends_at`

Faltam no SQL:

- `coupon_code`
- `pay_quantity`
- `take_quantity`

Além disso, no frontend os tipos `horario` e `combo` ainda são calculados como desconto percentual sobre subtotal-alvo; não existe regra própria de janela horária ou composição de combo.

## 7. Pedido e snapshots

`orders` possui hoje:

- `customer_id`
- `address_id`
- `fulfillment`
- `status`
- `subtotal`
- `delivery_fee`
- `total`
- `customer_key_snapshot`
- `payment_method_snapshot`
- `payment_status`
- `promotion_discount`
- `delivery_subsidy`
- `wallet_used`
- `change_for`
- `refund_amount`
- `pickup_confirmed_at`

Faltam campos que o frontend já usa ou precisa preservar:

- consentimento de WhatsApp;
- motivo/detalhes de cancelamento no pedido global;
- endereço textual de entrega em snapshot;
- cidade/região em snapshot;
- latitude/longitude do destino em snapshot;
- nome do cliente em snapshot.

`order_items` possui:

- `product_name_snapshot`
- `unit_price_snapshot`
- `quantity`
- `total`
- `estimated_weight_kg`
- `actual_weight_kg`
- `unavailable`
- `substitution_note`

Falta:

- unidade comercial em snapshot;
- nome da banca/store em snapshot;
- preço/desconto final por item quando necessário.

## 8. Multi-banca

O frontend suporta múltiplas bancas no mesmo pedido.

Schema atual:

- `order_vendors` representa N bancas;
- `payments` possui somente um `vendor_amount`.

Isso é insuficiente para um pagamento com N feirantes. O modelo financeiro precisa de lançamentos por recebedor/pedido, não um único campo agregado.

## 9. Ledger

O frontend simula:

- carteira do cliente;
- recebíveis de feirante;
- recebíveis de entregador.

SQL possui:

- `wallet_entries`
- `payouts`

Não existe tabela de ledger contábil por pedido/recebedor.

Falta estrutura para registrar, de forma imutável:

- valor bruto do item/banca;
- comissão;
- taxa do provedor;
- subsídio de frete;
- parcela do entregador;
- estorno;
- ajuste;
- liquidação.

## 10. Avaliações duplicadas

Migration 0001 cria `reviews`.

Migration 0002 cria `order_reviews`.

`order_reviews` é mais compatível com o frontend porque possui:

- `author_role`
- `target_role`
- `target_id`

Decisão necessária: manter `order_reviews` como modelo principal e depreciar/migrar `reviews`, ou justificar os dois usos.

## 11. Eventos

Tabela `order_events` possui:

- `order_id`
- `actor_id`
- `actor_role`
- `event_key`
- `label`
- `reason`
- `details`
- `created_at`

Não possui:

- `previous_state`
- `next_state`
- `correlation_id`

Se a auditoria de transição depender desses campos, uma nova migration é necessária.

## 12. Catálogo e feira

`vendor_stores` não possui `fair_id`.

Hoje a relação feira↔feirante existe em `fair_vendor_memberships`, enquanto a loja é vinculada apenas ao `vendor_profile`.

Para uma banca/loja operar em uma feira específica, o backend precisa definir a relação exata entre:

- `fair_vendor_memberships`
- `vendor_stores`
- catálogo publicado.

## 13. Produtos e imagens

`products` possui somente dados textuais/numéricos.

Não existe `product_images`.

O frontend atual de feirante guarda uma foto em `photoDataUrl`, mas o SQL não possui caminho de imagem.

Falta:

- tabela/estrutura de imagens;
- ordenação;
- imagem principal;
- Storage.

## 14. Estoque e reservas

Não existe tabela de reserva de estoque.

O protótipo usa `inventoryBridge.ts` e `localStorage`.

Para produção faltam:

- `inventory_reservations` ou mecanismo equivalente;
- transação de reserva;
- expiração;
- liberação;
- consumo;
- prevenção de overselling.

## 15. Administração

Migration `0003_management_console.sql` fecha os gaps administrativos principais com:

- `service_states`;
- `service_regions`;
- `vehicle_type_rules`;
- `delivery_fee_rules`;
- `platform_fee_rules`;
- `payment_method_rules`;
- `cancellation_reasons`;
- `onboarding_requirements`;
- `account_enforcements`;
- `admin_access`;
- `admin_permissions`;
- `admin_audit_logs`;
- `operational_alerts`;
- `integration_registry`;
- `integration_health_events`;
- `privacy_requests`;
- `content_blocks`;
- `notification_templates`;
- `system_announcements`.

Também adiciona MFA/AAL2 para acesso administrativo e ações server-side em `supabase/functions/admin-actions/index.ts`.

Pendência restante: o app principal ainda usa valores locais/hard-coded em vários fluxos e precisa consumir essas tabelas como runtime configuration para que a Gestão vire a fonte operacional efetiva.

## 16. RLS

Após `0003_management_console.sql`, a Gestão habilita RLS e policies explícitas para as tabelas administrativas e também fecha exposição administrativa de:

- `categories`;
- `deliveries`;
- `order_items`;
- `order_vendors`;
- `fair_vendor_memberships`;
- `vendor_stores`;
- `payments`.

Ações críticas não ficam liberadas como CRUD administrativo no navegador. A migration revoga mutações diretas de:

- `orders`;
- `deliveries`;
- `payments`;
- `payouts`;
- `wallet_entries`;
- `admin_access`;
- `admin_permissions`;
- `account_enforcements`;
- `privacy_requests`.

Intervenções administrativas passam por `admin-actions`, que valida MFA, papel, permissão, regra de transição e auditoria.

Gaps de RLS ainda ligados ao **app principal** permanecem e devem ser fechados quando o frontend deixar o modo local, incluindo criação segura de pedido, estoque, suporte/avaliação pelo usuário e demais mutations de domínio.

## Próxima migration recomendada

A próxima migration após `0003_management_console.sql` deve priorizar o domínio transacional compartilhado, e não repetir estruturas administrativas já criadas.

Prioridades:

1. criar `order_vendor_status`;
2. normalizar `cancelled/canceled`;
3. separar definitivamente pagamento de `order_status`;
4. completar snapshots do pedido;
5. criar ledger por recebedor;
6. criar reserva de estoque atômica;
7. modelar imagens de produto/Storage;
8. decidir `reviews` x `order_reviews`;
9. adicionar campos de correlação/transição em eventos;
10. conectar regras administrativas de runtime ao backend do app;
11. testar migrations e RLS em banco descartável/staging antes de produção.
