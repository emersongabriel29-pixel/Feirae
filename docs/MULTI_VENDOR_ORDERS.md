# Pedidos multi-banca — regra oficial do Feiraê

Atualizado em 27/09/2026.

Este documento define o comportamento canônico de pedidos com produtos de mais de uma banca.

## Regra principal

Uma sacola pertence a **uma única feira**.

Dentro dessa feira, o cliente pode comprar de várias bancas no mesmo pedido.

No MVP, o limite é de **4 bancas por pedido** e o pedido mínimo é de **R$ 30,00 em produtos por banca**.

O cliente faz um único checkout e enxerga um único pedido Feiraê. Internamente, o pedido mantém uma participação separada para cada banca.

## Carrinho

O carrinho:

- bloqueia produto de outra feira enquanto houver itens na sacola atual;
- permite produtos de bancas diferentes da mesma feira;
- permite continuar adicionando itens de uma banca que já está na sacola;
- bloqueia a entrada de uma quinta banca no mesmo pedido;
- exige R$ 30,00 em produtos em cada banca antes de liberar o checkout;
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

O checkout mostra a situação do mínimo de cada banca e não confirma o pedido enquanto alguma estiver abaixo de R$ 30,00.

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

## Frete multi-banca

O cliente paga **um único frete**, nunca a soma dos fretes de todas as bancas.

Regra MVP:

```
frete = frete base + R$ 2,50 por banca adicional
```

O frete base continua vindo da referência logística disponível para a compra. O adicional remunera a complexidade de novas coletas dentro da mesma feira.

Exemplo com frete base de R$ 12,00:

- 1 banca: R$ 12,00;
- 2 bancas: R$ 14,50;
- 3 bancas: R$ 17,00;
- 4 bancas: R$ 19,50.

Antes da produção, o adicional precisa migrar para configuração administrativa/versionada e depois poderá usar distância real entre boxes quando houver coordenadas por banca.

## Cancelamento de uma banca

Se uma banca não puder atender:

- somente aquela participação vira `rejected`;
- seus itens são retirados da parte ativa do pedido;
- somente o estoque desses itens é liberado;
- as demais bancas continuam;
- o frete é recalculado pela nova quantidade de coletas;
- o peso e os `pickupStops` da corrida são atualizados;
- o cliente recebe um ajuste financeiro;
- valor externo pode voltar ao meio original ou, por escolha expressa, para a Carteira Feiraê;
- saldo Feiraê previamente usado e que deixou de ser necessário volta automaticamente para a carteira.

Se não restar nenhuma banca, o pedido global é cancelado.

Política detalhada: [REFUND_CANCELLATION_POLICY.md](REFUND_CANCELLATION_POLICY.md).

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

A recusa de uma banca não encerra mais automaticamente o pedido inteiro. O pedido continua com as demais bancas e só é cancelado globalmente quando nenhuma participação ativa restar.

O protótipo já atualiza o pedido, estoque, frete e rota localmente. O estorno externo continua dependente de PSP/ledger real. Substituição continua sendo tratada no fluxo de item quando aplicável.

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
