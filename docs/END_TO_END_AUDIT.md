# Auditoria end-to-end — Feiraê

Atualizado em 26/09/2026.

Este documento transforma a auditoria funcional em critérios de aceite executáveis. O objetivo é impedir que uma tela pareça pronta enquanto a etapa seguinte do processo não recebe os mesmos dados.

## Regra central

Toda compra deve permanecer vinculada ao mesmo pedido do início ao fim:

```
Feira → Banca → Produto → Carrinho → Endereço/retirada → Pagamento
→ Pedido → Bancas → Separação → Pronto → Entregador/retirada
→ Coleta → Rota → Conclusão → Avaliações → Repasse
```

O pedido unificado registra eventos de transição e mantém estados separados por banca quando a compra envolve mais de uma banca.

## Cliente

| Fluxo                        | Início                     | Andamento                             | Fim esperado                                                           |
| ---------------------------- | -------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| Cadastro                     | Criar conta                | nome/e-mail/papel                     | sessão criada sem dados fictícios                                      |
| Carrinho                     | adicionar produto          | quantidade/peso/estoque/feira         | checkout                                                               |
| Endereço                     | adicionar endereço         | manual ou GPS                         | endereço principal utilizável                                          |
| Checkout                     | escolher modalidade        | promoções, carteira, frete, pagamento | pedido criado                                                          |
| Pagamento agora              | Pix/cartão                 | status autorizado no fluxo local      | pedido liberado                                                        |
| Pagamento na entrega         | dinheiro/maquininha        | informação chega à corrida            | autorizado ao concluir entrega                                         |
| Cancelamento antes da coleta | escolher motivo            | outro exige descrição                 | pedido cancelado + estoque liberado + reembolso local quando aplicável |
| Problema após coleta         | abrir suporte              | ocorrência vinculada ao pedido        | protocolo aberto                                                       |
| Retirada                     | selecionar retirada        | banca prepara                         | banca confirma retirada e pedido termina entregue                      |
| Entrega                      | pedido pronto              | entregador aceita/coleta/rota         | pedido entregue                                                        |
| Substituição                 | item indisponível          | banca propõe/cliente decide           | aceite registrado ou cliente cancela                                   |
| Avaliação                    | pedido entregue            | produto/banca/entrega                 | avaliação persistida                                                   |
| Comprar novamente            | selecionar pedido anterior | restaura itens ainda disponíveis      | nova sacola                                                            |
| Carteira                     | receber reembolso          | saldo aparece no checkout             | crédito consumido em nova compra                                       |
| Notificações                 | evento do pedido           | histórico cronológico                 | leitura persistida                                                     |

## Feirante

| Fluxo                | Início                      | Andamento                    | Fim esperado                                       |
| -------------------- | --------------------------- | ---------------------------- | -------------------------------------------------- |
| Cadastro operacional | dados da banca              | documentos/horários/produtos | catálogo publicado após aprovação                  |
| Pedido               | pedido recebido             | aceitar → separar            | parte da banca pronta                              |
| Multi-banca          | uma banca conclui           | status individual por banca  | logística só libera quando todas estão prontas     |
| Peso real            | separar item                | informar peso real           | logística usa o peso atualizado                    |
| Estoque              | cadastrar/editar produto    | reservar no pedido           | consumir na conclusão ou devolver no cancelamento  |
| Promoção             | criar campanha              | período/uso/alvo/cupom       | desconto refletido no checkout e uso contabilizado |
| Horário              | horário da feira ou próprio | suporta virada da meia-noite | banca aberta/fechada governa compra                |
| Pagamento na entrega | habilitar formas            | checkout respeita banca      | instrução chega à corrida                          |
| Avaliação            | pedido concluído            | avaliar cliente/entregador   | avaliação vinculada ao pedido                      |
| Financeiro           | pedido entregue             | disponível → solicitado      | recebido registrado no fluxo local                 |

## Entregador

| Fluxo                      | Início            | Andamento                        | Fim esperado                         |
| -------------------------- | ----------------- | -------------------------------- | ------------------------------------ |
| Cadastro                   | dados pessoais    | documentos + veículo             | aprovação antes de ficar disponível  |
| Veículo                    | cadastrar         | capacidade/documento/ativo       | veículo elegível para corridas       |
| Disponibilidade            | ligar             | agenda/raio/região               | corridas filtradas                   |
| Corrida                    | oferta compatível | aceitar → banca → coletar → rota | confirmar entrega                    |
| Recarregar durante corrida | corrida aceita    | ID e etapa persistidos           | continua da mesma etapa              |
| Peso                       | pedido liberado   | capacidade >= peso real          | somente veículos compatíveis recebem |
| Alerta grave               | ocorrência        | protocolo prioritário            | novas ofertas pausadas               |
| Avaliação                  | entrega concluída | cliente/banca                    | avaliação persistida                 |
| Financeiro                 | entrega concluída | disponível → saque solicitado    | repasse recebido registrado          |

## Integridade

- Dados de cliente são isolados por conta no armazenamento local do protótipo.
- Relação operacional usa IDs de banca/loja; nome permanece apresentação.
- Renomear uma banca preserva aliases para não quebrar catálogo e histórico.
- Estoque é reservado ao criar pedido, devolvido quando o pedido é cancelado e consumido ao concluir.
- Pedidos em `driver_assigned`, `collected` ou `out_for_delivery` não voltam à fila pública.
- Corrida ativa e etapa do entregador persistem.
- Uma banca não aprovada não publica produtos no catálogo compartilhado.
- Configurações de entrega/retirada e pagamento na entrega da banca governam o checkout.
- Eventos do pedido alimentam rastreamento e notificações.

## Limites de produção

O frontend fecha os ciclos para validação funcional, mas produção exige serviços externos/reais para:

- autenticação e autorização;
- autorização/captura de Pix/cartão e webhooks;
- split, saque e conciliação;
- roteamento/geocodificação com SLA;
- aprovação documental humana ou serviço KYC;
- rastreamento em tempo real;
- notificações push/WhatsApp;
- antifraude e chargeback.

A migration `supabase/migrations/0002_feirae_operations.sql` prepara as entidades necessárias para levar esses fluxos ao backend. As transições financeiras, estoque, aprovação documental e liquidação devem ser executadas no servidor com idempotência.

## Critérios de regressão

O CI deve falhar se qualquer um destes pontos quebrar:

1. corrida não avança de coleta para rota e entrega;
2. pedido multi-banca libera logística antes de todas as bancas estarem prontas;
3. peso real não propaga para o pedido;
4. estoque não é reservado/liberado/consumido;
5. catálogo da banca diverge de preço/estoque/status publicados;
6. retirada não chega a entregue;
7. dados de um cliente aparecem na conta de outro;
8. promoção configurada não afeta o checkout;
9. cancelamento pago não gera reembolso local;
10. suporte/avaliação deixam de ficar vinculados ao pedido.
