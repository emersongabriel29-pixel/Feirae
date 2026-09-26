# Modelo de dados e estados — Feiraê

Atualizado em 26/09/2026.

Este é o documento canônico para nomes de estados e fronteiras entre domínios.

## Regra fundamental

Não usar um único enum para representar pedido, pagamento, banca e entrega. São máquinas diferentes.

## Pedido global

### Protótipo atual

```
received
preparing
ready_for_pickup
driver_assigned
collected
out_for_delivery
delivered
cancelled
```

Transição feliz de entrega:

```
received
→ preparing
→ ready_for_pickup
→ driver_assigned
→ collected
→ out_for_delivery
→ delivered
```

Retirada:

```
received
→ preparing
→ ready_for_pickup
→ delivered
```

### Backend alvo

O backend deve adotar a mesma semântica. Se houver estado de pré-pagamento, ele deve existir antes de `received`, por exemplo:

```
pending_payment → received
```

### Inconsistência existente nas migrations

O enum SQL criado em `0001` contém estados antigos e `0002` adiciona `driver_assigned` e `collected`. Há também grafia `canceled` no SQL e `cancelled` no frontend.

Antes de conectar produção, criar migration de normalização. Não mapear silenciosamente.

## Estado da banca dentro do pedido

```
pending
accepted
preparing
ready
collected
delivered
rejected
```

Em multi-banca, cada participação precisa de estado próprio.

Regra atual:

- qualquer banca em preparo mantém global `preparing`;
- todas prontas liberam `ready_for_pickup`;
- rejeição local leva o protótipo a cancelamento global.

Produção pode suportar cancelamento parcial, mas precisa de regra financeira/estoque explícita.

## Pagamento

Protótipo atual:

```
authorized
due_on_delivery
failed
refunded
```

Produção provavelmente precisará ampliar para:

```
pending
authorized
captured
failed
refund_pending
refunded
partially_refunded
disputed
chargeback
```

Não adicionar esses estados ao enum global do pedido.

## Entrega

O protótipo deriva parte da entrega pelo status do pedido, mas produção deve ter entidade própria.

Sugestão:

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

Pedido e entrega são sincronizados por ações válidas, não pelo compartilhamento do mesmo enum.

## Aprovação documental

```
pending
under_review
approved
correction_required
rejected
expired
suspended
```

O SQL atual ainda não possui todos os estados futuros.

## Repasse

Recebível:

```
pending
available
requested
paid
failed
blocked
refunded
```

Pagamento do provedor e repasse são objetos diferentes.

## Entidades centrais

### Pessoa/identidade

- profile;
- role;
- vendor_profile;
- delivery_profile.

### Feira/banca

- fair;
- fair_vendor_membership;
- vendor_store;
- opening_hours.

### Catálogo

- category;
- product;
- product_image;
- inventory/reservation;
- promotion;
- promotion_usage.

### Compra

- cart;
- cart_item;
- order;
- order_vendor;
- order_item;
- order_event.

### Logística

- delivery;
- delivery_profile;
- delivery_vehicle;
- delivery_preferences.

### Financeiro

- payment;
- ledger entry;
- payout;
- wallet entry.

### Operação

- onboarding_document;
- support_ticket;
- review;
- notification;
- audit_log.

## IDs

Produção deve usar IDs estáveis do banco.

Não usar como ID canônico:

- nome da banca;
- e-mail;
- texto da feira;
- placa;
- nome do produto.

No protótipo existem IDs derivados para manter a experiência; não devem ser copiados como arquitetura final.

## Snapshots

Pedido deve armazenar snapshot do momento da compra:

- nome do produto;
- preço unitário;
- unidade;
- quantidade;
- peso estimado/final;
- banca;
- descontos;
- taxa de entrega;
- endereço relevante.

Excluir ou editar produto não pode reescrever pedido antigo.

## Eventos

`order_event` deve ser append-only para mudanças críticas.

Campos mínimos:

- id;
- order_id;
- event_key;
- actor_id;
- actor_role;
- previous_state;
- next_state;
- reason;
- details;
- created_at.

## Próxima migration necessária

Antes da conexão real:

1. separar enums por domínio;
2. normalizar `cancelled`/ `canceled`;
3. remover estados antigos que não representam a máquina final;
4. adicionar constraints de transição onde fizer sentido;
5. completar RLS;
6. adicionar audit log;
7. validar migration em banco descartável.
