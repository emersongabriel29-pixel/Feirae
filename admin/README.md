# Feiraê Gestão

Painel administrativo separado do aplicativo usado por Cliente, Feirante e Entregador.

## Segurança

A Gestão exige:

1. Supabase Auth;
2. `profiles.role = 'admin'`;
3. `admin_access.active = true`;
4. MFA/TOTP com sessão `aal2`;
5. permissão explícita por módulo ou `is_superadmin = true`.

Não existe fallback “sem permissões = acesso total” e não existe permissão coringa `*`.

Ações críticas não são CRUD livre no navegador. Elas passam por:

`supabase/functions/admin-actions/index.ts`

Entre elas:

- transição de pedido;
- intervenção em entrega;
- conciliação;
- revisão documental;
- moderação de avaliação;
- LGPD;
- suporte;
- suspensões/bloqueios;
- gestão de administradores;
- alertas;
- health checks.

A `service_role` e demais segredos nunca devem ir para o navegador.

## Bootstrap

Antes de abrir a Gestão em um ambiente real:

1. aplique `0001_feirae_core.sql`;
2. aplique `0002_feirae_operations.sql`;
3. aplique `0003_management_console.sql`;
4. publique a Edge Function `admin-actions`;
5. configure uma conta inicial `admin` em ambiente seguro;
6. garanta que ela possua linha ativa em `admin_access`;
7. configure MFA no primeiro acesso.

A migration transforma administradores já existentes no momento da aplicação em superadmins explícitos para evitar lockout inicial.

## Módulos

### Visão geral
- Dashboard;
- Relatórios.

### Operação
- Alertas persistentes;
- Pedidos;
- Entregas;
- Suporte;
- Aprovações;
- Suspensões/bloqueios.

### Cadastros
- Estados;
- Feiras;
- Bancas/Boxes;
- Usuários;
- Feirantes;
- Entregadores;
- Produtos;
- Categorias;
- Regiões.

### Regras
- Veículos permitidos;
- Frete;
- Taxas;
- Meios de pagamento;
- Cancelamentos;
- Documentos exigidos.

### Financeiro/comercial
- Financeiro;
- Pagamentos;
- Promoções;
- Repasses;
- Avaliações.

### Comunicação
- Conteúdo;
- Avisos;
- Templates de mensagens.

### Sistema
- Configurações;
- Feature flags;
- Integrações;
- Saúde das integrações;
- Administradores;
- LGPD;
- Permissões;
- Auditoria.

## Funcionalidades de operação

- data/hora no formato `26/09/2026 - 08:55`;
- paginação server-side;
- busca no banco;
- seletores amigáveis em lugar de UUID/código quando aplicável;
- visão 360° de Cliente, Feirante e Entregador;
- pedidos/entregas detalhados;
- conciliação segura;
- alertas com reconhecer/resolver;
- health check server-side;
- auditoria imutável para o navegador;
- login/logout administrativo auditado;
- CSV e impressão/PDF;
- ações em lote para configurações compatíveis.

## Documentos

O bucket `onboarding-documents` é privado e a migration define:

- limite de 5 MB;
- PDF/JPEG/PNG;
- pasta do próprio usuário;
- leitura administrativa autorizada;
- URL temporária para visualização.

Ainda é necessária validação server-side de conteúdo real/magic bytes e antivírus antes de produção.

## Testes

`admin/management.test.js` verifica os principais guardrails estruturais da Gestão.

O CI do repositório também executa lint, testes, build, sincronização de documentação e Prettier.

## Produção

O código da Gestão pode ser publicado separadamente do bundle React, mas **não deve ser considerado ativo** até:

- usar o Supabase correto do Feiraê;
- migration 0003 estar aplicada;
- `admin-actions` estar publicada;
- RLS/RBAC/MFA serem testados em staging;
- advisors do Supabase serem revisados;
- smoke/E2E administrativos passarem.

O único projeto Supabase conectado durante esta implementação não foi identificado com segurança como Feiraê; por isso nenhuma alteração foi aplicada em banco real.
