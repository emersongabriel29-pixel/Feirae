# Notificações — Feiraê

Atualizado em 26/09/2026.

## Regra central

Cliente, Feirante e Entregador possuem notificações diferentes porque cada papel acompanha um fluxo diferente.

Toda notificação do sistema usa a identidade:

- emissor visual: **Feiraê**;
- título: `Feiraê • <evento>`;
- ícone: `/feirae-mark.svg`;
- texto curto e operacional;
- `tag` por pedido/corrida/promoção para reduzir duplicidade.

## Cliente

O Cliente recebe alertas sobre compra, entrega e ofertas.

### Pedido

Fluxo principal:

1. **Feiraê • Pedido feito**
2. **Feiraê • Pagamento confirmado** ou **Pagamento na entrega**
3. **Feiraê • Pedido em preparação**
4. **Feiraê • Pedido pronto** / **Pronto para retirada**
5. **Feiraê • Entregador a caminho da banca**
6. **Feiraê • Saiu para entrega**
7. **Feiraê • Pedido chegando**
8. **Feiraê • Pedido chegou**

Também entram:

- pedido cancelado;
- solicitação de substituição;
- retirada concluída;
- reembolso quando o fluxo registrar esse evento.

### Promoções

Promoção nova ativa pode gerar:

**Feiraê • Promoção no Feiraê**

A preferência **Ofertas e novidades** controla esse tipo de alerta.

A preferência **Atualizações dos pedidos** controla eventos do pedido.

O Cliente pode ativar a permissão do navegador na própria tela **Notificações**.

## Feirante

O Feirante recebe somente eventos ligados à própria banca.

Eventos principais:

- **Feiraê • Novo pedido**;
- **Pagamento confirmado**;
- **Pagamento na entrega**;
- **Entregador a caminho**;
- **Rota calculada**;
- **Pedido coletado**;
- **Pedido entregue**;
- **Nova busca de entregador**;
- **Pedido cancelado**.

Além da notificação do sistema, a operação possui um módulo **Notificações** com o histórico relevante da banca.

Pedido de outra banca não deve gerar alerta.

## Entregador

O Entregador recebe alertas conforme disponibilidade, compatibilidade e corrida ativa.

Eventos principais:

- **Feiraê • Nova corrida**;
- **Pedido pronto para coleta**;
- **Rota atualizada**;
- **Corrida aceita**;
- **Coleta confirmada**;
- **Rota para o cliente**;
- **Chegada sinalizada**;
- **Entrega concluída**;
- **Corrida cancelada**;
- **Suporte prioritário**.

A nova corrida só deve ser oferecida se o entregador estiver elegível segundo cadastro, disponibilidade, agenda, região, raio e veículo compatível.

## Pedido chegando

O protótipo agora possui uma etapa operacional explícita:

`Iniciar entrega → Avisar chegada → Confirmar entrega`

Ao tocar em **Avisar chegada**:

- o pedido registra o evento `approaching`;
- o Cliente recebe **Pedido chegando**;
- o Entregador recebe **Chegada sinalizada**;
- depois disso a entrega pode ser confirmada.

Em produção, esse evento poderá ser automatizado por localização/geofence quando houver backend e rastreamento adequados.

## Promoções e campanhas por papel

Dados disponíveis hoje:

- Cliente: promoções ativas das bancas;
- Feirante: promoções da própria banca já fazem parte da operação, mas não há campanha administrativa remota;
- Entregador: não há motor real de bônus/campanhas de entrega conectado.

Quando o backend existir, campanhas administrativas poderão usar a mesma identidade Feiraê, respeitando o papel do destinatário.

## Implementação atual

Arquivos principais:

- `src/domain/feiraeNotifications.ts`;
- `src/domain/marketplaceBridge.ts`;
- `src/hooks/useMarketplaceRevision.ts`;
- `src/App.tsx`;
- `src/features/customer/CustomerScreens.tsx`;
- `src/features/vendor/VendorScreens.tsx`;
- `src/features/delivery/DeliveryScreens.tsx`;
- `public/feirae-sw.js`;
- `src/main.tsx`.

A permissão do navegador sempre depende de ação do usuário.

## Service worker

`public/feirae-sw.js` possui:

- listener de `push`;
- `showNotification()`;
- ícone e badge Feiraê;
- `notificationclick`;
- foco/reabertura do aplicativo.

## Aplicativo totalmente fechado

O protótipo continua usando `localStorage` e não possui backend compartilhado entre aparelhos.

Portanto, **notificação remota com o aplicativo totalmente fechado ainda não está completa ponta a ponta**.

Para produção, o backend precisa:

1. criar e persistir `PushSubscription` por usuário/dispositivo;
2. associar a assinatura ao papel correto;
3. receber eventos reais de pedido, rota, promoção e suporte;
4. decidir os destinatários;
5. enviar Web Push;
6. remover assinaturas expiradas;
7. respeitar preferências, disponibilidade, suspensão e consentimento.

O servidor deve ser a fonte de verdade para decidir quem recebe cada alerta.

## Identidade visual das notificações — 28/09/2026

Notificações locais e Web Push passam a reutilizar `/brand/feirae-symbol.svg`, o mesmo símbolo canônico usado pelo aplicativo/PWA. O service worker e `showFeiraeNotification` não mantêm mais um ícone visual divergente.

Observação de plataforma: alguns sistemas operacionais monocromatizam ou mascaram o badge da notificação; o asset de origem continua sendo o símbolo oficial.
