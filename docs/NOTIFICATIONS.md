# Notificações operacionais — Feiraê

Atualizado em 26/09/2026.

## Objetivo

Feirante e entregador não devem depender de abrir um módulo secundário para descobrir trabalho novo.

A Central operacional é a primeira camada de atenção:

- **Feirante:** pedidos novos e em andamento aparecem no painel principal;
- **Entregador:** corridas compatíveis aparecem no painel principal enquanto ele estiver disponível;
- corrida já aceita também permanece visível na Central.

## Identidade da notificação

O padrão de marca é:

- título-base: **Feiraê**;
- novo pedido: **Feiraê • Novo pedido**;
- nova corrida: **Feiraê • Nova corrida**;
- ícone: `/feirae-mark.svg`;
- mensagens curtas com pedido/corrida, valor, distância ou ganho quando aplicável;
- `tag` por evento para reduzir duplicidade.

A aparência final da notificação do sistema é controlada pelo Android/iOS/navegador. O Feiraê controla marca, título, texto, ícone, destino e agrupamento dentro das capacidades da plataforma.

## Implementação atual

Arquivos principais:

- `src/domain/feiraeNotifications.ts`;
- `public/feirae-sw.js`;
- `src/main.tsx`;
- `VendorScreens.tsx`;
- `DeliveryScreens.tsx`.

A permissão de notificação só é pedida após ação explícita no card **Notificações do Feiraê**.

Quando a página/PWA está carregada e a permissão foi concedida:

- pedido novo detectado para o feirante dispara notificação do sistema;
- corrida compatível nova detectada para entregador disponível dispara notificação do sistema;
- os itens também aparecem imediatamente na Central, sem exigir entrada em outra tela.

## Service worker

`public/feirae-sw.js` já possui:

- listener de `push`;
- `showNotification()` com marca Feiraê;
- `notificationclick`;
- reabertura/foco do aplicativo.

Isso deixa a interface preparada para Web Push.

## Limite atual: aplicativo totalmente fechado

O protótipo ainda usa `localStorage` e não possui backend compartilhado entre aparelhos.

Portanto **notificação remota com o app totalmente fechado ainda não está completa ponta a ponta**. O service worker está pronto para receber um push, mas falta o backend que:

1. crie e persista a assinatura `PushSubscription` por usuário/dispositivo;
2. associe a assinatura ao feirante ou entregador;
3. escute eventos reais de pedido/corrida no backend;
4. envie Web Push mesmo quando nenhuma aba estiver aberta;
5. invalide assinaturas expiradas;
6. respeite disponibilidade, suspensão, preferências e consentimento.

Quando Supabase/backend entrar, a assinatura deve ficar vinculada à conta e nunca somente ao navegador local.

## Regras de negócio

### Feirante

Disparar alerta para:

- novo pedido destinado à banca;
- mudança crítica no pedido;
- cancelamento;
- suporte/ocorrência relevante.

Não notificar pedido que não pertence à banca.

### Entregador

Disparar nova corrida somente se:

- cadastro estiver aprovado;
- entregador estiver online/disponível;
- agenda permitir;
- região/raio permitirem;
- existir veículo ativo/documentado compatível;
- corrida ainda estiver disponível.

Depois do aceite, priorizar alertas da corrida ativa.

## Futuro backend

Payload sugerido:

```json
{
  "title": "Nova corrida",
  "body": "Feira do Produtor Rural · 5,6 km · ganho R$ 12,80",
  "tag": "delivery-FE-1024",
  "url": "/"
}
```

O servidor deve ser a fonte de verdade para decidir quem recebe cada alerta.
