# Fluxo de pedido e entrega — Feiraê

## Regra principal

Feirante e entregador não devem controlar a mesma etapa.

- **Feirante** controla aceite e preparo.
- **Entregador** controla aceite da corrida, coleta, rota e entrega.
- **Cliente** acompanha e confirma/contesta quando necessário.
- **Backend** valida transições e registra eventos.

Não permitir voltar livremente de um estado avançado para um estado anterior.

## Fluxo completo

### 1. Pagamento aprovado

Estado do pedido:
`paid_waiting_vendor`

Ações:

- gerar pedido;
- registrar itens/preços/peso estimado;
- notificar o feirante imediatamente;
- mostrar contador/SLA configurável de resposta;
- cliente vê “Aguardando confirmação da banca”.

Notificações:

- push/in-app para feirante;
- badge de novo pedido;
- opcionalmente som/vibração no app quando suportado.

### 2. Feirante aceita ou recusa

#### Aceitar

Ação: **Aceitar pedido**

Novo estado:
`preparing`

Registrar:

- usuário;
- timestamp;
- previsão de preparo;
- observação opcional.

Cliente recebe:
“Banca confirmou seu pedido.”

#### Recusar

Exigir motivo:

- item indisponível;
- banca fechada;
- erro de estoque;
- impossibilidade operacional;
- outro.

O sistema:

- cancela ou recalcula apenas a parcela afetada;
- inicia estorno quando aplicável;
- notifica cliente;
- registra auditoria.

## 3. Preparo

O feirante deve ver cada item e conseguir:

- marcar separado/conferido;
- confirmar quantidade;
- informar peso final, quando variável;
- marcar indisponível;
- iniciar fluxo de substituição;
- adicionar observação;
- confirmar embalagem.

Quando todos os itens estiverem prontos:

Ação:
**Marcar pronto para coleta**

Estado:
`ready_for_pickup`

O feirante **não marca “saiu para entrega”**. Essa etapa pertence ao entregador.

## 4. Oferta da corrida

No MVP, a corrida entra na fila de entregadores quando o pedido está pronto para coleta.

Cada oferta deve informar antes do aceite:

- origem/feira/banca;
- região de destino aproximada;
- distância estimada;
- peso;
- volume;
- veículo/capacidade compatível;
- remuneração;
- quantidade de paradas;
- observações de carga.

Somente entregadores:

- aprovados;
- online;
- dentro da área;
- com veículo ativo;
- com capacidade suficiente

podem aceitar.

## 5. Entregador aceita

Estado da entrega:
`accepted`

Pedido pode exibir:
“Entregador a caminho da banca.”

Notificar:

- cliente;
- feirante.

Registrar:

- entregador;
- veículo;
- valor da corrida;
- timestamp.

## 6. Chegada e coleta

Ação do entregador:
**Cheguei à banca**

Depois:
**Confirmar coleta**

A coleta deve ser confirmada pelo fluxo definido, por exemplo:

- PIN;
- QR;
- confirmação cruzada feirante + entregador;
- outro mecanismo do backend.

Após coleta:

Estado:
`collected`

O pedido não pode ser cancelado pelo fluxo simples.

## 7. Em rota

Ação do entregador:
**Iniciar entrega**

Estado:
`out_for_delivery`

Cliente vê:

- “Seu pedido está a caminho”;
- previsão de chegada;
- mapa/rastreamento quando integração estiver disponível;
- suporte.

O feirante vê:
“Coletado pelo entregador.”

## 8. Entrega

Ação:
**Confirmar entrega**

Estado:
`delivered`

Evidência futura:

- PIN do cliente;
- foto autorizada quando aplicável;
- geolocalização;
- assinatura/QR;
- confirmação do cliente.

Após conclusão:

- liberar recebível do entregador conforme regra financeira;
- liberar recebível do feirante conforme regra financeira;
- permitir avaliações;
- encerrar rastreamento.

## Retirada pelo cliente

Fluxo separado:

`paid_waiting_vendor → preparing → ready_for_customer → picked_up`

Não criar corrida.

A retirada deve ter confirmação de entrega/retirada para liberar o financeiro.

## Notificações obrigatórias

### Feirante

- novo pedido;
- pagamento aprovado;
- pedido próximo do SLA de aceite;
- entregador atribuído;
- entregador chegou;
- coleta confirmada;
- cancelamento/ocorrência;
- repasse liberado.

### Entregador

- nova corrida compatível;
- corrida aceita;
- pedido pronto;
- alteração/cancelamento antes da coleta;
- pagamento/repasse liberado;
- ocorrência/suporte.

### Cliente

- pagamento aprovado;
- pedido aceito;
- preparo iniciado;
- pronto;
- entregador atribuído;
- coletado;
- em rota;
- entregue;
- cancelamento/estorno;
- pedido de avaliação.

## Máquina de estados resumida

```
created
  ↓
payment_pending
  ↓
paid_waiting_vendor
  ├─→ rejected → refund_pending → refunded
  ↓
preparing
  ├─→ issue/substitution
  ↓
ready_for_pickup
  ↓
delivery_offered
  ↓
driver_accepted
  ↓
collected
  ↓
out_for_delivery
  ↓
delivered
```

Retirada:

```
preparing
  ↓
ready_for_customer
  ↓
picked_up
```

## Regras de integridade

- nenhuma tela pode alterar status financeiro diretamente;
- transições precisam ser validadas server-side na fase real;
- cada mudança gera `order_event`;
- guardar ator, estado anterior, novo estado, data/hora e motivo;
- estados não podem ser pulados sem uma ação administrativa auditada;
- itens, valor e peso usados no pedido devem ser snapshot do momento da compra.
