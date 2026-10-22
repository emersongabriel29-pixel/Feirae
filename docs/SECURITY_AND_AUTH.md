# Segurança e autenticação — Feiraê

Atualizado em 22/10/2026 após migrations 0001–0007 e integração inicial de Auth/Storage.

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

## 2. Estado real do Supabase

O projeto Supabase `atnwxxyaxlsnlfulhums` está ativo e recebeu as migrations `0001` a `0006`. O schema está criado no banco remoto.

O aplicativo tem integração condicional inicial com Supabase Auth e Storage; os dados de domínio ainda não migraram:

- `package.json` não possui `@supabase/supabase-js`;
- não existe cliente Supabase no frontend;
- login/cadastro ainda usa `src/domain/localAuth.ts` e `localStorage`;
- pedidos, estoque, catálogo, carteira e repasses continuam persistidos localmente;
- não existem Edge Functions implementadas no repositório;
- `.env.example` contém somente placeholders públicos.

Portanto, o banco e as políticas de segurança estão preparados no projeto remoto, mas as jornadas ponta a ponta ainda não estão operando sobre esse banco. Não inserir chaves secretas no frontend.

## 3. RLS: situação após migrations 0001–0007

A verificação no banco remoto confirmou **27 tabelas da aplicação com RLS habilitado e zero tabelas de aplicação sem RLS**. A tabela de metadados `public.spatial_ref_sys` pertence à extensão PostGIS e permanece como exceção de infraestrutura: o papel usado pela integração não é proprietário dessa tabela, então o Supabase recusou habilitar RLS nela. O advisor ainda sinaliza essa exceção e a extensão PostGIS instalada no schema `public`.

Policies atuais, em alto nível:

- `profiles`: leitura/edição do próprio perfil; o papel começa como `customer` e não pode ser promovido pelo próprio usuário.
- `fairs`, `categories`, `products`, `vendor_profiles`, `vendor_stores`, `fair_vendor_memberships`: catálogo público condicionado a feira ativa, produto disponível e feirante aprovado; feirante aprovado administra os próprios produtos e bancas.
- `addresses`, `carts`, `cart_items`: somente dados próprios.
- `orders`, `order_vendors`, `order_items`, `deliveries`, `order_events`: leitura limitada aos participantes autorizados; helpers privados evitam recursão nas policies.
- `delivery_profiles`, `delivery_vehicles`, `delivery_preferences`: dados e veículos próprios; aprovação não pode ser definida pelo próprio entregador.
- `onboarding_documents`: leitura/envio/edição de documentos próprios enquanto pendentes; aprovação e revisão ficam no servidor.
- `promotions`, `promotion_usages`: ofertas ativas visíveis ao público; gestão por feirante aprovado e leitura de usos limitada.
- `support_tickets`: leitura e abertura próprias; edição limitada a chamados próprios ainda abertos.
- `reviews`, `order_reviews`: leitura de avaliações e escrita condicionada a pedido entregue e autoria/participação autenticada.
- `wallet_entries`, `payouts`: leitura dos próprios registros; sem escrita direta pelo cliente.
- `payments`: política explícita de negação para `anon` e `authenticated`; dados financeiros devem passar por operação de servidor.

Triggers também bloqueiam alterações diretas em papel, aprovação, estados críticos e campos financeiros protegidos. Os helpers de autorização ficam no schema privado e não são expostos pela Data API.

## 4. Gaps concretos de autorização ainda pendentes

- O catálogo, pedidos, estoque, carteira e pagamentos ainda não leem/gravam no schema remoto; os adapters de domínio continuam locais.
- Não há Edge Functions/RPCs de negócio para criar pedidos, reservar estoque, validar preços, transicionar pedidos, liquidar pagamentos ou aprovar documentos.
- O bucket privado `onboarding-documents` e o upload inicial para documentos de feirante/entregador foram implementados; fotos de perfil/veículos e a revisão administrativa ainda não foram conectadas.
- A política de administração/RBAC ainda não foi implementada.
- A tabela PostGIS `spatial_ref_sys` e funções auxiliares da extensão permanecem sob propriedade da extensão; a auditoria do Supabase continua exibindo avisos relativos a esses objetos.
- O advisor de performance sinaliza índices recém-criados como ainda não utilizados porque o banco está vazio; isso não demonstra regressão operacional.

As policies atuais são uma barreira de segurança do banco, não uma prova de que os fluxos de produção estejam concluídos.

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


## 6. Estado verificado após migration 0007

- O trigger `feirae_handle_new_auth_user` foi confirmado em `auth.users` e cria perfil inicial com papel restrito a cliente/feirante/entregador; feirante e entregador começam sem aprovação.
- Bucket `onboarding-documents` confirmado como privado, limite 10 MB e allowlist JPG/PNG/PDF.
- Policy de Storage confirmada para papel `authenticated`, limitada à primeira pasta com o UUID do usuário.
- A tentativa de revogar permissões herdadas de `public.spatial_ref_sys` e `st_estimatedextent` **não resolveu** a exposição: o teste de privilégios ainda retornou acesso para `anon` e `authenticated`, e o advisor continua crítico. Não declarar resolvido. É necessária uma decisão explícita sobre habilitar RLS e bloquear o acesso cliente a essa tabela de referência PostGIS, ou outra estratégia compatível com a extensão.
