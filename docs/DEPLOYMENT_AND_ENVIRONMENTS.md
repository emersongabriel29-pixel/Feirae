# Deploy e ambientes — Feiraê

Atualizado em 26/09/2026 com base no repositório atual.

## 1. O que existe hoje

### Workflow

Existe:

`.github/workflows/quality.yml`.

Ele valida:

- dependências;
- lint;
- testes;
- TypeScript/build;
- Prettier;
- em pull requests, sincronização entre código/testes/documentação via `npm run check:sync`.

O checkout do workflow usa `fetch-depth: 0` para comparar a branch do PR com o SHA base.

### Arquivos de hosting

Não existem no repositório atual:

- `vercel.json`;
- `netlify.toml`;
- `firebase.json`;
- Dockerfile;
- docker-compose;
- `fly.toml`;
- config Render/Railway.

### Supabase CLI/config

Não existe:

- `supabase/config.toml`.

### Edge Functions

Não existe diretório de Edge Functions.

Conclusão: o repositório não contém um pipeline explícito de deploy.

## 1.1 Verificação de sincronização no PR

Script:

`scripts/check-change-sync.mjs`.

Regras automatizadas atuais:

- alteração não documental exige documentação no mesmo PR;
- alteração comportamental em `src/**/*.ts(x)` exige teste alterado;
- migration exige atualização de `SCHEMA_GAP_MATRIX.md`, `DATA_MODEL_AND_STATES.md` ou `IMPLEMENTATION_TRACEABILITY.md`;
- workflow/configuração de ambiente exige atualização deste documento.

A matriz humana completa continua em [CHANGE_GOVERNANCE.md](CHANGE_GOVERNANCE.md).

## 2. .env.example atual

Contém:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Mas o app ainda não possui cliente Supabase instalado.

Essas variáveis não são usadas como backend ativo hoje.

## 3. Merge em main

Merge em `main` significa apenas que o código/documentação entrou na branch principal.

Não significa, por si só:

- deploy;
- atualização do Google AI Studio;
- atualização de hosting;
- produção.

## 4. Ambiente local atual

```bash
npm ci
npm run dev
```

Dados:

- localStorage;
- fixtures;
- serviços públicos de rota/geocoding.

Não usar documentos reais sensíveis.

## 5. Ambiente de desenvolvimento futuro

Precisa de:

- projeto Supabase dev;
- Auth;
- banco;
- Storage;
- migrations;
- dados sintéticos;
- PSP sandbox;
- provedor de rota configurado.

## 6. Staging

Staging deve ser separado de produção.

Obrigatório antes de produção:

- schema igual ao alvo;
- migrations testadas;
- RLS;
- Storage;
- funções server-side;
- PSP sandbox/homologação;
- browser E2E;
- observabilidade;
- dados fictícios.

## 7. Produção

Somente após staging aprovado:

- projeto Supabase separado;
- secrets próprios;
- hosting definido;
- domínio;
- PSP produção;
- observabilidade;
- backup;
- recovery;
- rollback.

## 8. Migrations existentes

- 0001 core;
- 0002 operations.

Não aplicar cegamente em produção porque há gaps conhecidos:

- enum de pedido;
- order_vendor status;
- RLS incompleta;
- promoções incompletas;
- ledger ausente;
- snapshots incompletos.

Ver [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

## 9. Ordem correta antes do primeiro deploy backend

1. criar migration de correção;
2. testar migrations em banco descartável;
3. criar Supabase dev;
4. conectar frontend;
5. testar RLS;
6. criar Storage;
7. testar staging;
8. adicionar E2E;
9. configurar hosting/deploy;
10. só então produção.

## 10. Pipeline alvo

```
PR
→ quality
→ merge main
→ build
→ deploy staging
→ migration check
→ E2E
→ smoke
→ aprovação
→ produção
→ smoke
→ monitoramento
```

## 11. Segredos

Publicáveis quando apropriado:

- URL Supabase;
- anon/publishable key.

Secrets:

- service_role;
- PSP secret;
- webhook secret;
- KYC token privado;
- WhatsApp/BSP secret.

Secrets não podem usar prefixo Vite que os exponha ao bundle.

## 12. Rollback

Antes do primeiro deploy real, documentar e testar:

### Frontend

- voltar para artifact/commit anterior.

### Function

- versionar;
- rollback independente.

### Migration

- preferir forward fix;
- backup antes de destrutiva;
- nunca editar migration já aplicada.

## 13. Critério para afirmar “está publicado”

Só afirmar após verificar:

- ambiente;
- commit implantado;
- URL;
- status do deploy;
- smoke.

Merge sozinho não é evidência.
