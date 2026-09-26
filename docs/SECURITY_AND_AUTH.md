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

## 2. Supabase ainda não está conectado ao app

Fatos atuais:

- existem `.env.example`, 0001 e 0002;
- `package.json` **não possui `@supabase/supabase-js`**;
- não existe cliente Supabase no frontend;
- não existe `supabase/config.toml`;
- não existem Edge Functions no repositório.

Portanto, migrations existentes são preparação de schema, não backend ativo.

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

Não há:

- magic bytes;
- antivírus;
- validação real de PDF/imagem;
- Storage privado;
- URL assinada;
- auditoria de acesso.

Produção precisa de bucket privado e validação server-side.

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

O enum SQL possui `admin` e `fair_manager`, mas não existe:

- UI administrativa;
- RBAC granular;
- policy administrativa consolidada;
- audit log;
- MFA.

Isso precisa ser implementado antes de uso operacional.

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
