# Pagamentos, taxas e repasses — Feiraê

## Situação

Os meios de pagamento fazem parte do produto, mas a escolha e integração de provedor devem ocorrer depois da estabilização de pedidos, estoque e regras financeiras.

## Meios previstos

- Pix;
- cartão de crédito;
- cartão de débito, quando suportado pelo provedor/fluxo escolhido.

## Princípios

1. O frontend nunca define sozinho o valor final.
2. O backend recalcula itens, frete, descontos e taxas.
3. Criação/confirmação de pagamento precisa ser idempotente.
4. Webhooks precisam aceitar reprocessamento sem duplicar efeitos.
5. Pedido e pagamento possuem estados relacionados, mas são entidades diferentes.
6. Reembolso precisa gerar trilha de auditoria.

## Componentes do valor

O checkout pode conter:
- subtotal dos produtos;
- desconto;
- taxa de entrega;
- taxa administrativa/plataforma;
- total do cliente.

A divisão financeira pode conter:
- valor do feirante;
- comissão/taxa Feiraê;
- remuneração do entregador;
- ajustes e reembolsos.

## Taxa de entrega

A regra comercial ainda deve ser parametrizada.

O cálculo deve poder considerar:
- distância/rota;
- peso;
- tipo/capacidade de veículo;
- região;
- regras mínimas/máximas;
- eventual adicional operacional.

A fórmula final não deve ficar hard-coded na UI.

## Absorção da taxa pelo feirante

Quando habilitada:
- o cliente pode pagar menos ou zero pela entrega;
- o custo correspondente é descontado do valor a repassar ao feirante conforme a regra configurada;
- a remuneração do entregador não desaparece por causa da absorção;
- a plataforma deve exibir com clareza quem está arcando com a taxa.

## Multi-feirante

Uma compra pode envolver mais de um feirante. O cliente vê um checkout único, mas o sistema mantém subtotais e repasses por vendedor.

## Pendências de decisão comercial

Ainda precisam ser definidos:
- percentual/valor da taxa administrativa;
- regra mínima de entrega;
- fórmula final de distância e peso;
- comissão da plataforma;
- prazo de repasse;
- política de estorno/cancelamento;
- quem absorve custos do provedor;
- regras promocionais.

Esses valores devem ser configuráveis e não espalhados pelo código.
