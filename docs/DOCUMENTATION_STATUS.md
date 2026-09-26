# Auditoria da documentação — Feiraê

Atualizado em 26/09/2026.

## Resultado

A documentação foi sincronizada com o estado do código após as auditorias de fluxos e de interface.

## Documentos atualizados nesta rodada

- `README.md`;
- `FUNCTIONAL_SPEC.md`;
- `END_TO_END_AUDIT.md`;
- `ORDER_FULFILLMENT_FLOW.md`;
- `MONEY_FLOW.md`;
- `MVP_CHECKLIST.md`;
- `ONBOARDING_AND_APPROVAL.md`;
- `PRODUCT_MEASUREMENT_MATRIX.md`;
- `FAIR_HOURS.md`;
- `ROADMAP.md`;
- `TECHNICAL_REVIEW.md`.

## Documentos criados

- `docs/README.md`;
- `ARCHITECTURE.md`;
- `DATA_MODEL_AND_STATES.md`;
- `ADMIN_MANAGEMENT_SPEC.md`;
- `INTEGRATIONS.md`;
- `SECURITY_AND_AUTH.md`;
- `LGPD_AND_PRIVACY.md`;
- `TESTING_QA.md`;
- `DEPLOYMENT_AND_ENVIRONMENTS.md`;
- `UI_INTERACTION_AUDIT.md`.

## Correções conceituais

- README deixa de descrever o app como demo simples.
- Roadmap reconhece que migrations já existem.
- Checklist separa protótipo de produção.
- Revisão técnica remove tarefas já concluídas.
- Fluxo de pedido usa estados atuais.
- Documento canônico separa estado de pedido, banca, pagamento e entrega.
- Documentação de Supabase esclarece chave pública x segredo.
- Recursos futuros são identificados como futuros, não como implementados.
- 69 testes passam a ser a referência documentada.

## Pendência técnica documentada

As migrations ainda possuem enum de pedido legado e grafia `canceled` diferente de `cancelled`. Isso está documentado como migration futura obrigatória antes da integração real.

## Manutenção

Mudança funcional relevante deve atualizar docs no mesmo PR.
