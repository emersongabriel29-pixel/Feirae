# Pagamentos, taxas e repasses

Este documento define a lógica de produto. Provedor, percentuais e valores finais ainda podem ser escolhidos posteriormente.

## Métodos previstos

Para o cliente:
- Pix;
- cartão de crédito;
- cartão de débito quando suportado pelo provedor escolhido.

O cadastro de cartão deve usar tokenização do provedor; dados sensíveis de cartão não devem ser armazenados diretamente pelo Feiraê.

## Componentes financeiros

Um pedido pode conter:
- subtotal de produtos;
- taxa de entrega;
- taxa administrativa;
- descontos;
- total do cliente;
- comissão da plataforma;
- repasse ao feirante;
- remuneração do entregador.

## Taxa de entrega

A taxa pode considerar:
- distância/rota;
- peso;
- capacidade/veículo;
- região;
- regra comercial temporária.

A fórmula exata deve ser configurável e centralizada.

Não espalhar números fixos em componentes de interface.

## Absorção da taxa pelo feirante

Regra prevista:
- o feirante pode optar por absorver total ou parcialmente a taxa de entrega quando essa modalidade estiver habilitada;
- a interface deve mostrar claramente quem está pagando;
- a contabilidade interna deve manter o valor real da entrega separado do desconto concedido ao cliente.

## Taxa administrativa

Pode incidir sobre:
- venda;
- entrega;
- ambos;

conforme modelo comercial definido.

Percentuais ainda não definidos devem permanecer em configuração, não hardcoded.

## Multi-feirante

Em um checkout com múltiplos vendedores:
- cliente vê um total consolidado;
- servidor calcula subtotal e repasse por feirante;
- comissão é registrada por subpedido;
- reembolso parcial deve ser possível sem invalidar itens dos demais vendedores.

## Confirmação de pagamento

Fluxo recomendado:

```text
checkout
→ servidor recalcula pedido
→ cria intenção/cobrança
→ cliente paga
→ provedor confirma
→ webhook idempotente
→ pedido muda para pago/confirmado
```

A tela de sucesso do frontend, sozinha, nunca confirma pagamento.

## Idempotência

Criação de cobrança, confirmação, estorno e webhook devem usar identificadores idempotentes para impedir cobrança ou processamento duplicado.

## Reembolso

Deve permitir:
- total;
- parcial por item/subpedido;
- cancelamento antes da coleta;
- regra específica após início da entrega.

Todas as alterações financeiras devem gerar histórico.

## Transparência

Antes de confirmar, o cliente deve visualizar:
- produtos;
- quantidade;
- subtotal;
- entrega;
- descontos;
- total final.

Feirante deve visualizar:
- valor bruto;
- taxas;
- descontos que assumiu;
- valor líquido previsto;
- status do repasse.

Entregador deve visualizar:
- valor da corrida;
- eventuais ajustes;
- status do recebimento.

## Itens ainda a decidir

- percentual da plataforma;
- taxa administrativa;
- fórmula final da entrega;
- prazo de repasse;
- política de cancelamento;
- política de estorno;
- provedor de pagamento.

Essas decisões comerciais não bloqueiam a documentação, arquitetura e UI demonstrativa.
