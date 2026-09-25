# Fluxo financeiro — Feiraê

## Decisão de arquitetura

O Feiraê não deve receber dinheiro do cliente em uma conta própria para depois repassar manualmente a feirantes e entregadores.

O modelo alvo é usar um provedor de pagamentos/Instituição de Pagamento que suporte marketplace, recebedores e divisão de valores. O Banco Central trata marketplaces que recebem e repassam pagamentos como um modelo que pode atuar como subcredenciador, e instituições de pagamento são as entidades próprias para executar/gerir serviços de pagamento.

No código do Feiraê, o dinheiro deve ser representado por um **livro-razão interno (ledger)** e por IDs/tokens do provedor, não por um “saldo fictício” sem lastro.

## Cadastro para recebimento

### Feirante

Antes de vender, o feirante aprovado deve cadastrar um destino de recebimento:

- chave Pix; ou
- conta bancária aceita pelo provedor;
- titular;
- CPF/CNPJ do titular;
- vínculo com o recebedor aprovado no provedor.

O titular do recebimento deve ser compatível com a pessoa física/jurídica aprovada ou com uma regra de representante validada.

### Entregador

Antes de aceitar corridas pagas, o entregador aprovado deve cadastrar:

- chave Pix; ou
- conta bancária aceita pelo provedor;
- titular;
- CPF do titular;
- recebedor/token criado no provedor.

O Feiraê deve armazenar apenas os dados necessários à experiência e os identificadores retornados pelo provedor. Dados bancários sensíveis devem permanecer no ambiente do provedor sempre que possível.

## Estados do saldo

Cada recebedor possui três conceitos distintos:

1. **Pendente** — valor já associado a um pedido, mas ainda não liberado.
2. **Disponível** — valor liberado após a conclusão/regras do pedido.
3. **Pago/Sacado** — valor já enviado ao destino de recebimento.

Nunca mostrar “saldo disponível” antes do evento de liberação.

## Fluxo de uma compra

1. Cliente confirma o checkout.
2. Provedor confirma o pagamento.
3. Feiraê cria o ledger do pedido.
4. Valor do feirante fica como **pendente**.
5. Taxa de entrega fica reservada para a operação logística.
6. Pedido segue para aceite/preparo.
7. Entrega/retirada é concluída.
8. Regras de contestação/reembolso são verificadas.
9. Parcela do feirante muda para **disponível**.
10. Parcela do entregador muda para **disponível** quando a entrega é concluída.
11. O provedor executa repasse automático ou saque solicitado, conforme configuração futura.

## Composição financeira

Um pedido deve registrar de forma separada:

- subtotal dos produtos;
- desconto do produto;
- desconto/cupom patrocinado pelo Feiraê;
- desconto/cupom patrocinado pelo feirante;
- taxa de entrega cobrada do cliente;
- subsídio de entrega pago pelo feirante;
- taxa administrativa/plataforma;
- taxa do provedor de pagamento;
- valor líquido do feirante;
- remuneração do entregador;
- reembolso/estorno;
- ajustes.

## Frete grátis patrocinado pelo feirante

“Frete grátis” não significa que o entregador trabalha de graça.

Fluxo:

1. Cliente vê frete R$ 0,00.
2. O sistema calcula normalmente a remuneração da entrega.
3. O valor do frete é debitado da parcela econômica do feirante.
4. O entregador recebe a remuneração prevista normalmente.
5. O Feiraê registra `delivery_sponsor = vendor`.

Exemplo conceitual:

- produtos: R$ 100;
- entrega: R$ 12;
- cliente paga: R$ 100;
- feirante patrocina os R$ 12;
- entregador continua tendo R$ 12 destinados à entrega;
- o líquido do feirante é reduzido pelo subsídio, além das demais taxas aplicáveis.

O feirante **não transfere dinheiro diretamente ao entregador**. O split/ledger do pedido resolve isso.

## Frete grátis patrocinado pelo Feiraê

O mesmo princípio vale para campanhas da plataforma:

- cliente paga R$ 0 de entrega;
- entregador recebe integralmente a remuneração calculada;
- o subsídio é registrado como custo promocional da plataforma.

## Compra com vários feirantes

Um checkout pode gerar:

- 1 pagamento do cliente;
- N parcelas de vendedores;
- 1 ou mais parcelas logísticas;
- parcela da plataforma;
- taxa do provedor.

Cada item deve manter o vendedor de origem. Cancelar um item/vendedor não deve obrigatoriamente estornar as outras parcelas.

## Retirada na banca

Sem entregador:

- não existe remuneração logística;
- valor do feirante fica pendente até a retirada ser confirmada;
- confirmação pode usar código/PIN/QR ou ação dupla cliente + feirante na fase real.

## Cancelamentos e estornos

### Antes do aceite do feirante

- cancelar pedido;
- estornar integralmente a parcela correspondente;
- não gerar ganho de entrega.

### Durante preparo

- aplicar política configurável;
- registrar motivo e ator;
- recalcular itens e taxas antes de qualquer estorno parcial.

### Após coleta

- não permitir cancelamento simples pelo frontend;
- abrir ocorrência/suporte;
- preservar rastreabilidade do valor do feirante e do entregador.

### Entrega cancelada por problema operacional

- separar responsabilidade de cliente, feirante, entregador e plataforma;
- não retirar automaticamente remuneração já devida sem regra e auditoria.

## Saque e repasse

A interface de Feirante e Entregador deve mostrar:

- saldo pendente;
- saldo disponível;
- próximo repasse;
- histórico;
- detalhes por pedido/corrida;
- botão “Sacar” somente se o provedor suportar saque sob demanda;
- conta/Pix cadastrado;
- status do recebedor no provedor.

A periodicidade final (instantâneo, diário, semanal etc.) é decisão comercial e do provedor e **não deve ser hard-coded antes da integração**.

## Estados sugeridos

### Recebível

- pending;
- available;
- withdrawal_requested;
- paid;
- refunded;
- partially_refunded;
- blocked;
- disputed.

### Repasse

- scheduled;
- processing;
- completed;
- failed;
- reversed.

## Segurança

- nunca confiar em valores calculados apenas no frontend;
- split e valores devem ser criados/recalculados no backend;
- usar idempotência em cobrança, estorno e repasse;
- webhooks devem ser reprocessáveis;
- manter ledger imutável com ajustes por novos lançamentos, não apagando histórico;
- nunca armazenar número completo de cartão/CVV;
- conciliar ledger do Feiraê com o provedor.

## Fontes regulatórias de referência

- Banco Central — Instituições de Pagamento:
  https://www.bcb.gov.br/estabilidadefinanceira/instituicaopagamento
- Banco Central — FAQ sobre marketplace/subcredenciador:
  https://www.bcb.gov.br/estabilidadefinanceira/faq-liquidacao-centralizada
- Banco Central — Arranjos de Pagamento:
  https://www.bcb.gov.br/estabilidadefinanceira/arranjospagamento/https%3A/www3.bcb.gov.br/sgspub
