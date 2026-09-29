# Segurança e autenticação — Feiraê

Atualizado em 27/09/2026 com auditoria direta das migrations 0001/0002/0003/0003.

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

## Assinatura e aceite de termos de parceiros

O protótipo implementa aceite versionado para Feirante e Entregador.

Registro local atual:

- termo;
- versão;
- papel;
- nome digitado;
- e-mail;
- data/hora;
- fingerprint do conteúdo.

Isso é suficiente apenas para testar UX e regra de aprovação.

### Requisito de produção

A evidência jurídica não pode depender de `localStorage`, pois o próprio usuário pode alterar dados no navegador.

Produção deve registrar o aceite em backend auditável com:

- account/user ID autenticado;
- versão e hash integral do termo;
- timestamp de servidor;
- método de autenticação;
- histórico imutável de versões;
- contexto técnico proporcional ao risco, como IP/user-agent quando houver finalidade, transparência e retenção definidas;
- nova assinatura quando a versão material mudar.

O texto já aceito não deve ser sobrescrito silenciosamente. Uma nova versão cria um novo registro.

Ver [PARTNER_LEGAL_TERMS.md](PARTNER_LEGAL_TERMS.md).

## Mapa nativo e localização

O **Mapa Feiraê** não incorpora conteúdo cartográfico externo na visualização principal.

Controles atuais:

- não existe API key, token ou secret para renderizar o mapa;
- coordenadas de GPS permanecem no estado do frontend e são usadas somente para ordenação/proximidade;
- o cálculo de distância acontece localmente no navegador;
- o link opcional para o Google My Maps não recebe latitude, longitude, sessão ou identificadores do Cliente;
- links externos usam `target="_blank"` com `rel="noopener noreferrer"`;
- coordenadas regionais aproximadas são marcadas como aproximação e não podem alimentar decisões operacionais.

Antes de conectar um SDK ou serviço de geocodificação real, criar adapter específico, definir credenciais publicáveis/secretas, revisar política de dados e documentar rate limit, fallback e observabilidade.

## Segurança do rastreamento de entrega

`driver.location` é dado de localização e deve ser tratado como informação de acesso restrito ao pedido.

Regras do protótipo:

- somente a sessão do Entregador atribuída ao pedido atualiza o snapshot;
- o watcher só inicia em corrida ativa e depois de o Entregador ter configurado localização-base via GPS;
- atualizações não geram eventos de timeline para evitar crescimento desnecessário do histórico;
- o watcher é encerrado ao sair da corrida;
- sem GPS disponível, nenhuma localização é inventada: a UI usa apenas a etapa operacional.

Requisitos de produção:

- autorização server-side por `orderId` + `driverId`;
- canal realtime autenticado;
- rejeitar escrita de localização por Cliente/Feirante;
- TTL curto e política de retenção;
- rate limit e validação de coordenadas;
- trilha de auditoria para alteração de vínculo do entregador;
- não expor localização histórica fora da janela operacional da entrega.

## Recuperação de senha no protótipo — 28/09/2026

A tela de entrada passa a oferecer **Esqueci minha senha** para Cliente, Feirante e Entregador.

No protótipo local:

- o usuário seleciona o papel da conta;
- informa o e-mail;
- define e confirma uma nova senha com mínimo de 6 caracteres;
- a senha continua persistida somente como `passwordDigest` em `feirae:local-auth:v1`;
- contas demo oficiais `cliente@feirae.test`, `feirante@feirae.test` e `entregador@feirae.test` podem ser redefinidas no dispositivo;
- a redefinição não inicia sessão automaticamente.

### Limite de segurança obrigatório

Esse mecanismo serve **somente para demonstração local**. Como ainda não existe provedor de autenticação conectado, não há prova de posse do e-mail. Portanto, ele não pode ser levado para produção como está.

Produção deve substituir `resetLocalAccountPassword` por fluxo do provedor de autenticação com, no mínimo:

- link de uso único ou OTP enviado ao canal verificado;
- token com expiração curta e uso único;
- resposta neutra para evitar enumeração de contas;
- rate limit por conta, IP/dispositivo e janela de tempo;
- revogação/rotação de sessões após redefinição quando aplicável;
- trilha de auditoria server-side sem registrar senha, OTP ou token em texto aberto;
- proteção contra reutilização de token e ataques automatizados.

## Revisão de arquivos de identidade — 28/09/2026

Foto de entregador e certidões de antecedentes foram adicionadas ao protótipo local de onboarding.

Estado atual:

- arquivo é lido como Data URL e persistido localmente;
- limite padrão do helper continua 1,5 MB;
- o input de foto restringe a seleção a JPG/PNG/WebP no frontend;
- não há reconhecimento facial;
- não há consulta automática de antecedentes;
- não há decisão automática baseada no conteúdo do documento.

Isso **não é arquitetura de produção**. Antes de liberar dados reais, mover foto/documentos para Storage privado, validar conteúdo/magic bytes no servidor, aplicar antivírus quando cabível, RLS/RBAC, URLs assinadas, trilha de auditoria, retenção e controles contra IDOR. O status de aprovação deve ser gravado por ação autorizada do backend/admin, não confiado ao cliente.
