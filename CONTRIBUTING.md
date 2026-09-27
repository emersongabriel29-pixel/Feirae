# Contribuindo com o Feiraê

Toda contribuição deve seguir [docs/CHANGE_GOVERNANCE.md](docs/CHANGE_GOVERNANCE.md).

## Regra do projeto

Código, testes, documentação, schema, segurança, integrações, LGPD, admin e deploy não podem evoluir como silos.

Antes de abrir PR:

```bash
npm ci
npm run check
npm run format:check
```

Em pull requests, o CI também executa a verificação semântica de sincronização do projeto.

A política é testada separadamente por `npm run test:sync-policy` e o `npm run check` executa essa suíte junto com lint, Vitest e build.

## Requisitos mínimos

- mudança de comportamento em `src/`: atualizar teste;
- mudança de código/config/schema: revisar e atualizar documentação;
- migration: atualizar `SCHEMA_GAP_MATRIX.md`, `DATA_MODEL_AND_STATES.md`, `IMPLEMENTATION_TRACEABILITY.md` e `DEPLOYMENT_AND_ENVIRONMENTS.md`;
- alteração de testes: atualizar `TESTING_QA.md`;
- UI/UX: atualizar `UI_INTERACTION_AUDIT.md` e `DESIGN_SYSTEM.md`;
- splash/assinatura sonora: atualizar `LAUNCH_EXPERIENCE.md`, `ARCHITECTURE.md` e `FUNCTIONAL_SPEC.md`;
- pedido/estoque/carteira: atualizar `FUNCTIONAL_SPEC.md` e `IMPLEMENTATION_TRACEABILITY.md`;
- notificações: atualizar `NOTIFICATIONS.md` e `IMPLEMENTATION_TRACEABILITY.md`;
- workflow/ambiente: atualizar documentação de deploy;
- dado pessoal novo: revisar LGPD;
- permissão/RLS: revisar segurança;
- gap concluído: atualizar roadmap/checklist/gap matrix.

Use o template de pull request e explique explicitamente itens que não se aplicam.
