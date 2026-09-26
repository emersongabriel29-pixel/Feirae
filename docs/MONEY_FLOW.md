# Fluxo financeiro — Feiraê

Atualizado em 26/09/2026 após comparação com frontend e schema.

## 1. O que existe hoje

Não existe movimentação financeira real.

O protótipo simula:

### Cliente

- pagamento autorizado;
- pagamento na entrega;
- reembolso;
- crédito em carteira;
- uso de carteira.

Código:

- `orderBridge.ts`;
- `walletBridge.ts`;
- `CustomerScreens.tsx`.

### Feirante

`VendorScreens.tsx` calcula localmente:

- bruto pendente;
- bruto elegível após entrega;
- valor disponível para solicitação;
- solicitado;
- pago.

Persistência:

- `feirae:vendor-settlements:<email>`.

### Entregador

`DeliveryScreens.tsx` mantém ledger local:

- `pending`;
- `available`;
- `withdrawal_requested`;
- `paid`.

Persistência:

- `feirae:delivery-ledger:<email>`.

Nada disso envia dinheiro.

## 2. Estrutura SQL que já existe

### `payments`

Campos:

- `order_id`;
- `provider`;
- `provider_payment_id`;
- `method`;
- `status`;
- `amount`;
- `commission`;
- `vendor_amount`;
- `delivery_amount`.

### `payouts`

Campos:

- `profile_id`;
- `role`;
- `amount`;
- `status`;
- `provider_reference`;
- `requested_at`;
- `paid_at`.

Status SQL:

```
pending
available
requested
paid
failed
```

### `wallet_entries`

Tipos:

- `refund_credit`;
- `purchase_debit`;
- `adjustment`.

## 3. Gap financeiro multi-banca

Um pedido pode ter N feirantes via `order_vendors`.

Mas `payments` possui apenas um:

```
vendor_amount
```

Isso não representa:

- feirante A;
- feirante B;
- feirante C;
- subsídio de cada um;
- comissão de cada parcela.

Portanto, `payments.vendor_amount` não é suficiente para produção multi-banca.

## 4. Ledger que falta

Criar estrutura por lançamento, por exemplo:

`ledger_entries`:

- id;
- order_id;
- order_vendor_id opcional;
- profile_id/recipient_id;
- role;
- entry_type;
- gross_amount;
- fee_amount;
- net_amount;
- currency;
- status;
- provider_reference;
- reverses_entry_id;
- created_at.

Tipos mínimos:

- `product_gross`;
- `platform_fee`;
- `payment_processor_fee`;
- `delivery_customer_charge`;
- `delivery_vendor_subsidy`;
- `delivery_platform_subsidy`;
- `delivery_earning`;
- `refund`;
- `adjustment`.

Ajuste nunca deve apagar lançamento anterior.

## 5. Estados divergentes

Frontend entregador:

```
withdrawal_requested
```

SQL payouts:

```
requested
```

Normalizar para um único valor.

Documento canônico: [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md).

## 6. Checkout atual

Pagamento “agora” é localmente marcado como autorizado.

Pagamento “na entrega” usa:

```
due_on_delivery
```

Ao concluir entrega, o fluxo local pode mudar o estado para autorizado.

Não há:

- PSP;
- QR Pix real;
- autorização de cartão;
- captura;
- webhook;
- chargeback.

## 7. Cartão

Tela atual armazena apenas:

- titular;
- últimos 4;
- validade;
- tipo;
- bandeira.

Número completo e CVV não são gravados no cartão salvo.

Produção deve receber token/ID do PSP, não PAN/CVV.

## 8. Frete

O valor de frete do checkout hoje vem de `vendorMetrics.deliveryFee`, usando o maior valor entre as bancas.

Não é calculado por:

- km;
- peso;
- tempo;
- veículo.

A rota calculada é usada para logística, não para precificação atual.

## 9. Frete grátis

Frontend suporta:

- promoção `freteGratis`;
- configuração `absorbDeliveryFee` da banca.

O cliente pode pagar R$ 0 de entrega enquanto o pedido mantém `calculatedDeliveryFee`.

No modelo real, o ledger deve registrar quem patrocinou o custo.

## 10. Taxa Feiraê

Hoje a tela do feirante mostra:

- “Taxa Feiraê — Não configurada”;
- “Taxa de processamento — Não configurada”.

Não há fórmula final no código nem tabela de taxa.

A regra deve vir do painel administrativo por versão/vigência.

## 11. Fluxo financeiro alvo por pedido

1. backend recalcula itens/preço;
2. reserva estoque;
3. cria pedido;
4. PSP cria cobrança;
5. webhook confirma;
6. ledger cria parcelas por banca;
7. cria parcela logística;
8. registra comissão/taxa PSP;
9. entrega/retirada conclui;
10. recebíveis passam para disponível conforme política;
11. payout é solicitado/agendado;
12. provider confirma pagamento;
13. conciliação compara provider x ledger.

## 12. Compra multi-banca

Exemplo estrutural:

Cliente paga R$ 160.

- Banca A produtos: R$ 70;
- Banca B produtos: R$ 60;
- entrega: R$ 20;
- taxa Feiraê: R$ 10.

O sistema precisa guardar lançamentos separados. Um único `vendor_amount = 130` perde o recebedor de cada parcela.

## 13. Cancelamento e estorno

Antes da coleta, o protótipo:

- cancela;
- libera estoque;
- cria reembolso local quando aplicável.

Produção precisa:

- chamar PSP;
- aguardar/registrar status do estorno;
- lançar reversões no ledger;
- lidar com estorno parcial por banca/item.

## 14. Repasse

O protótipo permite marcar:

- solicitado;
- recebido/pago.

Produção precisa de:

- recebedor no PSP;
- destino validado;
- policy de disponibilidade;
- payout idempotente;
- falha/retry;
- conciliação.

## 15. Estruturas que faltam no banco

- ledger por recebedor;
- regra versionada de taxa;
- snapshot da regra aplicada;
- parcela financeira por `order_vendor`;
- vínculo de subsídio;
- disputa/chargeback;
- conciliação.

## 16. Fonte regulatória

O modelo de pagamentos deve ser definido com o PSP e revisão jurídica/regulatória apropriada.

Referências mantidas:

- Banco Central — Instituições de Pagamento:
  https://www.bcb.gov.br/estabilidadefinanceira/instituicaopagamento
- Banco Central — FAQ sobre marketplace/subcredenciador:
  https://www.bcb.gov.br/estabilidadefinanceira/faq-liquidacao-centralizada
- Banco Central — Arranjos de Pagamento:
  https://www.bcb.gov.br/estabilidadefinanceira/arranjospagamento/

O fato de existir marketplace não significa, sozinho, que todo modelo seja necessariamente subcredenciador; depende de como o fluxo de pagamento é estruturado.
