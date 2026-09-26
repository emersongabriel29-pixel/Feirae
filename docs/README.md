# Documentação do Feiraê

Atualizado em 26/09/2026.

## Como ler esta documentação

Os documentos usam três categorias:

- **Atual/protótipo**: comportamento existente no código atual.
- **Alvo de produção**: comportamento que exige backend/integração.
- **Referência/regra**: decisão de produto, legal ou operacional que orienta implementação.

Quando houver conflito, a prioridade é:

1. [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md) para estados/identidades;
2. [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md) para regras funcionais;
3. [ARCHITECTURE.md](ARCHITECTURE.md) para arquitetura;
4. código/testes para comportamento atual;
5. roadmap para trabalho futuro.

## Produto e fluxos

- [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md) — especificação funcional consolidada.
- [END_TO_END_AUDIT.md](END_TO_END_AUDIT.md) — auditoria completa dos fluxos.
- [UI_INTERACTION_AUDIT.md](UI_INTERACTION_AUDIT.md) — botões, formulários e edição.
- [ORDER_FULFILLMENT_FLOW.md](ORDER_FULFILLMENT_FLOW.md) — pedido, banca, coleta, rota e entrega.
- [PRODUCT_MEASUREMENT_MATRIX.md](PRODUCT_MEASUREMENT_MATRIX.md) — unidades, peso e categorias.
- [FAIR_HOURS.md](FAIR_HOURS.md) — horários/fontes de feiras.

## Arquitetura e dados

- [ARCHITECTURE.md](ARCHITECTURE.md) — arquitetura atual e alvo.
- [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md) — entidades, IDs e máquinas de estados.
- [INTEGRATIONS.md](INTEGRATIONS.md) — integrações externas.
- [SECURITY_AND_AUTH.md](SECURITY_AND_AUTH.md) — autenticação e segurança.
- [DEPLOYMENT_AND_ENVIRONMENTS.md](DEPLOYMENT_AND_ENVIRONMENTS.md) — ambientes, migrations e deploy.
- [TESTING_QA.md](TESTING_QA.md) — estratégia e cobertura de testes.

## Operação e governança

- [ADMIN_MANAGEMENT_SPEC.md](ADMIN_MANAGEMENT_SPEC.md) — painel administrativo e controles.
- [ONBOARDING_AND_APPROVAL.md](ONBOARDING_AND_APPROVAL.md) — documentos e aprovação.
- [MONEY_FLOW.md](MONEY_FLOW.md) — pagamentos, split e repasses.
- [LGPD_AND_PRIVACY.md](LGPD_AND_PRIVACY.md) — dados pessoais e privacidade.

## Planejamento

- [MVP_CHECKLIST.md](MVP_CHECKLIST.md) — concluído x pendente.
- [ROADMAP.md](ROADMAP.md) — próximas fases.
- [TECHNICAL_REVIEW.md](TECHNICAL_REVIEW.md) — revisão técnica atual.

## Regra de manutenção

Toda alteração relevante deve atualizar a documentação correspondente no mesmo PR quando mudar:

- status/estado;
- fluxo de pedido;
- regra financeira;
- papel/permissão;
- dado pessoal;
- integração;
- schema/migration;
- comportamento de botão/formulário;
- critério de teste.

Documentos devem conter data de atualização quando descrevem estado atual.
