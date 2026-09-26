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

Em pull requests, o CI também executa a verificação de sincronização do projeto.

## Requisitos mínimos

- mudança de comportamento em `src/`: atualizar teste;
- mudança de código/config/schema: revisar e atualizar documentação;
- migration: atualizar documentação de schema/estado/rastreabilidade;
- workflow/ambiente: atualizar documentação de deploy;
- dado pessoal novo: revisar LGPD;
- permissão/RLS: revisar segurança;
- gap concluído: atualizar roadmap/checklist/gap matrix.

Use o template de pull request e explique explicitamente itens que não se aplicam.
