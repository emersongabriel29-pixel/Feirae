# Rastreabilidade da implementação atual — Feiraê

Atualizado em 26/09/2026.

Este documento responde: “onde cada função realmente vive hoje?”.

## Cliente

| Função            | Arquivo atual                            | Persistência atual                 | Backend SQL relacionado                  | Situação |
| ----------------- | ---------------------------------------- | ---------------------------------- | ---------------------------------------- | -------- |
| sessão            | `useDemoSession.ts`                      | `feirae:session`                   | `profiles`/Auth                          | local    |
| credencial        | `localAuth.ts`                           | `feirae:local-auth:v1`             | Supabase Auth                            | local    |
| conta             | `CustomerScreens.tsx`                    | `feirae:account:<email>`           | `profiles`                               | local    |
| endereços         | `CustomerScreens.tsx`                    | `feirae:addresses:<email>`         | `addresses`                              | local    |
| cartões salvos    | `CustomerScreens.tsx`                    | `feirae:cards-v3:<email>`          | não deve salvar PAN/CVV; PSP futuro      | local    |
| favoritos produto | `App.tsx`                                | `feirae:favorites:<email>`         | tabela futura                            | local    |
| favoritos banca   | `App.tsx`                                | `feirae:vendor-favorites:<email>`  | tabela futura                            | local    |
| carrinho          | `useDemoCart.ts`/App                     | estado local                       | `carts`, `cart_items`                    | local    |
| checkout          | `CustomerScreens.tsx`                    | estado React + bridges             | `orders`, `payments`                     | local    |
| pedido            | `orderBridge.ts`                         | `feirae:unified-orders:v2`         | `orders`, `order_vendors`, `order_items` | local    |
| estoque           | `inventoryBridge.ts`                     | `feirae:inventory-reservations:v1` | não há reserva SQL                       | local    |
| carteira          | `walletBridge.ts`                        | `feirae:wallet-debits` + pedidos   | `wallet_entries`                         | local    |
| suporte           | `CustomerScreens.tsx` + `orderBridge.ts` | pedidos/chaves locais              | `support_tickets`                        | local    |
| avaliações        | `CustomerScreens.tsx` + `orderBridge.ts` | pedidos/localStorage               | `order_reviews`                          | local    |
| WhatsApp consent  | checkout/App                             | pedido unificado                   | campo ausente em `orders`                | local    |

## Feirante

| Função             | Arquivo             | Chave local                                  | SQL                                  |
| ------------------ | ------------------- | -------------------------------------------- | ------------------------------------ |
| conta              | `VendorScreens.tsx` | `feirae:vendor-account:<email>`              | `vendor_profiles` incompleto         |
| banca              | `VendorScreens.tsx` | `feirae:vendor-bank:<email>`                 | `vendor_stores`                      |
| produtos           | `VendorScreens.tsx` | `feirae:vendor-products:<email>`             | `products`                           |
| estoque/histórico  | `VendorScreens.tsx` | `feirae:vendor-stock-history:<email>`        | reserva/histórico ausentes           |
| promoções          | `VendorScreens.tsx` | `feirae:vendor-promotions:<email>`           | `promotions` incompleto              |
| horários           | `VendorScreens.tsx` | `feirae:vendor-schedule:<email>`             | `vendor_stores.custom_opening_hours` |
| usar horário feira | `VendorScreens.tsx` | `feirae:vendor-use-fair-hours:<email>`       | decisão futura                       |
| entrega/retirada   | `VendorScreens.tsx` | `feirae:vendor-delivery-settings:<email>`    | colunas em `vendor_stores`           |
| documentos         | `VendorScreens.tsx` | `feirae:vendor-documents:<email>`            | `onboarding_documents`               |
| pedidos            | `VendorScreens.tsx` | `feirae:vendor-orders:<email>` + orderBridge | `order_vendors`                      |
| financeiro         | `VendorScreens.tsx` | `feirae:vendor-settlements:<email>`          | `payouts` + ledger faltante          |
| avaliações         | `VendorScreens.tsx` | `feirae:vendor-reviews:<email>`              | `order_reviews`                      |

## Entregador

| Função          | Arquivo               | Chave local                             | SQL                             |
| --------------- | --------------------- | --------------------------------------- | ------------------------------- |
| conta           | `DeliveryScreens.tsx` | `feirae:delivery-account:<email>`       | `delivery_profiles`             |
| disponibilidade | `DeliveryScreens.tsx` | `feirae:delivery-online:<email>`        | `delivery_preferences.online`   |
| preferências    | `DeliveryScreens.tsx` | `feirae:delivery-preferences:<email>`   | `delivery_preferences`          |
| veículos        | `DeliveryScreens.tsx` | `feirae:delivery-vehicles:<email>`      | `delivery_vehicles`             |
| documentos      | `DeliveryScreens.tsx` | `feirae:delivery-documents:<email>`     | `onboarding_documents`          |
| corrida ativa   | `DeliveryScreens.tsx` | `feirae:delivery-active:<email>`        | `deliveries`                    |
| etapa corrida   | `DeliveryScreens.tsx` | `feirae:delivery-stage:<email>`         | `deliveries`                    |
| cancelamentos   | `DeliveryScreens.tsx` | `feirae:delivery-cancellations:<email>` | `deliveries.cancel_reason`      |
| ajuda           | `DeliveryScreens.tsx` | `feirae:delivery-help:<email>`          | `support_tickets`               |
| ganhos          | `DeliveryScreens.tsx` | `feirae:delivery-ledger:<email>`        | `payouts`; ledger real faltante |

## Marketplace compartilhado

`marketplaceBridge.ts` usa:

- `feirae:marketplace:v2`;
- `feirae:static-stock-adjustments:v1`.

Ele publica para o cliente:

- nome da banca;
- feira;
- aprovação;
- aberta/fechada;
- entrega/retirada;
- pagamento na entrega;
- promoções;
- produtos;
- foto do produto quando `photoDataUrl` foi cadastrada.

A foto do produto é publicada como `imageDataUrl` no objeto de catálogo e renderizada pelo Cliente quando existe.

Não é banco multiusuário; sincroniza apenas o navegador atual.

## Rotas

### Geocodificação

`routing.ts`:

- Nominatim Search: `https://nominatim.openstreetmap.org/search`.

`CustomerScreens.tsx`:

- Nominatim Reverse: `https://nominatim.openstreetmap.org/reverse`.

### Roteamento

`routing.ts`:

- OSRM público: `https://router.project-osrm.org/route/v1/driving/`.

### Abrir navegação

`App.tsx`:

- Google Maps Directions URL via `https://www.google.com/maps/dir/?api=1&destination=...`.

Não há SDK de mapas instalado.

## Frete atual

O checkout não usa a rota para formar o preço.

`CustomerScreens.tsx` calcula:

1. pega as bancas do carrinho;
2. lê `vendorMetrics.deliveryFee`;
3. usa o maior valor como `fallbackDeliveryFee`;
4. esse valor vira `calculatedDeliveryFee`;
5. aplica subsídio/promoção.

Portanto:

- rota e ETA existem para logística;
- preço de frete ainda é fixture/métrica local;
- peso não altera o preço do frete atual.

## Capacidades de veículo atuais

Fonte: `src/domain/vehicles.ts`.

| Tipo                         | Capacidade padrão |
| ---------------------------- | ----------------: |
| Bicicleta                    |             10 kg |
| Bicicleta cargueira/triciclo |             40 kg |
| Moto                         |             12 kg |
| Moto com baú                 |             20 kg |
| Carro                        |             80 kg |
| Utilitário/Pickup            |            250 kg |
| Van                          |            500 kg |
| Outro                        |             10 kg |

`Outro` atualmente não exige placa por `requiresPlate()`. Isso é comportamento atual, não decisão regulatória final.

## Aprovação do feirante

`VendorScreens.tsx` considera aprovado quando **todos os documentos marcados `required`** estão `approved`.

Documentos seed:

- documento oficial com foto;
- comprovante de residência;
- permissão/autorização da banca ou box;
- licença sanitária opcional.

Banca só é publicada como aprovada no marketplace local quando esse cálculo retorna `Aprovado`.

## Aprovação do entregador

Obrigatórios sempre:

- `identity`;
- `address`.

Se houver veículo motorizado ativo:

- `cnh`;
- `crlv`.

Se houver Moto/Moto com baú ativa:

- `motofrete`.

Só fica operacional quando todos os obrigatórios atuais estão `approved`.

O código não valida automaticamente:

- idade mínima;
- tempo de CNH;
- EAR;
- validade real no Detran;
- certidões;
- autenticidade do documento.

## Upload atual

`storedFile.ts`:

- lê o arquivo como Data URL;
- limite padrão: 1.500.000 bytes;
- salva nome, type declarado pelo navegador, tamanho, Data URL e data.

Não faz:

- magic bytes;
- antivírus;
- verificação de conteúdo;
- OCR;
- assinatura;
- upload remoto.

## Testes atuais

Contagem real:

- `App.test.tsx`: 43;
- `orderBridge.test.ts`: 4;
- `marketplaceBridge.test.ts`: 4;
- `inventoryBridge.test.ts`: 3;
- `localAuth.test.ts`: 4;
- `marketplace.test.ts`: 4;
- `session.test.ts`: 3;
- `utils.test.ts`: 4.

Total: **69**.

## Runtime configuration consumida pelo app público

| Regra da Gestão             | Adapter no app                             | Efeito atual                                                  |
| --------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| Estados/UF                  | `src/domain/runtimeConfig.ts`              | lista somente UFs ativas e habilitadas para pedidos           |
| Feiras                      | `src/domain/runtimeConfig.ts` + `App.tsx`  | substitui a lista fallback quando o Supabase está configurado |
| Tipos/capacidade de veículo | `runtimeConfig.ts` + `vehicles.ts`         | cadastro/logística usam tipos ativos e capacidade configurada |
| Meios de pagamento          | `runtimeConfig.ts` + `CustomerScreens.tsx` | checkout mostra somente métodos ativos para cliente           |

Configurações sensíveis que dependem de identidade/autoridade server-side continuam fora desse adapter público.

## Gestão administrativa

| Função                        | Interface                 | Persistência                                        | Segurança / ação                                     |
| ----------------------------- | ------------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| Dashboard e listas            | `admin/app.js`            | tabelas operacionais                                | RLS + RBAC                                           |
| Estados/regiões               | `admin/modules.js`        | `service_states`, `service_regions`                 | `registrations.manage`                               |
| Veículos globais              | `admin/modules.js`        | `vehicle_type_rules`                                | `rules.manage`                                       |
| Frete/taxas                   | `admin/modules.js`        | `delivery_fee_rules`, `platform_fee_rules`          | `rules.manage`                                       |
| Pedidos                       | detalhe em `admin/app.js` | `orders`, `order_events`                            | `admin-actions: order_transition`                    |
| Entregas                      | detalhe em `admin/app.js` | `deliveries`                                        | `admin-actions: delivery_*`                          |
| Documentos                    | `admin/app.js`            | `onboarding_documents`, Storage                     | `admin-actions: document_review` + `document-upload` |
| Pagamentos                    | `admin/app.js`            | `payments`                                          | `admin-actions: payment_reconcile`                   |
| Suporte                       | `admin/app.js`            | `support_tickets`                                   | `admin-actions: support_update`                      |
| Avaliações                    | `admin/app.js`            | `order_reviews`                                     | `admin-actions: review_moderate`                     |
| LGPD                          | `admin/app.js`            | `privacy_requests`                                  | `admin-actions: privacy_update`                      |
| Restrições                    | `admin/app.js`            | `account_enforcements`                              | `admin-actions: enforcement_*`                       |
| Administradores               | `admin/app.js`            | `admin_access`, `admin_permissions`                 | MFA + superadmin + Edge Function                     |
| Alertas                       | `admin/app.js`            | `operational_alerts`                                | `refresh_alerts`, reconhecer/resolver                |
| Integrações                   | `admin/app.js`            | `integration_registry`, `integration_health_events` | `health_check` server-side                           |
| Aprovação feirante/entregador | `admin/app.js`            | `vendor_profiles`, `delivery_profiles`, documentos  | `admin-actions: profile_approval`                    |
| Auditoria                     | `admin/app.js`            | `admin_audit_logs`                                  | `audit.view`                                         |

Testes: `admin/management.test.js` e `admin/core.test.js`.
