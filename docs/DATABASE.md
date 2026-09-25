# Modelo de dados — blueprint

Este arquivo é um contrato de modelagem. Não aplica migrations nem depende de uma integração ativa.

## Princípios

- IDs estáveis.
- Datas de criação e atualização em entidades persistentes.
- Soft delete quando histórico financeiro/operacional exigir.
- Valores monetários em unidade inteira mínima (centavos) ou tipo decimal controlado.
- Operações críticas executadas no servidor.
- RLS por papel e propriedade quando Supabase estiver ativo.
- PostGIS para distância e raio quando necessário.

## Entidades principais

### profiles
Identidade comum.
- id
- name
- email
- phone
- avatar_url
- role
- status
- created_at
- updated_at

### vendor_profiles
- user_id
- document_status
- business_name
- tax/document fields necessários
- approval_status

### delivery_profiles
- user_id
- document_status
- approval_status
- availability_status

### fairs
- id
- name
- state
- city
- address
- latitude
- longitude
- opening_rules
- active

### vendor_stores
- id
- vendor_id
- fair_id
- name
- description
- stall_or_box
- own_opening_hours
- active

### fair_vendor_memberships
Relaciona feirantes a feiras e guarda status de aprovação/vínculo.

### categories
- id
- name
- slug
- parent_id opcional
- active

### products
- id
- vendor_store_id
- category_id
- name
- description
- unit
- base_price
- weight_kg
- volume_class
- active

### product_images
Uma ou mais imagens ordenadas por produto.

### inventory
- product_id
- available_quantity
- reserved_quantity
- updated_at

### addresses
- user_id
- label
- address fields
- latitude
- longitude
- is_default

### carts
- id
- customer_id
- status

### cart_items
- cart_id
- product_id
- quantity

Preço final não deve ser confiado ao carrinho do cliente.

### orders
Pedido principal.
- id
- customer_id
- status
- delivery_type
- address_id
- products_total
- delivery_total
- grand_total
- created_at

### order_vendors
Subpedido por feirante.
- order_id
- vendor_id
- status
- subtotal
- fees
- payout_amount

### order_items
Snapshot do item no momento da compra:
- product_id
- product_name
- unit_price
- quantity
- unit
- weight
- vendor_id

### payments
- order_id
- method
- status
- provider_reference
- amount
- idempotency_key
- timestamps

### deliveries
- order_id
- delivery_profile_id
- vehicle_id
- status
- pickup
- destination
- estimated_weight
- fee
- accepted_at
- collected_at
- delivered_at

### delivery_vehicles
- delivery_profile_id
- type
- description
- capacity_kg
- active

### reviews
- author_id
- target_type
- target_id
- order_id
- rating
- comment
- moderation_status
- created_at

### favorites
Favoritos do cliente.

### notifications
Notificações e estado de leitura.

### promotions
Promoções controladas por feirante/plataforma.

### consent_records
Registra consentimentos como WhatsApp e localização quando juridicamente necessário.

### audit_logs
- actor_id
- action
- entity_type
- entity_id
- metadata
- created_at

## Relacionamentos principais

```text
fair
  └─ vendor_store
       └─ product
            └─ inventory

customer
  └─ cart
       └─ cart_item

customer
  └─ order
       ├─ order_vendor
       │    └─ order_item
       ├─ payment
       └─ delivery
```

## Segurança futura

RLS deve impedir:
- cliente editar catálogo;
- feirante editar loja de outro feirante;
- entregador acessar corridas sem permissão;
- qualquer usuário alterar valor financeiro arbitrariamente.

Service role nunca deve ser exposta ao frontend.

## Transações críticas

Devem ser atômicas:
- criação de pedido;
- reserva/decremento de estoque;
- confirmação de pagamento;
- cancelamento com devolução de estoque;
- repasse/estorno;
- aceite exclusivo de entrega.

## Evolução

A migration inicial deve ser dividida por domínio, evitando uma única migration gigantesca.

Sugestão:
1. identity;
2. fairs/vendors;
3. catalog/inventory;
4. carts/orders;
5. deliveries;
6. payments;
7. reviews/notifications;
8. audit/consents.
