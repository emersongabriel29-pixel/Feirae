# Governança de mudanças — Feiraê

Atualizado em 26/09/2026.

Esta regra vale para qualquer alteração futura do projeto: **nenhuma parte do Feiraê evolui isoladamente**.

## Regra principal

Toda mudança deve verificar impacto em:

1. código;
2. interface;
3. testes;
4. documentação;
5. schema/migrations;
6. segurança/RLS;
7. integrações;
8. LGPD/dados;
9. painel administrativo;
10. deploy/ambientes.

Não é obrigatório alterar todos esses itens em todo PR. É obrigatório **avaliar todos eles** e atualizar os que forem afetados.

## O que um PR precisa responder

Todo PR deve informar:

- o que mudou;
- quais fluxos foram afetados;
- quais testes foram adicionados/alterados;
- qual documentação foi atualizada;
- se houve impacto no banco;
- se houve impacto em RLS/permissões;
- se houve impacto em dados pessoais;
- se houve impacto em integrações;
- se houve impacto no painel de gestão;
- se houve impacto em deploy/configuração.

## Matriz de impacto obrigatória

### Mudança em regra de negócio

Exemplos:

- pedido;
- estoque;
- pagamento;
- entrega;
- promoção;
- veículo;
- aprovação;
- avaliação;
- carteira.

Obrigatório revisar:

- código;
- testes;
- `FUNCTIONAL_SPEC.md`;
- documento específico do domínio;
- `IMPLEMENTATION_TRACEABILITY.md`;
- schema/migration quando o dado precisa existir no backend.

### Mudança em estado/status

Obrigatório revisar:

- tipos/frontend;
- testes de transição;
- `DATA_MODEL_AND_STATES.md`;
- `ORDER_FULFILLMENT_FLOW.md` quando for pedido/logística;
- migration/constraint;
- `SCHEMA_GAP_MATRIX.md`.

### Mudança em formulário/campo

Obrigatório revisar:

- validação;
- salvar/cancelar;
- persistência;
- testes;
- `UI_INTERACTION_AUDIT.md`;
- LGPD se houver dado pessoal;
- schema se o campo precisar existir no backend.

### Mudança em produto/catálogo

Obrigatório revisar:

- `vendorModel.ts`;
- tela feirante;
- tela cliente;
- estoque;
- testes;
- `PRODUCT_MEASUREMENT_MATRIX.md`;
- SQL `products`;
- admin se categoria/unidade for configurável.

### Mudança em veículo/logística

Obrigatório revisar:

- `vehicles.ts`;
- filtros do entregador;
- peso do pedido;
- testes;
- `FUNCTIONAL_SPEC.md`;
- `ADMIN_MANAGEMENT_SPEC.md`;
- schema de veículo/tipo;
- documentação de entrega.

### Mudança em pagamento/financeiro

Obrigatório revisar:

- checkout;
- pedido;
- carteira;
- recebível;
- testes;
- `MONEY_FLOW.md`;
- `DATA_MODEL_AND_STATES.md`;
- schema;
- RLS;
- integração PSP;
- LGPD.

### Mudança em documento/aprovação

Obrigatório revisar:

- upload;
- validação;
- approvalStatus;
- bloqueios;
- testes;
- `ONBOARDING_AND_APPROVAL.md`;
- `SECURITY_AND_AUTH.md`;
- `LGPD_AND_PRIVACY.md`;
- Storage/RLS;
- admin.

### Mudança em migration/schema

Obrigatório revisar:

- migration;
- tipos/adapters;
- testes de schema quando existirem;
- `SCHEMA_GAP_MATRIX.md`;
- `DATA_MODEL_AND_STATES.md`;
- `IMPLEMENTATION_TRACEABILITY.md`;
- `SECURITY_AND_AUTH.md` se houver RLS/policy;
- roadmap/checklist quando um gap for fechado.

### Mudança em integração

Obrigatório revisar:

- adapter;
- fallback/erro;
- testes;
- secrets;
- `INTEGRATIONS.md`;
- `SECURITY_AND_AUTH.md`;
- `DEPLOYMENT_AND_ENVIRONMENTS.md`;
- LGPD se dados forem enviados a terceiro.

### Mudança em UI/UX

Obrigatório revisar:

- estados disabled/loading/error;
- mobile;
- acessibilidade;
- testes comportamentais;
- `UI_INTERACTION_AUDIT.md`;
- especificação funcional se mudar comportamento.

### Mudança no painel administrativo

Obrigatório revisar:

- permissão;
- auditoria;
- ação server-side;
- testes;
- `ADMIN_MANAGEMENT_SPEC.md`;
- RLS/RBAC;
- LGPD;
- schema.

## Fechando um gap documentado

Quando um item de `SCHEMA_GAP_MATRIX.md`, `MVP_CHECKLIST.md`, `ROADMAP.md` ou `TECHNICAL_REVIEW.md` for implementado:

1. remover ou marcar o gap como resolvido;
2. apontar migration/arquivo/teste que resolveu;
3. atualizar rastreabilidade;
4. não manter documentação dizendo que algo “falta” depois que já existe.

## Mudança parcial

Se uma funcionalidade for apenas parcialmente implementada:

- documentar exatamente o que funciona;
- documentar o que ainda falta;
- usar `[~]` no checklist;
- não chamar de concluída.

## Correção de bug

Mesmo bug pequeno deve atualizar documentação quando o comportamento documentado muda.

Se o bug apenas faz o código voltar a obedecer uma documentação já correta, registrar no PR que **a documentação foi revisada e não precisou de alteração**, com o documento conferido.

## Refactor sem mudança funcional

Pode não exigir alteração de especificação funcional, mas deve:

- manter testes verdes;
- atualizar `ARCHITECTURE.md` ou rastreabilidade se arquivos/responsabilidades mudarem;
- registrar no PR que não houve mudança de comportamento.

## Mudança somente de documentação

Não exige alteração de código/testes, mas a documentação nova deve ser conferida contra:

- código;
- testes;
- migrations.

## Regra de merge

Não fazer merge quando:

- código mudou e nenhuma documentação foi revisada;
- regra mudou sem teste correspondente;
- schema mudou sem documentação de estado/schema;
- dado pessoal novo não foi avaliado em LGPD;
- integração nova não foi registrada;
- funcionalidade foi chamada de pronta sem evidência.

## Automação de CI

O repositório possui `scripts/check-change-sync.mjs`.

Em pull requests, o CI verifica automaticamente regras mínimas:

- mudança em código/config/schema exige documentação no mesmo PR;
- mudança semântica de comportamento em `src/` exige teste no mesmo PR;
- alteração somente de formatação/espaços em `src/` não exige teste novo, mas continua sujeita à revisão/documentação do PR;
- migration exige atualização de documentação de schema/estado;
- workflow/config de deploy exige atualização de documentação de deploy.

A automação é uma barreira mínima. A matriz de impacto deste documento continua sendo obrigatória mesmo quando o script não consegue inferir semanticamente todo o impacto.
