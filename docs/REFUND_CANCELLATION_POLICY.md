# Política de cancelamentos, ajustes e reembolsos — Feiraê

Atualizado em 27/09/2026.

> Documento funcional e de produto. A versão de produção deve passar por revisão jurídica antes da publicação ao consumidor e ser compatibilizada com o PSP contratado.

## 1. Princípios

O Feiraê deve tratar cancelamento e reembolso com:

- informação clara antes e depois da compra;
- rastreabilidade por pedido e por banca;
- restituição do valor efetivamente cobrado quando uma parte da oferta deixa de ser cumprida;
- nenhuma conversão compulsória de dinheiro em crédito interno;
- recomposição automática de itens, frete, estoque, rota e valores quando uma banca sai do pedido;
- confirmação visível ao consumidor de toda solicitação de cancelamento ou reembolso.

## 2. Base legal usada no desenho

O Código de Defesa do Consumidor, especialmente:

- art. 35: diante do não cumprimento da oferta, o consumidor pode, conforme o caso, exigir cumprimento, aceitar equivalente ou rescindir com restituição do valor antecipado;
- art. 49: nas contratações fora do estabelecimento comercial, existe direito de arrependimento em 7 dias, com devolução dos valores pagos.

O Decreto nº 7.962/2013, que regulamenta o comércio eletrônico, exige informação clara das condições da oferta e das despesas adicionais, canal eletrônico eficaz de cancelamento e, no exercício do direito de arrependimento, comunicação à instituição financeira/administradora para impedir lançamento ou efetuar estorno.

Referências oficiais:

- https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- https://www.gov.br/mj/pt-br/assuntos/noticias-1/dia-dos-pais-conheca-os-direitos-do-consumidor-na-compra-de-presentes

## 3. Cancelamento por uma banca em pedido multi-banca

Se o pedido tiver várias bancas e apenas uma não puder atender:

1. somente a participação da banca é marcada como cancelada/rejeitada;
2. os itens dessa banca deixam de compor a parte ativa do pedido;
3. a reserva de estoque desses itens é liberada sem devolver ao estoque itens das outras bancas;
4. as demais bancas continuam preparando normalmente;
5. o total do pedido é recalculado;
6. o frete é recalculado com a nova quantidade de coletas;
7. a rota do entregador remove a banca cancelada;
8. o peso usado para compatibilidade do veículo passa a considerar apenas os itens ativos;
9. o cliente recebe notificação e visualiza o motivo e o ajuste financeiro;
10. se nenhuma banca restar ativa, o pedido inteiro é encerrado.

## 4. Valor do ajuste

O ajuste referente à banca cancelada considera:

- valor dos produtos daquela banca;
- menos descontos promocionais previamente atribuídos àquela participação;
- mais eventual redução do frete pago pelo cliente causada pela remoção da coleta adicional;
- restauração de eventual saldo da Carteira Feiraê que tenha sido consumido e deixe de ser necessário.

O backend/ledger de produção deve calcular tudo em centavos e manter snapshot das regras aplicadas.

## 5. Destino do reembolso

### Valor pago externamente

O meio de pagamento original é a rota padrão de restituição em produção.

O cliente poderá escolher **Carteira Feiraê** como alternativa somente mediante ação expressa e informada. O Feiraê não deve obrigar o consumidor a aceitar crédito interno em substituição ao estorno.

No protótipo atual, como ainda não existe PSP real:

- `pending_choice`: ajuste criado e aguardando escolha na interface;
- `requested`: solicitação de estorno no meio original registrada localmente; não significa que o PSP concluiu o crédito;
- `credited`: valor destinado à Carteira Feiraê no protótipo.

Em produção, se o cliente não escolher crédito interno, o sistema deverá seguir automaticamente para o meio original conforme a política operacional do PSP, sem deixar o valor indefinidamente aguardando ação do cliente.

### Saldo Feiraê usado na compra

A parcela originalmente paga com saldo Feiraê volta automaticamente para a própria carteira, pois é restauração do saldo já existente, não conversão de dinheiro novo em crédito.

## 6. Pagamento na entrega

Se o valor ainda não tiver sido cobrado:

- não há estorno externo;
- o total devido na entrega simplesmente é reduzido;
- eventual saldo Feiraê já consumido e que deixou de ser necessário é restaurado.

## 7. Frete em cancelamento parcial

O frete multi-banca do MVP é:

`frete base + R$ 2,50 × quantidade de bancas adicionais`

Exemplo:

- 1 banca: frete base;
- 2 bancas: frete base + R$ 2,50;
- 3 bancas: frete base + R$ 5,00;
- 4 bancas: frete base + R$ 7,50.

Se uma das três bancas cancelar antes da coleta, o pedido passa de três para duas coletas e o adicional cai de R$ 5,00 para R$ 2,50. A diferença efetivamente paga pelo cliente entra no ajuste.

O valor de R$ 2,50 é uma regra MVP configurável e deverá migrar para configuração administrativa/versionada antes da produção.

## 8. Cancelamento total pelo cliente

Quando permitido pelo estado do pedido e pelas regras legais/operacionais:

- o pedido é encerrado;
- estoque ainda reservado é liberado;
- saldo Feiraê usado é restaurado;
- valor pago externamente gera processo de estorno;
- a interface deve registrar motivo, data/hora e destino do reembolso.

Pedidos já coletados/entregues não devem reutilizar o mesmo fluxo simples de cancelamento; devem abrir suporte, devolução, arrependimento ou reclamação conforme o caso.

## 9. Direito de arrependimento e alimentos/perecíveis

O produto é contratado eletronicamente e a política de produção deve preservar os direitos obrigatórios do consumidor, inclusive o art. 49 do CDC quando aplicável.

Como o Feiraê comercializa alimentos frescos, perecíveis e itens preparados, a redação final dos termos e os procedimentos de devolução física precisam de revisão jurídica específica por categoria, condição do produto, segurança alimentar e momento do consumo. Essa revisão não pode reduzir direitos obrigatórios previstos em lei.

## 10. Prazos e comunicação

O Feiraê deve:

- acusar o recebimento da solicitação imediatamente na interface;
- iniciar o procedimento de estorno sem demora indevida;
- mostrar status do reembolso;
- não prometer ao consumidor uma data final de crédito que dependa da instituição financeira sem base no PSP;
- registrar identificador do estorno, webhook e conciliação quando houver integração real.

## 11. Dados que o ledger de produção precisa guardar

- `refund_id`;
- `order_id`;
- `order_vendor_id` quando parcial;
- motivo;
- valor de mercadoria;
- desconto atribuído;
- ajuste de frete;
- restauração de carteira;
- valor externo;
- destino escolhido;
- PSP/refund id;
- status;
- datas de solicitado, processado e concluído;
- ator que iniciou a operação;
- trilha de auditoria.

## 12. O que está implementado no protótipo

- cancelamento parcial por banca;
- continuidade das outras bancas;
- liberação parcial de estoque;
- recálculo local de subtotal, desconto atribuído e frete;
- remoção da banca da rota do entregador;
- atualização do peso da corrida;
- registro local do ajuste;
- escolha entre meio original e Carteira Feiraê;
- restauração de saldo Feiraê previamente usado.

## 13. O que depende de produção

- estorno Pix/cartão real;
- split financeiro real;
- ledger transacional;
- webhook do PSP;
- idempotência;
- conciliação;
- chargeback/disputa;
- SLA final por meio de pagamento;
- revisão jurídica final dos termos e da política pública.
