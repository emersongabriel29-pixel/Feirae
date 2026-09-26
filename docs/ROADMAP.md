# Roadmap técnico — Feiraê

Atualizado em 26/09/2026.

Este roadmap parte dos gaps reais do repositório.

## Fase 1 — migration de correção

Antes de conectar o frontend ao Supabase:

1. criar `order_vendor_status`;
2. normalizar `cancelled/canceled`;
3. remover pagamento do enum operacional de pedido;
4. definir enum/check de pagamento;
5. normalizar payout `requested`;
6. adicionar `coupon_code`, `pay_quantity`, `take_quantity`;
7. adicionar snapshots faltantes do pedido;
8. decidir `reviews` x `order_reviews`;
9. criar reserva de estoque;
10. criar ledger por recebedor.

Critério de saída:

- migrations executam do zero em banco descartável;
- testes de constraint passam.

## Fase 2 — RLS

Corrigir antes de expor tabelas.

Prioridade:

- vendor_stores;
- vendor_profiles;
- products CRUD;
- order_vendors;
- order_items;
- carts;
- deliveries;
- payments;
- support_tickets;
- order_reviews;
- onboarding review admin.

Critério:

- testes por customer/vendor/delivery/admin.

## Fase 3 — Auth e repositories

- instalar Supabase JS;
- conectar Auth;
- mapear `feirante ↔ vendor`;
- substituir `localAuth`;
- criar repositories;
- migrar perfis/endereço.

## Fase 4 — catálogo/estoque

- vendor_store ligado corretamente à feira;
- produto server-side;
- imagem em Storage;
- reserva transacional;
- snapshots;
- soft delete.

## Fase 5 — pedido

- criação server-side;
- estado global;
- estado por banca;
- eventos;
- cancelamento;
- retirada;
- substituição.

## Fase 6 — documentos/admin mínimo

Criar tabelas:

- service_regions;
- vehicle_types;
- pricing_rules;
- account_restrictions;
- admin permissions;
- admin audit log.

Implementar:

- revisão documental;
- UF;
- feira;
- veículo global;
- suspensões;
- taxas.

## Fase 7 — logística

- delivery server-side;
- lock/aceite atômico;
- veículo;
- raio/região;
- rota com provedor SLA;
- stops para multi-banca;
- tracking.

## Fase 8 — financeiro

Somente após pedido/estoque:

- PSP;
- Pix/cartão;
- webhook;
- ledger;
- split;
- estorno;
- payout;
- conciliação.

## Fase 9 — notificações

- in-app backend;
- push;
- WhatsApp;
- preferências por canal;
- consentimento/versionamento.

## Fase 10 — staging

Adicionar:

- workflow deploy staging;
- browser E2E;
- migration tests;
- observabilidade;
- backup;
- smoke;
- performance;
- acessibilidade.

## Bloqueadores para produção

Não publicar operação real enquanto existir qualquer um:

- Auth local;
- documento em localStorage;
- preço/estoque confiados ao browser;
- RLS incompleta;
- payment simulado;
- ledger ausente;
- admin sem auditoria;
- browser E2E ausente.

Matriz completa: [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).
