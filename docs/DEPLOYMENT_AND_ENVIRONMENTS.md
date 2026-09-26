# Deploy e ambientes — Feiraê

Atualizado em 26/09/2026.

## Estado atual

O GitHub Actions valida código, mas **merge em `main` não significa automaticamente deploy em produção**.

Não há neste documento uma infraestrutura de hosting presumida. Deve ser configurada e verificada explicitamente.

## Ambientes

### Local

- fixtures/dados demo permitidos;
- autenticação local permitida;
- serviços de protótipo permitidos;
- não usar dados pessoais reais sensíveis.

### Development

Objetivo: integração contínua.

- Supabase dev próprio;
- dados sintéticos;
- migrations aplicadas automaticamente/por pipeline controlado;
- PSP sandbox.

### Staging

Deve reproduzir produção:

- Auth real;
- RLS;
- Storage;
- Edge Functions;
- integrações sandbox/homologação;
- E2E;
- validação de migrations.

### Produção

- projeto Supabase separado;
- secrets separados;
- domínio/hosting final;
- observabilidade;
- backups;
- rollback;
- dados reais.

## Variáveis

Classificar:

### Públicas/publishable

Podem ser expostas ao browser somente se o provedor as projetou para isso.

Exemplo: URL pública do Supabase e chave publishable/anon com RLS correta.

### Secrets

Nunca no frontend:

- service role;
- secret do PSP;
- webhook signing secret;
- credenciais administrativas;
- tokens privados de KYC.

## Migrations

Regras:

1. migration é versionada;
2. não editar migration já aplicada em produção;
3. criar nova migration;
4. testar em banco descartável;
5. testar staging;
6. backup/rollback quando mudança destrutiva;
7. registrar resultado.

As migrations atuais são preparação e ainda precisam de normalização de estados antes da produção.

## Deploy frontend

Pipeline alvo:

```
PR
→ Quality
→ merge main
→ build artifact
→ deploy staging
→ E2E/smoke
→ aprovação
→ deploy produção
→ smoke/monitoramento
```

## Edge Functions/backend

Deploy separado e versionado.

Evitar dependência de “última versão do frontend” sem compatibilidade.

## Rollback

Definir:

- rollback de frontend;
- rollback/forward fix de function;
- estratégia para migration irreversível;
- feature flags para integrações.

## Seed/demo

Fixtures não devem aparecer em produção.

Contas `@feirae.test` são exclusivas para demo/teste.

## Checklist antes de publicar

- [ ] CI verde;
- [ ] migration validada;
- [ ] secrets corretos;
- [ ] ambiente correto;
- [ ] E2E;
- [ ] smoke;
- [ ] RLS;
- [ ] backups;
- [ ] observabilidade;
- [ ] sem fixtures/demo;
- [ ] documentação atualizada.

## Regra operacional

Nunca afirmar “está em produção” apenas porque houve merge em `main`. Confirmar o deployment do ambiente correspondente.
