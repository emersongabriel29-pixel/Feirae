# Feiraê — roadmap

Atualizado em 26/09/2026.

## Estado atual

A etapa de **protótipo funcional** está avançada. Os fluxos internos de cliente, feirante e entregador já foram conectados e cobertos por testes.

Concluído no protótipo local:

- autenticação local com senha para teste de experiência;
- conta com alteração de nome/e-mail/senha;
- catálogo compartilhado;
- carrinho e checkout;
- pedido unificado;
- multi-banca;
- preparo, peso real, retirada e entrega;
- estoque reservado/liberado/consumido;
- promoções e cupons;
- cancelamento, suporte, reembolso e carteira;
- avaliações;
- disponibilidade e veículos do entregador;
- repasses simulados;
- auditoria de botões/campos;
- migrations `0001` e `0002` do Supabase.

## Próxima fase real: backend operacional

A próxima fase **não é criar o schema do zero**. O schema base já existe no repositório. A fase agora é conectar e endurecer o backend.

### 1. Supabase por ambiente

- criar/configurar projetos de desenvolvimento e staging;
- aplicar e validar migrations;
- definir estratégia de produção;
- configurar PostGIS;
- definir backups e recuperação;
- impedir uso de dados de produção em desenvolvimento.

### 2. Auth e autorização

- substituir `localAuth.ts` por Supabase Auth;
- papéis reais e RLS;
- recuperação/troca de senha;
- verificação de e-mail/telefone quando necessária;
- sessão e revogação;
- auditoria de mudanças de papel.

### 3. Repositórios e adapters

Substituir bridges de `localStorage` por adapters/repositories sem mudar a UX:

- marketplace;
- pedidos/eventos;
- estoque;
- carteira/ledger;
- documentos;
- veículos;
- avaliações;
- suporte.

### 4. Catálogo e estoque server-side

- preço e estoque como fonte de verdade no servidor;
- reserva transacional;
- idempotência;
- fotos em Storage;
- soft delete/arquivamento;
- histórico/snapshots para pedidos antigos.

### 5. Pedido e máquina de estados

Implementar no servidor a máquina oficial de [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md).

- transições validadas;
- estado por banca;
- eventos imutáveis;
- suporte a multi-banca;
- cancelamento/ocorrências;
- retirada e entrega.

### 6. Documentos e aprovação

- Storage privado;
- upload seguro;
- magic bytes/MIME/tamanho;
- revisão administrativa;
- validade/revalidação;
- KYC quando escolhido;
- suspensão por documento crítico.

### 7. Rotas e rastreamento

- substituir serviços públicos de protótipo por provedor com SLA;
- cálculo server-side do frete;
- política de raio/região;
- rastreamento em tempo real;
- privacidade da localização.

### 8. Pagamentos e financeiro

Somente depois de pedido/estoque server-side estáveis:

- Pix/cartão;
- tokenização;
- webhooks idempotentes;
- split;
- ledger;
- estorno;
- carteira com lastro;
- repasses/saques;
- conciliação.

### 9. Notificações

- in-app persistente;
- push;
- WhatsApp somente com consentimento e base legal;
- preferências por canal;
- deduplicação/idempotência.

### 10. Admin e operação

Implementar [ADMIN_MANAGEMENT_SPEC.md](ADMIN_MANAGEMENT_SPEC.md):

- feiras;
- usuários;
- documentos;
- suspensões;
- taxas;
- pedidos;
- entregas;
- financeiro;
- suporte;
- auditoria.

## Antes de produção

Obrigatório:

- ambiente staging;
- testes E2E reais;
- observabilidade;
- Error Boundary;
- rate limits;
- logs/auditoria;
- política LGPD;
- termos;
- backup/restore testado;
- rollback;
- revisão de segurança/RLS;
- testes de pagamento e webhook;
- testes de acessibilidade.

## Pós-MVP

- fidelidade;
- recomendações;
- produtos patrocinados;
- retirada agendada;
- recorrência;
- analytics avançado;
- gestão completa de feira;
- otimização de múltiplas paradas;
- campanhas segmentadas.
