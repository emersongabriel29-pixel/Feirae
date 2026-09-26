# Especificação do painel administrativo — Feiraê

Atualizado em 26/09/2026.

O painel administrativo não é uma quarta opção do login público. Deve possuir rota/acesso protegido e autorização administrativa.

## Objetivos

Permitir operação segura da plataforma sem editar banco manualmente.

## Módulos

### Feiras

- cadastrar/editar;
- ativar/desativar;
- endereço/GPS;
- agenda;
- fontes oficiais;
- exceções/feriados;
- feirantes vinculados;
- status de verificação.

### Feirantes

- perfil;
- banca;
- documentos;
- aprovação;
- suspensão;
- correção;
- histórico;
- recebimento;
- pedidos/avaliações.

### Entregadores

- perfil;
- documentos;
- veículos;
- aprovação;
- disponibilidade;
- suspensões;
- corridas;
- ocorrências;
- pagamentos.

### Clientes

- conta;
- pedidos;
- suporte;
- bloqueio/suspensão;
- histórico de ações administrativas.

### Pedidos

- busca por ID;
- timeline;
- bancas;
- pagamento;
- estoque;
- entrega;
- cancelamentos;
- substituições;
- suporte;
- avaliações;
- eventos.

Admin não deve editar status arbitrariamente. Ação excepcional exige motivo e evento auditável.

### Entregas

- fila;
- entregador;
- veículo;
- rota;
- incidentes;
- cancelamento operacional;
- comprovantes.

### Financeiro

Configurações administrativas:

- taxa da plataforma;
- regra de frete;
- subsídios;
- promoções da plataforma;
- limites;
- calendário de repasse.

Operação:

- pagamentos;
- estornos;
- repasses;
- falhas;
- conciliação;
- disputas.

Valores já liquidados não devem ser “editados”; ajustes geram novos lançamentos.

### Documentos

- fila de revisão;
- preview seguro;
- aprovar;
- solicitar correção;
- rejeitar;
- validade;
- histórico do revisor.

### Suporte

- tickets;
- prioridade;
- responsável;
- mensagens;
- status;
- SLA;
- vínculo com pedido/corrida.

### Auditoria

Toda ação administrativa crítica registra:

- admin;
- ação;
- entidade;
- estado anterior;
- estado novo;
- motivo;
- timestamp;
- IP/device quando permitido;
- correlation/request ID.

## Permissões

Separar funções administrativas quando necessário:

- suporte;
- operações;
- documentos/KYC;
- financeiro;
- administrador completo.

Princípio do menor privilégio.

## Feiras ativas

`is_active = false` deve impedir novas operações ligadas à feira sem apagar histórico.

## Suspensões

Devem suportar:

- início;
- término opcional;
- motivo;
- escopo;
- autor;
- evidência;
- condição de retorno.

Possíveis escopos:

- login;
- publicação;
- recebimento de pedidos;
- ficar online;
- aceitar corridas;
- saque/repasse.

## Configuração de taxas

Não hard-code em tela.

Toda regra deve possuir:

- versão;
- vigência;
- valor/fórmula;
- escopo/região;
- autor da alteração.

Pedidos guardam snapshot da regra aplicada.

## Segurança

- admin separado do cliente;
- MFA recomendado/obrigatório;
- logs;
- sessão curta para operações sensíveis;
- reautenticação para financeiro;
- RLS + funções server-side;
- sem service role no navegador.

## Fora do protótipo atual

Este painel ainda não está implementado. Este documento é requisito de produção/operação.
