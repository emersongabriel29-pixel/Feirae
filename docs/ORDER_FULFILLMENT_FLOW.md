# Fluxo de pedido e entrega — Feiraê

Atualizado em 26/09/2026.

## 1. Pedido global no frontend

Fonte: `orderBridge.ts`.

```
received
→ preparing
→ ready_for_pickup
→ driver_assigned
→ collected
→ out_for_delivery
→ delivered
```

Cancelamento:

```
cancelled
```

## 2. Divergência SQL

`public.order_status` ainda contém estados de pagamento e grafia `canceled`.

`order_vendors.status` reutiliza esse enum, mas o frontend usa estados próprios de banca que não cabem nele.

Antes da integração real, corrigir schema conforme:
[SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

## 3. Criação

Antes de `App.tsx::confirmOrder()`, o checkout aplica estas regras:

- entrega exige endereço antes de confirmar;
- sem endereço, frete fica como **A calcular** e não entra no total;
- retirada não exige endereço de entrega e usa frete zero.

`App.tsx::confirmOrder()`:

1. gera ID;
2. reserva estoque via `reserveInventory`;
3. cria pedido local;
4. cria `UnifiedOrder`;
5. registra evento de pagamento;
6. registra evento `received`;
7. aplica carteira/promoções.

Se estoque não pode ser reservado, pedido não é criado.

## 4. Estado por banca

O pedido unificado mantém cada banca separadamente.

Estados internos atuais:

```
pending
accepted
preparing
ready
collected
delivered
rejected
```

A tela do feirante também traduz esses conceitos em `VendorOrderStatus`.

## 5. Preparo

Durante preparo, banca pode:

- marcar item separado;
- marcar indisponível;
- escrever observação/substituição;
- informar peso real.

O peso real é propagado para os itens do pedido compartilhado.

## 6. Multi-banca

Regras implementadas/testadas:

- pedido não vira `ready_for_pickup` até todas as bancas necessárias estarem prontas;
- em **retirada multi-banca**, a confirmação de uma banca marca somente aquela participação como `delivered`;
- o pedido global permanece `ready_for_pickup` enquanto existir banca pronta ainda não retirada;
- o pedido global só vira `delivered` quando todas as bancas da retirada estiverem `delivered`;
- a reserva de estoque só é consumida no encerramento global da retirada.

Limitação:

- a rota do entregador ainda não possui uma sequência real de stops por banca.

Hoje a oferta pode exibir:

```
Banca A + Banca B
```

mas rota logística continua resumida como feira/banca → cliente.

## 7. Pronto para coleta

`ready_for_pickup`:

### Delivery

pedido pode aparecer na lista do entregador se:

- possuir rota;
- estiver disponível;
- filtros permitirem.

### Pickup

Cliente espera retirada. Em pedido de uma única banca, a confirmação dessa banca conclui o pedido. Em pedido multi-banca, cada banca confirma sua própria entrega e o pedido global só termina após a última confirmação.

## 8. Oferta ao entregador

`DeliveryScreens.tsx` só considera pedidos de entrega com status:

- `ready_for_pickup`;
- `driver_assigned`;
- `collected`;
- `out_for_delivery`;

e com `order.route`.

Fixtures `FE-1024…FE-1027` são exclusivas de contas de demonstração (`@feirae.test`). Contas reais/novas recebem somente pedidos derivados do pedido compartilhado.

Oferta inclui:

- ID;
- feira;
- bancas;
- região;
- peso;
- itens;
- distância até banca;
- banca→cliente;
- total;
- ETA;
- ganho;
- pagamento.

## 9. Filtro da corrida

A lista disponível filtra:

```
delivery.available !== false
AND totalDistanceKm <= radiusKm
AND região permitida
```

Para aceitar:

```
online
AND agenda permite
AND approvalStatus = Aprovado
AND nenhuma corrida ativa
AND veículo compatível
```

## 10. Veículo compatível

```
vehicle.active
AND capacityKg >= orderWeight
AND vehicleReady
```

Para tipo que exige placa:

- documento do veículo `approved`;
- placa válida.

## 11. Aceite

Ao aceitar:

- salva entrega ativa local;
- etapa = 0;
- pedido → `driver_assigned`;
- salva motorista;
- veículo;
- placa mascarada;
- ETA;
- distância;
- evento `driver-assigned`.

## 12. Etapas do entregador

UI atual:

1. Ir para a banca
2. Confirmar coleta
3. Iniciar entrega
4. Confirmar entrega

Estados compartilhados:

- coleta → `collected`;
- iniciar → `out_for_delivery`;
- concluir → `delivered`.

## 13. Cancelamento do entregador

Antes de concluir:

- motivo;
- detalhes;
- log local;
- pedido volta para `ready_for_pickup`;
- motorista é removido;
- evento `driver-cancelled`.

Produção precisa impedir corrida dupla por transação/lock.

## 14. Cancelamento do cliente

Antes da coleta:

- registra motivo/detalhes;
- libera estoque;
- trata reembolso local quando aplicável.

Após coleta:

- não usa cancelamento simples;
- abre suporte.

Se um pedido atribuído for cancelado, concluído ou reatribuído por outro ator, o estado derivado deixa de considerar o lock local obsoleto, liberando novas ofertas; ao aceitar outra corrida, ID e etapa são sobrescritos.

## 15. Estoque

- reserva na criação;
- libera no cancelamento elegível;
- consome na conclusão.

Implementação é local, não banco.

## 16. Pagamento na entrega

O método acompanha a corrida.

Dinheiro pode carregar `changeFor`.

Ao concluir entrega, o protótipo pode considerar o pagamento autorizado, mas não existe conciliação real.

## 17. Eventos

`orderBridge` registra eventos do fluxo local.

A tabela SQL `order_events` não possui `previous_state/next_state`.

Se produção precisar de auditoria completa de transição, criar esses campos ou registrar payload estruturado equivalente.

## 18. Critério para backend real

Não permitir UPDATE livre de `orders.status`.

Criar ações server-side idempotentes para:

- banca aceitar;
- banca preparar;
- banca pronta;
- atribuir motorista;
- coleta;
- iniciar entrega;
- concluir;
- cancelar.

Cada função valida estado anterior + ator + pré-condições.

## 19. Apresentação pós-entrega

Quando o pedido está `delivered`, a tela do cliente:

- não mostra `0 min` como se fosse duração real;
- identifica a distância como rota registrada;
- mostra o horário do evento `delivered`, quando disponível;
- apresenta “Ajuda pós-entrega” em vez de um indicador operacional de suporte/ETA.
