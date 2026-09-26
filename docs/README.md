# Documentação do Feiraê

Atualizado em 26/09/2026 após segunda auditoria código ↔ testes ↔ migrations.

## Regra de interpretação

### Para saber o que existe hoje

Ordem de evidência:

1. código atual;
2. testes atuais;
3. migrations atuais;
4. documentação de rastreabilidade.

### Para saber o comportamento desejado

Usar:

1. especificação funcional;
2. modelo de dados/estados;
3. requisitos administrativos;
4. roadmap.

Um documento de requisito não é prova de implementação.

## Governança de mudanças

- [CHANGE_GOVERNANCE.md](CHANGE_GOVERNANCE.md) — regra obrigatória para código, testes, documentação, schema, segurança, LGPD, integrações, admin e deploy avançarem juntos.
- [../CONTRIBUTING.md](../CONTRIBUTING.md) — regras para contribuições.
- `.github/pull_request_template.md` — checklist de impacto.
- `scripts/check-change-sync.mjs` — verificação automática mínima no CI.

## Rastreabilidade

- [IMPLEMENTATION_TRACEABILITY.md](IMPLEMENTATION_TRACEABILITY.md) — função → arquivo → chave local → tabela SQL.
- [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md) — incompatibilidades concretas frontend x SQL.
- [DOCUMENTATION_STATUS.md](DOCUMENTATION_STATUS.md) — resultado da segunda auditoria.

## Produto

- [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md) — comportamento atual e limites.
- [ORDER_FULFILLMENT_FLOW.md](ORDER_FULFILLMENT_FLOW.md) — pedido e entrega.
- [END_TO_END_AUDIT.md](END_TO_END_AUDIT.md) — implementado x testado x pendente.
- [UI_INTERACTION_AUDIT.md](UI_INTERACTION_AUDIT.md) — botões/campos/edição.
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — identidade, tokens, responsividade e regras de layout.
- [PRODUCT_MEASUREMENT_MATRIX.md](PRODUCT_MEASUREMENT_MATRIX.md) — campos/categorias/unidades reais.
- [FAIR_HOURS.md](FAIR_HOURS.md) — feiras e fontes.

## Backend/arquitetura

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md)
- [SECURITY_AND_AUTH.md](SECURITY_AND_AUTH.md)
- [INTEGRATIONS.md](INTEGRATIONS.md)
- [TESTING_QA.md](TESTING_QA.md)
- [DEPLOYMENT_AND_ENVIRONMENTS.md](DEPLOYMENT_AND_ENVIRONMENTS.md)

## Operação

- [ADMIN_MANAGEMENT_SPEC.md](ADMIN_MANAGEMENT_SPEC.md)
- [ONBOARDING_AND_APPROVAL.md](ONBOARDING_AND_APPROVAL.md)
- [MONEY_FLOW.md](MONEY_FLOW.md)
- [LGPD_AND_PRIVACY.md](LGPD_AND_PRIVACY.md)

## Planejamento

- [AUDIT_MASTER_CHECKLIST.md](AUDIT_MASTER_CHECKLIST.md) — checklist oficial das 57 auditorias + auditoria-mãe de rastreabilidade.
- [MVP_CHECKLIST.md](MVP_CHECKLIST.md)
- [ROADMAP.md](ROADMAP.md)
- [TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md)

## Atualização obrigatória

Mudou código de:

- estado;
- produto;
- veículo;
- promoção;
- pagamento;
- documento;
- RLS;
- migration;
- integração;
- taxa;
- admin;
- teste;
- navegação/layout;
- breakpoint;
- componente visual compartilhado.

Então o PR deve atualizar o documento correspondente.

## Proibição

Não escrever:

- “implementado” sem arquivo/tabela/teste que sustente;
- “CI garante” sem teste direto;
- “backend pronto” somente porque migration existe;
- “deploy feito” somente porque houve merge;
- “aprovação validada” quando é apenas status local.
