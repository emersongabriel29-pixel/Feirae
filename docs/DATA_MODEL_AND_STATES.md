# Modelo de dados e estados — Feiraê

Atualizado em 26/09/2026 após comparação direta entre frontend e migrations.

Este documento não descreve apenas o modelo desejado. Ele separa **implementado no frontend**, **existente no SQL** e **lacuna**.

Referência detalhada de incompatibilidades: [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

## 1. Papéis

| Conceito        | Frontend                    | SQL            |
| --------------- | --------------------------- | -------------- |
| cliente         | `customer`                  | `customer`     |
| feirante        | `feirante`                  | `vendor`       |
| entregador      | `delivery`                  | `delivery`     |
| admin           | não existe no login público | `admin`        |
| gestor de feira | não existe na UI atual      | `fair_manager` |

Antes de conectar Auth/RLS, definir um nome canônico para feirante. Não deixar `feirante` e `vendor` coexistirem sem mapeamento explícito.

## 2. Pedido global

### Frontend atual

Fonte: `src/domain/orderBridge.ts`.

```
received
→ preparing
→ ready_for_pickup
→ driver_assigned
→ collected
→ out_for_delivery
→ delivered
```

Saída alternativa:

```
cancelled
```

### SQL atual

`public.order_status`, migration 0001:

```
pending_payment
paid
accepted
preparing
ready_for_pickup
out_for_delivery
delivered
canceled
refunded
```

Migration 0002 adiciona:

```
driver_assigned
collected
```

### Decisão obrigatória antes do backend real

O backend deve separar:

- estado operacional do pedido;
- estado de pagamento.

`paid` e `refunded` não devem continuar como estados operacionais do pedido.

Também é obrigatório normalizar `cancelled` x `canceled`.

## 3. Estado da banca

### Frontend

`VendorOrderStatus` em `vendorModel.ts`:

```
new
preparing
ready_for_pickup
collected
delivered
rejected
```

No pedido unificado, a participação da banca usa:

```
pending
accepted
preparing
ready
collected
delivered
rejected
```

### SQL

`order_vendors.status` reutiliza `public.order_status`.

Isso é incompatível porque o enum SQL não possui:

- `pending`;
- `ready`;
- `rejected`.

Correção: criar enum próprio `order_vendor_status`.

### Derivação global em retirada multi-banca

Para `fulfillment = pickup`:

```
todas as bancas ready
→ order ready_for_pickup

uma ou mais bancas delivered + demais ready
→ order continua ready_for_pickup

todas as bancas delivered
→ order delivered
```

Uma banca não pode encerrar sozinha o pedido global de retirada quando existem outras bancas pendentes.

## 4. Pagamento

Frontend:

```
authorized
due_on_delivery
failed
refunded
```

SQL:

- `orders.payment_status text`;
- `payments.status text`.

Não há constraint.

Produção deve criar enum/check próprio e impedir valores arbitrários.

## 5. Entrega

O frontend usa o pedido global para refletir logística.

A tabela `deliveries` já possui:

- entregador;
- veículo;
- origem/destino geográfico;
- taxa;
- distâncias;
- ETA;
- timestamps de aceite/coleta/rota/entrega;
- cancelamento;
- comprovante.

Mas `deliveries.status` é `text` sem enum/check.

Estado alvo específico da entrega:

```
offered
accepted
arriving_vendor
at_vendor
collected
out_for_delivery
delivered
cancelled
incident
```

Esses valores ainda não estão implementados como constraint SQL.

## 6. Aprovação documental

Frontend de documentos usa:

```
pending
under_review
approved
correction_required
```

SQL `onboarding_documents` permite:

```
pending
under_review
approved
correction_required
rejected
```

O frontend ainda não representa `rejected` de forma completa.

Também não há enum para:

- `expired`;
- `suspended`.

## 7. Recebíveis/repasse

Frontend do entregador:

```
pending
available
withdrawal_requested
paid
```

SQL `payouts.status`:

```
pending
available
requested
paid
failed
```

Há divergência direta:

- frontend: `withdrawal_requested`;
- SQL: `requested`.

Normalizar antes da integração.

## 8. Entidades que realmente existem no SQL

### Migration 0001

- `profiles`
- `fairs`
- `vendor_profiles`
- `fair_vendor_memberships`
- `vendor_stores`
- `categories`
- `products`
- `addresses`
- `orders`
- `order_vendors`
- `order_items`
- `carts`
- `cart_items`
- `deliveries`
- `payments`
- `reviews`

### Migration 0002

- `delivery_profiles`
- `delivery_vehicles`
- `delivery_preferences`
- `onboarding_documents`
- `promotions`
- `promotion_usages`
- `order_events`
- `support_tickets`
- `order_reviews`
- `payouts`
- `wallet_entries`

## 9. Entidades citadas no produto, mas ausentes no SQL

Ainda não existem:

- tabela de imagens de produto;
- reservas de estoque;
- ledger contábil;
- notificações;
- favoritos;
- catálogo global de tipos de veículo;
- estados/UF atendidos;
- regras versionadas de taxa;
- suspensões;
- audit log administrativo.

Não tratar essas entidades como “já implementadas”.

## 10. Eventos do pedido

Tabela atual `order_events` possui:

- `order_id`;
- `actor_id`;
- `actor_role`;
- `event_key`;
- `label`;
- `reason`;
- `details`;
- `created_at`.

Não possui:

- `previous_state`;
- `next_state`;
- `correlation_id`.

Se a auditoria depender desses campos, criar migration.

## 11. Avaliações

Existem duas tabelas:

- `reviews` na 0001;
- `order_reviews` na 0002.

`order_reviews` é mais próxima do frontend porque suporta autor e alvo por papel.

Antes de produção, definir:

- qual tabela é canônica;
- migration de dados;
- depreciação da outra.

## 12. Snapshots de pedido

Já existem:

- nome do produto;
- preço unitário;
- quantidade;
- peso estimado;
- peso real.

Faltam no schema para refletir o frontend atual:

- unidade comercial em snapshot;
- nome/identidade da banca em snapshot;
- nome do cliente em snapshot;
- endereço textual em snapshot;
- cidade/região em snapshot;
- coordenadas do destino em snapshot;
- consentimento WhatsApp;
- motivo/detalhes de cancelamento global.

## 13. Promoções

Frontend possui `couponCode`, `payQuantity`, `takeQuantity`.

SQL não possui essas colunas.

Sem migration adicional:

- cupom não pode ser persistido completamente;
- Compre X Leve Y não pode ser persistido completamente.

## 14. Multi-banca financeiro

`order_vendors` representa N feirantes.

`payments` possui apenas:

- `vendor_amount`;
- `delivery_amount`;
- `commission`.

Um único `vendor_amount` não distribui valores entre N feirantes.

Produção precisa de ledger/receivables por recebedor.

## 15. Regra de transição

O backend futuro deve aceitar ações, não UPDATE livre de status.

Exemplo:

```
accept_vendor_order(order_vendor_id)
mark_vendor_ready(order_vendor_id)
assign_driver(delivery_id, driver_id, vehicle_id)
confirm_collection(delivery_id)
start_delivery(delivery_id)
confirm_delivery(delivery_id)
```

Cada ação valida:

- estado anterior;
- ator;
- autorização;
- pré-condições;
- idempotência;
- evento.

## 16. Próxima migration

A próxima migration precisa tratar os itens concretos registrados em [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md), principalmente:

1. enum próprio de banca;
2. normalização de `cancelled/canceled`;
3. pagamento fora de `order_status`;
4. campos de promoções;
5. snapshots faltantes;
6. ledger multi-banca;
7. reservas de estoque;
8. decisão `reviews` x `order_reviews`;
9. estruturas do painel administrativo;
10. RLS/policies completas.


## Runtime configuration da Gestão

A migration `0003_management_console.sql` adiciona configuração operacional persistida para Estados, Regiões, Veículos, Frete, Taxas, Pagamentos, Cancelamentos, Documentos, Feature Flags, Conteúdo, Integrações, Alertas, Restrições, RBAC e Auditoria.

As capacidades em `src/domain/vehicles.ts` continuam sendo fallback do protótipo até o app principal consumir `vehicle_type_rules`. O mesmo princípio vale para regras de frete, meios de pagamento e cobertura geográfica: depois da integração runtime, o código local não deve ser a fonte autoritativa.

Ações administrativas críticas não alteram estados por CRUD livre; `admin-actions` aplica as transições e registra auditoria.
