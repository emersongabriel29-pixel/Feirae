# Segurança e autenticação — Feiraê

Atualizado em 26/09/2026 com auditoria direta das migrations 0001/0002.

## 1. Autenticação atual

Arquivo: `src/domain/localAuth.ts`.

O protótipo implementa localmente:

- cadastro;
- login;
- senha mínima de 6 caracteres;
- troca de e-mail;
- troca de senha;
- digest local;
- contas demo `@feirae.test`.

Persistência:

- `feirae:local-auth:v1`;
- `feirae:session`.

Isso serve somente para testar a experiência.

Não é aceitável em produção porque:

- credencial vive no navegador;
- não há servidor de autenticação;
- não há recuperação real;
- não há rate limit;
- não há revogação central;
- não há MFA;
- não há proteção multi-dispositivo.

## 2. Supabase: app principal x Gestão

O app principal de Cliente/Feirante/Entregador ainda não usa Supabase como backend compartilhado e continua com persistência local em vários fluxos.

A Área de Gestão, porém, já possui integração própria com Supabase via `supabase-js` no navegador e uma Edge Function administrativa em `supabase/functions/admin-actions/index.ts`.

A migration `0003_management_console.sql` e a Edge Function ainda precisam ser aplicadas/publicadas no projeto Supabase correto do Feiraê antes de uso real.

## 3. RLS: situação exata

### Sem RLS habilitada nas migrations atuais

- `vendor_stores`
- `categories`
- `order_vendors`
- `order_items`
- `carts`
- `deliveries`
- `payments`
- `reviews`

Essas tabelas não devem ser expostas diretamente ao cliente antes de políticas adequadas.

### RLS habilitada e com policies existentes

`profiles`:

- usuário gerencia o próprio perfil.

`fairs`:

- leitura pública de feiras ativas.

`products`:

- leitura pública de produtos disponíveis.

`addresses`:

- usuário gerencia os próprios endereços.

`orders`:

- cliente possui SELECT dos próprios pedidos.

`cart_items`:

- usuário gerencia itens do próprio carrinho.

`delivery_profiles`:

- entregador gerencia próprio perfil.

`delivery_vehicles`:

- entregador gerencia próprios veículos.

`delivery_preferences`:

- entregador gerencia próprias preferências.

`onboarding_documents`:

- usuário vê, envia e atualiza documentos próprios pendentes.

`promotions`:

- público lê promoções ativas;
- feirante gerencia promoções próprias.

`order_events`:

- participantes leem eventos.

`wallet_entries`:

- cliente lê próprios lançamentos.

`payouts`:

- usuário lê próprios repasses.

### RLS habilitada, mas sem policy funcional suficiente na migration

- `vendor_profiles`
- `promotion_usages`
- `support_tickets`
- `order_reviews`

## 4. Gaps concretos de autorização

### Produto

Existe SELECT público, mas não há policy explícita de INSERT/UPDATE/DELETE do feirante.

### Pedido

Cliente tem SELECT, mas criação e transições não estão modeladas como operações seguras.

### Banca e item de pedido

`order_vendors` e `order_items` não têm RLS.

### Entrega

`deliveries` não tem RLS.

### Pagamento

`payments` não tem RLS.

### Aprovação documental

Usuário envia documento próprio, mas não existe policy administrativa documentada para:

- revisar;
- aprovar;
- rejeitar;
- solicitar correção.

### Suporte e avaliações

Tabelas existem, porém policies não completam leitura/escrita pelos participantes.

## 5. Operações que não devem virar CRUD livre no browser

Produção deve usar RPC/Edge Function/backend para:

- criar pedido;
- reservar estoque;
- confirmar preço;
- aceitar pedido da banca;
- marcar banca pronta;
- atribuir entregador;
- confirmar coleta;
- confirmar entrega;
- cancelar após regras;
- criar cobrança;
- processar webhook;
- estornar;
- gerar ledger;
- pedir/efetivar repasse;
- aprovar documento;
- suspender usuário;
- alterar taxa.

## 6. Chaves

Pode ir ao frontend, quando configurado corretamente:

- URL pública do Supabase;
- chave publishable/anon destinada ao cliente.

Nunca deve ir ao frontend:

- `service_role`;
- segredo do PSP;
- assinatura de webhook;
- credencial de KYC;
- token administrativo;
- segredo de WhatsApp/BSP.

## 7. Documentos

Hoje `storedFile.ts`:

- aceita arquivo selecionado;
- limita a 1.500.000 bytes;
- converte para Data URL;
- usa `file.type` informado pelo navegador.

No app principal local ainda não há:

- magic bytes;
- antivírus;
- validação real de PDF/imagem;
- upload remoto.

Para o backend futuro, a Gestão já adiciona bucket privado e a Edge Function `document-upload`, que valida tamanho, MIME e magic bytes de PDF/JPEG/PNG antes de gravar no Storage. A leitura administrativa usa URL assinada temporária. Antivírus/antimalware continua como camada adicional recomendada antes de produção.

## 8. Cartão

A UI salva somente:

- nome do titular;
- últimos 4 dígitos;
- validade;
- tipo;
- bandeira.

Número completo e CVV ficam apenas no estado temporário do formulário e são limpos após salvar.

Produção deve substituir o formulário por tokenização/SDK do PSP; CVV nunca deve ser persistido.

## 9. Upload e conteúdo malicioso

Antes de produção:

- validar MIME real;
- magic bytes;
- tamanho;
- extensão;
- renomear server-side;
- bloquear conteúdo executável;
- antivírus quando aplicável;
- não confiar em nome do arquivo.

## 10. Admin

A Gestão implementa:

- UI administrativa separada;
- `admin_access`;
- superadmin explícito;
- permissões granulares;
- MFA TOTP obrigatório com AAL2;
- RLS administrativo;
- audit log;
- ações críticas server-side;
- bloqueio do papel `fair_manager` enquanto não existir escopo por feira.

Não existe mais fallback de acesso total quando um admin não possui permissões. Acesso total só existe com `is_superadmin=true`.

Pedidos, entregas, pagamentos, documentos, LGPD, moderação, restrições e gestão de administradores usam a Edge Function `admin-actions` para operações críticas.

## 11. Critério objetivo de segurança para staging

Staging só pode ser considerado backend-integrado quando:

- Auth real estiver conectado;
- policies forem testadas por papel;
- todas as tabelas expostas tiverem RLS/policy ou acesso exclusivo por backend;
- preço/estoque/status não forem definidos pelo browser;
- documentos estiverem em Storage privado;
- nenhuma service key estiver no bundle;
- testes de acesso cruzado passarem.

Matriz completa de gaps: [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).


## 12. Regras adicionais da Gestão

- O browser não possui permissão genérica de UPDATE para pagamentos/repasses/pedidos/entregas.
- A Edge Function valida o JWT, exige `aal2`, papel admin ativo e permissão.
- `service_role` existe somente no ambiente da Edge Function.
- O bucket `onboarding-documents` é privado e limitado a PDF/JPEG/PNG e 5 MB.
- `document-upload` valida conteúdo por magic bytes e tamanho; antivírus/antimalware permanece como camada adicional recomendada antes de produção.
- Health checks usam URLs HTTPS definidas em variáveis server-side; o navegador nunca recebe esses endpoints secretos quando houver proxy interno.


## 13. Configuração do painel administrativo

Em produção, a Gestão lê URL e chave publishable/anon de `admin/config.json`. A tela de troca manual de conexão só é aceita em localhost/desenvolvimento. Isso evita que um administrador aponte o painel publicado para outro banco pelo navegador. A chave pública continua protegida por RLS; segredos permanecem server-side.
