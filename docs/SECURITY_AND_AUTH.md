# Segurança e autenticação — Feiraê

Atualizado em 26/09/2026.

## Estado atual

O protótipo possui autenticação local para validar a experiência:

- cadastro;
- senha mínima;
- login;
- alteração de nome/e-mail/senha;
- isolamento local por conta.

O digest implementado no navegador **não é um hash de senha adequado para produção** e não deve ser tratado como controle de segurança.

## Produção

Usar Auth real.

Requisitos:

- senha tratada exclusivamente pelo provedor;
- recuperação;
- verificação quando aplicável;
- revogação de sessão;
- rate limit;
- proteção contra enumeração;
- MFA para admin;
- logs de segurança.

## Autorização

Autenticação responde “quem é”.

Autorização responde “o que pode fazer”.

RLS deve garantir, mesmo se o frontend for manipulado:

- cliente só acessa seus dados;
- banca só altera seus recursos/pedidos;
- entregador só altera sua operação;
- admin usa políticas/funções próprias;
- documentos privados não são públicos.

## Operações server-side obrigatórias

- criar pedido;
- reservar/consumir estoque;
- validar preço;
- confirmar transições críticas;
- pagamento;
- reembolso;
- split;
- carteira;
- repasse;
- aprovação documental;
- mudanças administrativas.

## Chaves Supabase

É incorreto dizer genericamente “nenhuma credencial no frontend”.

A chave pública/publishable/anon destinada ao cliente pode ser usada conforme a arquitetura do Supabase.

Nunca expor:

- `service_role`;
- secrets de webhook;
- chave privada de PSP;
- credenciais administrativas;
- tokens de KYC/storage privilegiados.

A segurança não deve depender de esconder a chave pública; depende de RLS/Auth/policies.

## Documentos

Produção:

- bucket privado;
- URL assinada curta;
- validação MIME/magic bytes;
- limite de tamanho;
- antivírus quando aplicável;
- metadados mínimos;
- acesso auditado;
- retenção.

## Pagamentos

- CVV nunca armazenado;
- cartão tokenizado;
- webhook assinado;
- idempotency key;
- conciliação;
- nenhum valor vindo do browser é confiável.

## API/Edge Functions

- validação de payload;
- autenticação;
- autorização;
- idempotência;
- rate limit;
- correlation ID;
- logs sem dados sensíveis.

## RLS

Antes de produção, testar policies como usuário real para:

- SELECT;
- INSERT;
- UPDATE;
- DELETE;
- joins;
- storage.

Tabela com RLS ativada, mas sem policy suficiente, não é “pronta”.

## Segurança do protótipo

Não usar o protótipo atual para:

- documento real sensível;
- cartão real;
- senha reutilizada de serviços reais;
- dados médicos/financeiros;
- produção pública.

## Checklist de release

- [ ] Auth real;
- [ ] RLS testada;
- [ ] service role fora do cliente;
- [ ] storage privado;
- [ ] rate limit;
- [ ] webhook verificado;
- [ ] logs/auditoria;
- [ ] dependências auditadas;
- [ ] CSP/headers;
- [ ] revisão de permissões;
- [ ] testes de abuso.
