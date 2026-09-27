# Pedidos multi-banca — regra oficial do Feiraê

Atualizado em 27/09/2026.

Este documento define o comportamento canônico de pedidos com produtos de mais de uma banca.

## Regra principal

Uma sacola pertence a **uma única feira**.

Dentro dessa feira, o cliente pode comprar de várias bancas no mesmo pedido.

No MVP, o limite é de **4 bancas por pedido**.

O cliente faz um único checkout e enxerga um único pedido Feiraê. Internamente, o pedido mantém uma participação separada para cada banca.

## Carrinho

O carrinho:

- bloqueia produto de outra feira enquanto houver itens na sacola atual;
- permite produtos de bancas diferentes da mesma feira;
- permite continuar adicionando itens de uma banca que já está na sacola;
- bloqueia a entrada de uma quinta banca no mesmo pedido;
- mantém o peso total como soma dos itens de todas as bancas.

`restoreDemoBasket()` também respeita uma feira por sacola e o limite de 4 bancas.

## Checkout

O resumo informa:

- feira;
- quantidade de bancas;
- limite do MVP;
- subtotal;
- peso total;
- frete e demais ajustes já existentes.

Pagamento continua sendo apresentado como uma única compra para o cliente.

## Preparação

Cada banca controla apenas a própria participação.

O pedido global:

- permanece em preparação enquanto existir banca necessária ainda não pronta;
- só fica `ready_for_pickup` quando todas as bancas necessárias estiverem prontas.

## Retirada pelo cliente

Cada banca confirma sua própria entrega no balcão.

Uma confirmação não encerra todo o pedido multi-banca.

O pedido global só vira `delivered` depois que todas as bancas confirmarem a retirada.

## Entrega

Quando todas as bancas estão prontas, uma única corrida é liberada.

O peso usado para compatibilidade de veículo é a soma do peso dos itens do pedido.

A corrida recebe uma lista ordenada de `pickupStops`.

O entregador executa:

```
banca 1
→ confirmar coleta
→ banca 2
→ confirmar coleta
→ ...
→ última banca
→ confirmar coleta
→ iniciar entrega
→ avisar chegada
→ confirmar entrega
```

Cada confirmação atualiza somente a banca correspondente para `collected`.

O pedido global permanece em `driver_assigned` durante as coletas e só muda para `collected` após a última banca.

## Visibilidade do cliente

No acompanhamento, pedidos com mais de uma banca mostram:

- número de bancas;
- quantidade de bancas prontas;
- quantidade de coletas confirmadas;
- estado individual de cada banca.

## Geometria da rota

A sequência de coleta por banca agora existe no pedido e na interface do entregador.

Porém o marketplace atual ainda não persiste coordenadas individuais de cada banca/box. Por isso:

- OSRM calcula atualmente entregador → feira → cliente;
- as paradas internas da feira são paradas operacionais ordenadas;
- o sistema ainda não calcula distância real entre banca A → banca B → banca C.

Para otimização real de rota intra-feira, cada banca precisará ter coordenada/posição do box e o roteador deverá receber todos os waypoints.

## Financeiro

O checkout é único, mas produção precisará de ledger separado por recebedor:

- parcela da banca A;
- parcela da banca B;
- demais bancas;
- entrega;
- taxa Feiraê;
- subsídios;
- ajustes e estornos.

O protótipo ainda não possui PSP/ledger real.

## Recusa de uma banca

O comportamento atual continua conservador: a recusa de uma banca encerra o pedido global e gera o estorno local aplicável.

A evolução planejada é oferecer ao cliente decisão entre:

- continuar sem a banca recusada;
- aceitar substituição quando aplicável;
- cancelar tudo.

Essa evolução exige estorno parcial, reserva de estoque parcial e recálculo financeiro por banca e não deve ser simulada como pronta antes do ledger/backend real.

## Arquivos principais

- `src/hooks/useDemoCart.ts`
- `src/domain/multiVendor.ts`
- `src/domain/orderBridge.ts`
- `src/features/customer/CustomerScreens.tsx`
- `src/features/vendor/VendorScreens.tsx`
- `src/features/delivery/DeliveryScreens.tsx`

## Testes

Cobertura direta:

- mesma feira com várias bancas;
- bloqueio de feira diferente;
- limite de quatro bancas;
- permitir novos itens de banca já presente;
- liberação somente quando todas as bancas estão prontas;
- retirada multi-banca;
- coleta logística banca por banca;
- persistência dos `pickupStops`;
- sequência multi-stop na interface do entregador.
