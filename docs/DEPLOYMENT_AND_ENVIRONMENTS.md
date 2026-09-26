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

Existe:

- `supabase/functions/admin-actions/index.ts`.

Ela executa ações administrativas críticas, valida MFA/AAL2, RBAC e auditoria.

Conclusão: o repositório continua sem pipeline automático de deploy, mas agora possui artefato server-side que precisa ser publicado no Supabase do Feiraê.

## 1.1 Verificação de sincronização do projeto

Script:

`scripts/check-change-sync.mjs`.

Regras automáticas atuais:

- alteração não documental exige documentação no mesmo PR;
- alteração comportamental em `src/**/*.ts(x)` exige teste alterado;
- migration exige atualização de documentação de schema/estado/rastreabilidade;
- workflow/configuração de ambiente exige atualização deste documento.

A automação é propositalmente mínima. A revisão humana completa continua em [CHANGE_GOVERNANCE.md](CHANGE_GOVERNANCE.md).

## 2. .env.example atual

Contém:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Mas o app ainda não possui cliente Supabase instalado.

Essas variáveis não são usadas como backend ativo hoje.

### Secrets/env da Gestão server-side

A Edge Function usa os secrets padrão do Supabase:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

Health checks opcionais usam URLs HTTPS server-side:

- `MAPS_HEALTH_URL`;
- `PAYMENTS_HEALTH_URL`;
- `WHATSAPP_HEALTH_URL`;
- `PUSH_HEALTH_URL`.

Essas URLs/secrets não devem ser colocadas em variáveis `VITE_*`.

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
- 0002 operations;
- 0003 management console/runtime configuration.

A 0003 adiciona a Gestão, RBAC, MFA administrativo, alertas, regras de runtime e RLS administrativo.

Não aplicar cegamente em produção porque o app principal ainda possui gaps conhecidos:

- enum de pedido;
- order_vendor status;
- RLS incompleta;
- promoções incompletas;
- ledger ausente;
- snapshots incompletos.

Ver [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

## 9. Ordem correta antes do primeiro deploy backend

1. identificar/criar o projeto Supabase correto do Feiraê;
2. testar 0001 → 0002 → 0003 em banco descartável;
3. aplicar no ambiente dev/staging;
4. publicar `admin-actions`;
5. configurar MFA do Auth;
6. configurar Storage privado;
7. configurar health URLs server-side;
8. testar RLS/RBAC por papel;
9. publicar a Gestão separadamente;
10. conectar o app principal ao backend/runtime configuration;
11. adicionar E2E/smoke;
12. só então produção.

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


## 14. Deploy da Área de Gestão

`/admin` é um artefato web separado do app público.

Antes de produção:

- usar URL/chave pública do Supabase correto;
- não expor `service_role`;
- aplicar migration 0003;
- publicar `admin-actions`;
- validar login + MFA;
- validar permissões de um admin comum e de um superadmin;
- validar que o browser recebe `permission denied` ao tentar mutações críticas diretamente;
- executar smoke de pedidos, documentos, conciliação, alertas e auditoria.

A configuração manual da URL/chave pública existe apenas para bootstrap de ambiente; em produção a conexão deve ser provisionada no deploy e não tratada como segredo.
