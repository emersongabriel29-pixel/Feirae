# Matriz de lacunas entre frontend e schema — Feiraê

Atualizado em 22/10/2026 após aplicação das migrations 0001–0007 e integração inicial Auth/Storage.

Este documento registra somente divergências concretas entre o código atual e as migrations `0001_feirae_core.sql`, `0002_feirae_operations.sql` e `0003_vendor_store_minimum_order.sql`.

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

## 12.1. Pedido mínimo da banca

A migration `0003_vendor_store_minimum_order.sql` adiciona:

- `vendor_stores.minimum_order_amount numeric(12,2)`;
- `0` significa sem mínimo;
- constraint atual entre R$ 0,00 e R$ 100,00.

Isso prepara o dado por banca, mas **não conclui a regra server-side** porque o aplicativo ainda não consome Supabase.

Antes da produção ainda faltam:

- política administrativa persistida para teto/fallback, em vez de constante do frontend;
- validação server-side no fechamento do pedido;
- snapshot da regra/valor aplicado por banca no pedido;
- RLS/policy de atualização para permitir que o Feirante altere somente sua própria banca;
- trilha de auditoria para alteração administrativa do teto.

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

Não existem tabelas para:

- catálogo global de tipos de veículo;
- configuração de capacidade máxima por tipo;
- UFs/estados atendidos;
- regras de taxa versionadas;
- suspensões;
- audit log administrativo;
- permissões granulares de admin.

Essas estruturas são requisitos do painel de gestão e precisam de migrations próprias.

## 16. RLS — estado real após migrations 0001–0007

A auditoria remota confirmou 27 tabelas da aplicação com RLS habilitado. A migration `0004_security_rls_hardening.sql` define policies por papel e ownership, protege campos privilegiados/financeiros e limita operações críticas a servidor. A migration `0005_rls_nonrecursive_helpers.sql` remove referências recursivas entre policies de pedidos e usa funções auxiliares no schema privado. A migration `0006_exposed_surface_and_fk_indexes.sql` define negação explícita de acesso cliente à tabela `payments` e adiciona índices para chaves estrangeiras.

Cobertura principal:

- catálogo público limitado a feiras/categorias ativas e bancas/produtos elegíveis;
- perfil, endereços e carrinho limitados ao titular;
- leitura de pedidos, itens, bancas participantes, entregas e eventos limitada aos participantes;
- veículos, preferências e documentos limitados ao usuário proprietário;
- promoções administradas por feirante aprovado;
- pagamentos, carteira e repasses sem mutação direta pelo cliente;
- triggers bloqueiam alteração de papel, aprovação e estados/valores financeiros críticos.

**Pendências que impedem declarar backend de produção concluído:**

- Auth/recuperação/upload documental usam Supabase quando configurado; catálogo, pedidos, estoque, carteira e pagamentos ainda persistem localmente;
- pedidos e transições ainda precisam de RPCs/Edge Functions transacionais e idempotentes;
- Storage privado está criado e o upload inicial de documentos de feirante/entregador foi ligado; faltam fotos de perfil/veículo, revisão administrativa e testes com usuários reais;
- o advisor Supabase ainda aponta `public.spatial_ref_sys` sem RLS e PostGIS no schema `public`; a tentativa de alterar a tabela falhou por falta de ownership do objeto de extensão, então ela não foi modificada;
- funções PostGIS de estimativa de extensão seguem avisadas pelo advisor por serem objetos da extensão, sem ownership pela integração.

## Próximas migrations recomendadas após a 0006

A próxima migration não deve ser genérica. Ela precisa, no mínimo:

1. criar `order_vendor_status`;
2. normalizar `cancelled/canceled`;
3. separar pagamento de `order_status`;
4. completar campos de promoções;
5. adicionar snapshots faltantes;
6. decidir `reviews` x `order_reviews`;
7. criar ledger por recebedor;
8. modelar reserva de estoque;
9. modelar catálogo de veículos/taxas/suspensões/admin audit;
10. adicionar testes de integração RLS por papel e de acesso cruzado;
11. testar tudo em banco descartável antes de staging;
12. validar server-side o pedido mínimo por banca e persistir snapshot da regra aplicada.


### Migration 0007 e integração inicial

Migration `0007_auth_storage_and_extension_surface.sql` cria o trigger de perfil para novas contas, o bucket privado `onboarding-documents` e policy por pasta/usuário. O código do frontend contém Auth REST, refresh de sessão, recuperação por e-mail e upload privado. Isso não substitui a integração remota de catálogo, pedidos, estoque e financeiro. O advisor ainda reporta `spatial_ref_sys` sem RLS e funções PostGIS executáveis por `anon`/ `authenticated`; os REVOKEs tentados não foram suficientes e essa pendência permanece crítica.
