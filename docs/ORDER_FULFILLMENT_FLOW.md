# Fluxo de pedido e entrega — Feiraê

Atualizado em 26/09/2026.

Este documento usa os **nomes oficiais do pedido unificado do protótipo**. O mapeamento para SQL/backend está em [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md).

## Regra principal

Cada ator controla somente sua etapa:

- Cliente: compra, cancelamento permitido, decisões de substituição, suporte e avaliação.
- Feirante: aceitar/recusar, separar, informar peso real e marcar pronto.
- Entregador: aceitar corrida, coleta, rota e entrega.
- Backend futuro: validar transições, estoque, pagamento e eventos.

## Estado global oficial do pedido

```
received
→ preparing
→ ready_for_pickup
→ driver_assigned
→ collected
→ out_for_delivery
→ delivered
```

Saída alternativa antes da conclusão:

```
cancelled
```

Não usar neste domínio `paid_waiting_vendor`, `delivery_offered`, `driver_accepted`, `ready_for_customer` ou `picked_up` como estados globais oficiais. Conceitos de pagamento, oferta da corrida e retirada são representados por campos/eventos/máquinas próprias.

## 1. Pedido recebido — `received`

Pré-condições do protótipo:

- checkout válido;
- estoque reservado;
- pagamento `authorized` ou `due_on_delivery`;
- uma ou mais bancas vinculadas.

Por banca, estado inicial:

`pending`.

Cliente vê: **Pedido recebido**.

## 2. Banca aceita/prepara — `preparing`

Estados possíveis da banca:

```
pending
→ accepted
→ preparing
→ ready
```

A primeira banca que começa não libera logística se houver outras bancas pendentes.

Se uma banca rejeitar, o fluxo local atual leva o pedido a `cancelled`. Backend futuro pode evoluir para cancelamento parcial por `order_vendor`.

Durante preparo:

- marcar item separado;
- informar peso real;
- item indisponível;
- propor substituição;
- observações.

O peso real substitui o peso estimado para compatibilidade logística.

## 3. Todas as bancas prontas — `ready_for_pickup`

O pedido global só chega aqui quando todas as bancas necessárias estão `ready`.

### Entrega

Fica elegível para entregadores compatíveis.

### Retirada

Fica pronto para o cliente buscar, sem gerar corrida.

## 4. Entregador atribuído — `driver_assigned`

A corrida foi aceita.

Registrar:

- entregador;
- veículo;
- placa mascarada quando aplicável;
- distância/ETA quando disponíveis;
- valor da corrida;
- timestamp/evento.

O pedido não volta à fila pública enquanto estiver atribuído.

## 5. Coleta — `collected`

O entregador confirma coleta.

A partir daqui:

- cliente não usa cancelamento simples;
- problemas viram ocorrência/suporte;
- estoque reservado já não deve ser devolvido por cancelamento comum.

Confirmação forte de coleta (PIN/QR/dupla confirmação) é futura integração de backend.

## 6. Em rota — `out_for_delivery`

Cliente vê:

- entregador;
- veículo;
- previsão;
- distância;
- mapa quando provedor permitir;
- suporte.

## 7. Entregue — `delivered`

Ao confirmar entrega:

- encerrar corrida;
- pagamento na entrega passa para autorizado no protótipo;
- estoque é consumido definitivamente;
- avaliações são liberadas;
- recebíveis locais podem ficar disponíveis.

## Retirada

Retirada utiliza o mesmo estado global até `ready_for_pickup` e depois termina em `delivered` quando a banca confirma a retirada.

```
received
→ preparing
→ ready_for_pickup
→ delivered
```

`fulfillment = pickup` diferencia o fluxo da entrega.

## Cancelamento — `cancelled`

Antes da coleta:

- registrar ator, motivo, detalhes e data/hora;
- liberar estoque reservado;
- se pagamento local estava autorizado, registrar `refunded` e crédito/reembolso;
- notificar participantes.

Depois da coleta:

- abrir suporte/ocorrência;
- não transformar automaticamente em cancelamento simples.

## Substituição

Quando um item fica indisponível:

1. banca marca indisponível e informa proposta;
2. evento é registrado;
3. cliente aceita ou recusa;
4. aceite atualiza item/evento;
5. recusa pode levar a cancelamento/suporte conforme fase.

## Multi-banca

Cada `vendor` possui estado próprio.

O estado global é derivado:

- qualquer banca em preparo → `preparing`;
- todas prontas → `ready_for_pickup`;
- após logística avançar, status global não regride por alteração tardia de banca.

## Pagamento

Pagamento é máquina separada:

- `authorized`;
- `due_on_delivery`;
- `failed`;
- `refunded`.

Não misturar esses valores com o status global do pedido.

## Eventos

Toda transição relevante deve gerar evento com:

- chave;
- rótulo;
- data/hora;
- ator;
- motivo/detalhes quando aplicável.

Produção deve guardar eventos server-side e preferencialmente imutáveis.

## Notificações

### Cliente

Pagamento, aceite/preparo, pronto, entregador atribuído, coletado, rota, entregue, cancelamento/reembolso, substituição e avaliação.

### Feirante

Novo pedido, pagamento, mudanças do cliente, entregador atribuído/coleta, ocorrência e repasse.

### Entregador

Nova corrida compatível, aceite, mudança/cancelamento pré-coleta, suporte e financeiro.

## Regras de integridade

- status não deve voltar livremente;
- nenhuma tela controla etapa de outro papel;
- estoque/preço/peso do pedido usam snapshot;
- multi-banca não libera logística cedo;
- um pedido já atribuído não volta à fila;
- dinheiro e estoque serão mutações server-side na produção;
- transições críticas devem ser idempotentes.
