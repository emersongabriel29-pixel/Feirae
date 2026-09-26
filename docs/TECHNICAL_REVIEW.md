# Revisão técnica formal — Feiraê

Atualizado em 26/09/2026 após auditoria código ↔ docs ↔ SQL.

## Estado real

O Feiraê é um protótipo funcional integrado no mesmo navegador.

Pontos fortes atuais:

- três papéis;
- pedido unificado;
- multi-banca;
- estoque local;
- logística;
- documentos;
- promoções;
- avaliações;
- CI com 69 testes;
- migrations base.

A dívida principal está na transição para fonte de verdade server-side.

## P0 — incompatibilidade de estados

### Problema

`order_vendors.status` usa `public.order_status`.

Frontend de banca precisa de:

- pending;
- accepted;
- preparing;
- ready;
- collected;
- delivered;
- rejected.

Enum SQL não suporta todos.

### Consequência

Não é possível persistir fielmente o fluxo atual sem gambiarra/mapeamento.

### Correção

Criar enum próprio e migration.

## P0 — RLS incompleta

Sem RLS:

- vendor_stores;
- categories;
- order_vendors;
- order_items;
- carts;
- deliveries;
- payments;
- reviews.

Com RLS mas sem policy suficiente:

- vendor_profiles;
- promotion_usages;
- support_tickets;
- order_reviews.

Isso bloqueia conexão segura do frontend ao schema atual.

## P0 — financeiro multi-banca insuficiente

`payments.vendor_amount` é único.

Um pedido pode ter N bancas.

Falta ledger/receivables por recebedor.

## P0 — estoque não transacional no banco

`inventoryBridge.ts` funciona localmente.

Não existe tabela/mecanismo SQL de reserva.

Risco de produção:

- overselling;
- corrida de concorrência;
- inconsistência entre pagamento e estoque.

## P0 — Auth não existe no backend do app

`localAuth.ts` é local.

`@supabase/supabase-js` não está instalado.

Sem Auth/RLS real, não há segurança multiusuário.

## P1 — schema de promoções incompleto

Frontend usa:

- couponCode;
- payQuantity;
- takeQuantity.

SQL não possui colunas equivalentes.

Além disso:

- combo é percentual genérico;
- horario é percentual genérico.

## P1 — snapshots incompletos

Faltam no pedido SQL dados que o frontend já usa:

- WhatsApp consent;
- cancel reason/details global;
- endereço/cidade/coordenadas snapshot;
- nome cliente snapshot;
- unidade comercial item snapshot.

## P1 — rota multi-banca incompleta

Pedido pode conter várias bancas.

Oferta do entregador agrega nomes, mas não cria stops.

Precisa de tabela/estrutura de paradas se uma corrida realmente coletar em várias bancas.

## P1 — catálogo de veículos hard-coded

`vehicles.ts` define tipos/capacidades no código.

Isso impede o painel administrativo de:

- ativar/desativar tipos;
- mudar capacidade;
- adicionar tipo sem deploy.

Criar `vehicle_types`.

## P1 — documentos no localStorage

Arquivo completo é Data URL.

Limite 1,5 MB.

Sem magic bytes/Storage/auditoria.

## P1 — duplicidade de avaliações

Existem:

- reviews;
- order_reviews.

Escolher uma fonte canônica.

## P1 — sem painel administrativo

Enum tem admin/fair_manager, mas não há:

- UI;
- suspensões;
- taxas;
- RBAC;
- audit log;
- gestão de UF;
- catálogo de veículos.

## P2 — fixtures e dados reais locais coexistem

Contas `@feirae.test` usam seeds.

Antes de staging, separar claramente:

- seed;
- fixtures;
- dados persistidos.

## P2 — E2E em jsdom

69 testes são bons para regressão funcional, mas não são browser E2E.

Falta:

- Playwright/Cypress;
- mobile real;
- upload;
- GPS;
- refresh;
- integrações.

## Próxima sequência técnica

1. migration de correção de estados/schema;
2. RLS/policies;
3. Supabase Auth/client;
4. repositories/adapters;
5. estoque transacional;
6. documentos/Storage;
7. entrega server-side;
8. admin mínimo;
9. pagamento/ledger;
10. E2E/staging.

Detalhes:
- [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md)
- [IMPLEMENTATION_TRACEABILITY.md](IMPLEMENTATION_TRACEABILITY.md)
