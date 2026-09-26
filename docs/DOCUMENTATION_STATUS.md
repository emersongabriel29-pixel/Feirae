# Status da documentação — segunda auditoria

Atualizado em 26/09/2026.

## Motivo da segunda auditoria

A primeira revisão organizou os documentos, mas deixou trechos genéricos e alguns requisitos descritos como se já estivessem implementados.

A segunda auditoria comparou diretamente:

- frontend;
- domain bridges;
- tipos;
- migrations 0001/0002;
- policies RLS;
- 69 testes;
- package.json;
- workflow de CI.

## Correções feitas nesta rodada

### Estados

Documentado exatamente:

- estados do pedido frontend;
- enum SQL;
- divergência `cancelled/canceled`;
- incompatibilidade de `order_vendors.status`;
- pagamento separado;
- payout `withdrawal_requested/requested`.

### Schema

Criado:
[SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

Ele registra campos/tabelas que faltam, inclusive:

- promoções;
- snapshots;
- ledger;
- estoque;
- imagens;
- admin;
- RLS.

### Código

Criado:
[IMPLEMENTATION_TRACEABILITY.md](IMPLEMENTATION_TRACEABILITY.md).

Ele aponta:

- arquivo;
- localStorage key;
- SQL relacionado;
- situação atual.

### Produto

Corrigidos exemplos errados de capacidade.

Valores reais:

- bicicleta 10;
- cargueira 40;
- moto 12;
- moto com baú 20;
- carro 80;
- pickup 250;
- van 500.

### Frete

Documentado que o checkout usa `vendorMetrics.deliveryFee`, não distância/peso real.

### Promoções

Marcados como parciais:

- `horario`;
- `combo`.

Também documentados campos faltantes no SQL:

- `coupon_code`;
- `pay_quantity`;
- `take_quantity`.

### Produtos

Categorias e unidades agora correspondem exatamente a `vendorModel.ts`.

Foto foi corrigida para:

- uma foto Data URL;
- não obrigatória atualmente.

### Segurança

RLS auditada tabela por tabela.

### LGPD

Inventário passou a listar dados e chaves realmente salvos no navegador.

### QA

A documentação agora diferencia:

- teste existente;
- comportamento implementado sem teste dedicado;
- integração ausente.

### Admin

Requisito passou a incluir concretamente:

- UF ativa/inativa;
- feira ativa/inativa;
- catálogo global de veículos;
- capacidade máxima por tipo;
- suspensões;
- taxas versionadas;
- RBAC;
- audit log.

## Documentos novos desta rodada

- `SCHEMA_GAP_MATRIX.md`;
- `IMPLEMENTATION_TRACEABILITY.md`;
- `DESIGN_SYSTEM.md`.

## Documentos reescritos com base no código

- README;
- docs/README;
- DATA_MODEL_AND_STATES;
- SECURITY_AND_AUTH;
- ADMIN_MANAGEMENT_SPEC;
- FUNCTIONAL_SPEC;
- MONEY_FLOW;
- PRODUCT_MEASUREMENT_MATRIX;
- INTEGRATIONS;
- LGPD_AND_PRIVACY;
- TESTING_QA;
- ARCHITECTURE;
- END_TO_END_AUDIT;
- ORDER_FULFILLMENT_FLOW;
- ONBOARDING_AND_APPROVAL;
- MVP_CHECKLIST;
- DEPLOYMENT_AND_ENVIRONMENTS;
- TECHNICAL_REVIEW;
- UI_INTERACTION_AUDIT;
- ROADMAP;
- FAIR_HOURS.

## Pendências que são de código/schema, não de documentação

A documentação agora registra, mas não resolve sozinha:

- Supabase não conectado;
- enum/status incompatível;
- RLS incompleta;
- ledger ausente;
- reserva SQL ausente;
- promoções SQL incompletas;
- admin ausente;
- rota multi-stop ausente;
- PSP/KYC/Storage ausentes.

Esses itens só podem ser marcados concluídos quando o código correspondente for implementado e testado.

## Atualização visual posterior — 26/09/2026

A auditoria de design/layout foi aplicada ao código e documentada.

Mudanças registradas:

- design tokens semânticos;
- responsividade mobile;
- navegação Cliente;
- entrada direta nas Centrais de Feirante/Entregador;
- agrupamento de módulos;
- estados semânticos de pedidos/documentos;
- erros visuais;
- publicação/renderização local de foto de produto;
- regras de QA visual.

A documentação não afirma regressão visual automatizada: Playwright/Cypress e screenshot testing continuam ausentes.


## Governança permanente de atualização

A partir desta rodada, a sincronização do projeto deixa de ser apenas uma convenção manual.

Foram adicionados:

- `docs/CHANGE_GOVERNANCE.md`;
- `CONTRIBUTING.md`;
- `.github/pull_request_template.md`;
- `scripts/check-change-sync.mjs`;
- script npm `check:sync`;
- etapa de CI para pull requests.

Regra: toda alteração deve avaliar impacto em código, interface, testes, documentação, schema, segurança, integrações, LGPD, administração e deploy. O que for afetado deve ser atualizado no mesmo PR.
