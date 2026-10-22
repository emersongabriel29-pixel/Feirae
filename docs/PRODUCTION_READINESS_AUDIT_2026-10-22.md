# Auditoria de prontidão para produção — Feiraê

**Data da verificação:** 22/10/2026  
**Repositório:** `emersongabriel29-pixel/Feirae`  
**Branch base consultada:** `main`  
**Projeto Supabase consultado:** `atnwxxyaxlsnlfulhums`  
**Escopo:** leitura e consultas; nenhuma alteração no banco ou implantação de funções foi feita nesta auditoria.

## Resumo executivo

O aplicativo continua documentado como um protótipo cuja autenticação e persistência principal usam o navegador. O projeto Supabase, entretanto, já possui schema operacional, policies, trigger de criação de perfil, bucket privado e sete migrations registradas. O repositório contém somente três arquivos SQL de migration. Essa divergência impede uma integração segura até que o SQL das migrations ausentes seja recuperado ou reconstruído e revisado.

Não considerar o Feiraê pronto para produção. Não foram executados build, testes Vitest ou testes end-to-end nesta sessão.

## Estado observado no GitHub

- Branch padrão: `main`.
- Último commit consultado: `b8900c4aa3fc69c0f93bd243ee1752f6c0a1efa8` — ajuste de largura/alinhamento dos botões da tela inicial (21/10/2026).
- Stack do app: React 19, TypeScript, Vite.
- `package.json` não inclui `@supabase/supabase-js`.
- `.env.example` contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, mas o README afirma que o aplicativo não está conectado ao Supabase.
- Os bridges de autenticação, catálogo, pedidos, estoque e carteira usam armazenamento local; não sincronizam aparelhos diferentes.
- Não foi possível consultar um diretório de trabalho local com alterações não commitadas pelo conector GitHub. A ausência de alterações locais não foi presumida.

## Divergência de migrations

### No repositório

- `0001_feirae_core.sql`
- `0002_feirae_operations.sql`
- `0003_vendor_store_minimum_order.sql`

### Registradas no Supabase

| Versão no banco | Nome |
|---|---|
| 20261022102141 | 0001_feirae_core |
| 20261022102145 | 0002_feirae_operations |
| 20261022102147 | 0003_vendor_store_minimum_order |
| 20261022102155 | 0004_security_rls_hardening |
| 20261022102303 | 0005_rls_nonrecursive_helpers |
| 20261022102426 | 0006_exposed_surface_and_fk_indexes |
| 20261022104451 | 0007_auth_storage_and_extension_surface |

Os arquivos `0004` a `0007` não foram encontrados no diretório de migrations do GitHub. A tabela de histórico registra nome e versão, mas não fornece o conteúdo SQL aplicado.

**Ação segura necessária:** recuperar o SQL exato da origem que aplicou essas migrations. Se não existir cópia, comparar o schema vivo, funções, triggers, grants, policies, constraints, índices e Storage contra `0001`–`0003`; então criar migrations de baseline/reconciliação revisadas. Não reaplicar `0001`–`0003`, não editar o histórico de migrations e não assumir que nomes iguais provam igualdade de conteúdo.

## Segurança: findings observados

### 1. RLS desativada em `public.spatial_ref_sys` — alerta crítico do Advisor

Consulta ao catálogo confirmou `relrowsecurity = false` para essa tabela do PostGIS. O restante das tabelas públicas listadas, incluindo as tabelas de negócio, tinha RLS habilitada.

O Advisor recomenda:

```sql
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
```

**Esse SQL não foi executado.** Antes de aplicá-lo, é necessário definir as policies apropriadas para a tabela de referência do PostGIS. Habilitar RLS sem policies pode bloquear leitura da tabela e quebrar operações dependentes da extensão. Avaliar se ela deve permanecer exposta ao Data API ou ser movida/protegida de forma compatível com PostGIS.

Referência: https://supabase.com/docs/guides/database/postgres/row-level-security

### 2. PostGIS instalado no schema `public`

O Advisor emitiu aviso `extension_in_public`; consulta ao catálogo confirmou PostGIS 3.3.7 no schema `public`. Mover a extensão exige plano de compatibilidade para tipos, operadores, funções, views e objetos dependentes. Não mover automaticamente.

### 3. Três overloads `public.st_estimatedextent` são SECURITY DEFINER e executáveis por anon/authenticated

As três assinaturas detectadas são:

- `st_estimatedextent(text, text)`
- `st_estimatedextent(text, text, text)`
- `st_estimatedextent(text, text, text, boolean)`

O ACL consultado concede EXECUTE a `anon` e `authenticated`. São funções da extensão PostGIS, não funções de negócio criadas para o Feiraê. Não revogar privilégios cegamente: primeiro confirmar quais clientes e rotinas dependem delas, e avaliar restringir a exposição da extensão ou do Data API.

### 4. Policies RLS: cobertura e limites

Foram consultadas as policies em `public` e `storage`, incluindo `USING` e `WITH CHECK`. Não foram encontrados registros de policies UPDATE/ALL sem expressão `WITH CHECK` na consulta específica.

Pontos positivos observados:

- Perfis possuem policies próprias e trigger `private.prevent_privileged_field_changes` que protege campos privilegiados como papel e aprovação.
- Documentos de onboarding possuem policies para criação/visualização próprios e atualização limitada a estados pendentes/correção.
- Pagamentos possuem policy `payments are server only` com `USING false` e `WITH CHECK false` para anon/authenticated.
- Pedidos, itens, participações por banca, eventos e entregas têm policies de leitura condicionadas à participação, apoiadas por funções do schema `private`.
- O bucket `onboarding-documents` é privado, com limite observado de 10 MiB e tipos permitidos JPEG, PNG e PDF; a policy de objetos restringe a pasta inicial ao UUID do usuário.

Pendências de segurança:

- Validar em testes com papéis reais que nenhuma policy permita leitura cruzada de endereços, documentos, pedidos, telefone ou localização.
- Rever todos os privilégios por tabela e função, não somente RLS. A consulta `has_table_privilege` indicou permissões de tabela para anon/authenticated; RLS continua sendo essencial para limitar linhas, mas os grants devem ser explicitados e documentados.
- Revisar as funções `SECURITY DEFINER` do schema `private`. As funções de checagem de participação usam `search_path` vazio e referências qualificadas; preservar esse padrão e testar comportamento/ACL.
- Confirmar que nenhuma decisão de autorização dependa de `raw_user_meta_data` como claim JWT. O trigger de signup usa metadados apenas para escolher perfil inicial e mantém feirante/entregador não aprovados; validar esse limite em testes.
- Executar os Advisors após as correções, sem alterar objetos da extensão sem plano.

## Autenticação e criação de perfil

Foi encontrado o trigger `feirae_handle_new_auth_user` em `auth.users`, chamando `private.handle_new_auth_user()`. A função cria o perfil e cria o registro de feirante/entregador como não aprovado. Isso confirma que há preparação no banco para Supabase Auth; não comprova que o frontend usa Auth.

No código, `src/domain/localAuth.ts` ainda implementa autenticação local, digest local e recuperação local. Não há SDK Supabase nas dependências declaradas.

## Backend e operações

A lista de Edge Functions do projeto retornou vazia. Tabelas operacionais existem, mas a existência de tabelas não comprova operações seguras de negócio.

Antes de produção, implementar e testar operações transacionais no servidor para:

- criar pedido e snapshots com preços vindos do banco;
- validar mínimo por banca e disponibilidade;
- reservar/consumir/liberar estoque atomicamente;
- transições de estado permitidas por papel;
- cancelamentos e estornos idempotentes;
- confirmação de pagamento por webhook assinado;
- ledger por recebedor e conciliação;
- revisão de documentos e trilha de auditoria;
- repasses apenas após confirmação de liquidação pelo provedor.

Não aceitar preço, comissão, saldo, aprovação ou status privilegiado fornecidos pelo navegador como fonte de verdade.

## Painel Feirae-Gestao

A especificação no repositório descreve o painel como shell visual, não como administração operacional. A enumeração SQL inclui `admin` e `fair_manager`, mas isso não substitui RBAC granular, policies administrativas, auditoria e APIs de gestão.

Não ativar ações de administração até que existam autorização server-side e trilha auditável.

## Plano de implementação bloqueado por dependências

1. **Recuperar migrations 0004–0007** e registrar uma baseline fiel; comparar catálogo do banco com os arquivos do GitHub.
2. **Fechar os findings de segurança** em branch separada: desenhar policies para `spatial_ref_sys`, decidir exposição do PostGIS, revisar grants/ACLs e testar acesso por papel.
3. **Conectar Supabase Auth** e perfis com mapeamento explícito `feirante` ↔ `vendor`; manter a experiência visual e os fluxos de demonstração sem misturar credenciais locais com sessões de produção.
4. **Substituir os bridges locais por repositórios remotos** para catálogo, pedidos e estoque, preservando compatibilidade de interfaces e evitando migração destrutiva dos dados locais.
5. **Implementar RPCs/Edge Functions transacionais** para pedido, estoque, pagamentos, cancelamentos, documentos e repasses.
6. **Implementar Feirae-Gestao** com permissões granulares e registro de auditoria.
7. **Executar CI**: lint, testes existentes, testes novos de RLS/integração, build e revisão dos Advisors. Só então preparar publicação controlada.

## Limitação de execução desta sessão

O ambiente disponível permitiu consultar e editar arquivos pelo conector GitHub e consultar o Supabase, mas não disponibilizou um clone local do repositório nem conectividade de rede no terminal para `git clone`. Portanto não foi possível executar `npm ci`, `npm run check`, gerar um lockfile por npm, rodar testes locais ou comparar dumps completos. Não serão declarados testes aprovados sem evidência.

## Resultado

- Banco: somente leitura nesta auditoria.
- Edge Functions: nenhuma implantada.
- Código de aplicação: não alterado nesta etapa.
- Correções de segurança: não aplicadas automaticamente.
- Próximo gate: recuperar a origem das migrations 0004–0007 e estabelecer execução de CI antes de alterações amplas de aplicação.
