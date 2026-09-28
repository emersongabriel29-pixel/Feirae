# Arquitetura — Feiraê

Atualizado em 27/09/2026 a partir da árvore real de `src/`.

## 1. Stack instalada

Dependências de produção atuais:

- React 19.1.1;
- React DOM 19.1.1;
- lucide-react.

Build/test:

- TypeScript 5.8;
- Vite 6.2;
- Vitest 5;
- Testing Library;
- ESLint;
- Prettier;
- Tailwind CSS Vite plugin.

Não estão instalados:

- Supabase JS;
- SDK de mapa;
- SDK de pagamento;
- SDK de push;
- SDK de observabilidade.

## 2. Estrutura real

### Shell

`src/App.tsx`

Responsável por:

- sessão;
- navegação entre papéis;
- carrinho;
- criação do pedido do cliente;
- abertura do Google Maps;
- favoritos;
- notificações;
- migração de identidade local;
- composição das telas.

### Cliente

`src/features/customer/CustomerScreens.tsx`

Contém:

- home/feiras;
- catálogo;
- banca;
- carrinho;
- checkout;
- pedidos;
- conta;
- endereço;
- pagamentos;
- suporte;
- avaliações;
- configurações.

### Feirante

`src/features/vendor/VendorScreens.tsx`

Modelo:

`src/features/vendor/vendorModel.ts`.

### Entregador

`src/features/delivery/DeliveryScreens.tsx`.

## 3. Domain atual

Arquivos existentes:

- `customerLegal.ts`: Termos/Aviso do Cliente e versionamento de aceite;
- `fairHours.ts`: agenda verificada/parcial das feiras;
- `fairInternalRouting.ts`: ordenação interna de boxes/paradas e confirmação de coleta;
- `feiraeNotifications.ts`: matriz/eventos de notificação por papel;
- `feiraeSound.ts`: assinatura sonora e preferência local;
- `identity.ts`: IDs derivados do protótipo;
- `inventoryBridge.ts`: reserva/liberação/consumo;
- `legalTerms.ts`: termos versionados de Feirante/Entregador;
- `localAuth.ts`: credenciais locais;
- `marketplace.ts`: peso, veículo e métricas;
- `marketplaceBridge.ts`: banca/produto/promoção compartilhados;
- `multiVendor.ts`: mínimo por banca, limite de bancas, alocação e frete multi-banca;
- `operations.ts`: utilidades operacionais;
- `orderBridge.ts`: pedido unificado;
- `routing.ts`: Nominatim + OSRM;
- `session.ts`: sessão/papel;
- `storage.ts`: chave escopada por conta;
- `storedFile.ts`: arquivos Data URL;
- `vehicles.ts`: tipos/capacidades/placa;
- `walletBridge.ts`: carteira local.

## 4. Hooks atuais

- `useAppNavigation.ts`;
- `useDemoCart.ts`;
- `useDemoSession.ts`;
- `useMarketplaceRevision.ts`;
- `useToast.ts`;
- `useUnifiedOrderRevision.ts`.

## 5. Caminho real de uma compra

### 5.1 Cliente adiciona produto

`CustomerScreens.tsx`
→ callback de App
→ `useDemoCart`.

### 5.2 Checkout

`CheckoutPage` calcula:

- subtotal;
- peso;
- modalidades permitidas;
- promoções via `calculateCheckoutPromotions()`;
- pedido mínimo individual por banca via `vendorOrderSummaries()`;
- carteira;
- frete fixture via `vendorMetrics.deliveryFee`.

### 5.2.1 Validação do mínimo por banca

A fonte local da regra é `SharedStore.minimumOrderAmount`.

Fluxo:

```
banca → marketplaceBridge
→ sacola (pré-validação)
→ checkout (promoções + validação final)
→ App.confirmOrder() (revalidação antes de reservar estoque)
```

O frontend atual usa R$ 30,00 somente como fallback para banca sem configuração legada/estática. Banca nova pode usar R$ 0,00.

Produção precisa repetir essa validação no servidor; o valor enviado pelo navegador nunca deve ser aceito como fonte de verdade.

### 5.3 Confirmar pedido

`App.tsx::confirmOrder()`:

1. gera ID `FE-xxxxxxxx`;
2. chama `reserveInventory()`;
3. cria histórico local do cliente;
4. chama `upsertUnifiedOrder()`;
5. registra eventos;
6. consome carteira quando usada;
7. registra uso de promoção.

### 5.4 Feirante

`VendorScreens.tsx` lê `readUnifiedOrders()`.

A banca:

- aceita;
- separa;
- marca item;
- informa peso real;
- fica pronta.

Atualizações chamam `patchUnifiedOrder()`.

### 5.5 Liberação logística

`orderBridge.ts` deriva o estado global.

Teste atual confirma que multi-banca só libera quando todas as bancas estão prontas.

### 5.6 Rota

O pedido recebe métricas de rota por `routing.ts` quando disponíveis.

### 5.7 Entregador

`DeliveryScreens.tsx` lê pedidos prontos com rota.

Filtra por:

- raio;
- região;
- disponibilidade;
- agenda;
- aprovação;
- capacidade/documento do veículo.

Ao aceitar:

`patchUnifiedOrder(status = driver_assigned)`.

Etapas seguintes atualizam:

- `collected`;
- `out_for_delivery`;
- `delivered`.

## 6. Caminho de estoque

`inventoryBridge.ts` usa:

- `feirae:inventory-reservations:v1`;
- `feirae:marketplace:v2`;
- `feirae:static-stock-adjustments:v1`;
- produtos locais do feirante.

Operações:

- `reserveInventory`;
- `releaseInventory`;
- `consumeInventory`.

Isso não é transação de banco.

## 7. Marketplace local

`marketplaceBridge.ts` publica no mesmo navegador:

- banca;
- produtos;
- promoções;
- aprovação;
- aberta/fechada;
- modalidades de entrega/pagamento;
- pedido mínimo configurado por banca.

Storage:

`feirae:marketplace:v2`.

## 8. IDs do protótipo

Alguns IDs são derivados de texto/e-mail para manter consistência local.

Produção deve usar UUIDs do banco.

Não transportar a lógica de ID derivado como identidade canônica server-side.

## 9. Banco preparado

Migrations:

- 0001 core;
- 0002 operations.

O app não as consome ainda.

Gaps exatos: [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

## 10. Arquitetura de substituição

A migração deve preservar as telas e substituir fontes de dados.

Ordem recomendada:

1. Auth;
2. perfis;
3. feira/banca/produtos;
4. pedidos/eventos;
5. estoque;
6. documentos;
7. entrega;
8. financeiro;
9. notificações/admin.

Não fazer reescrita visual junto com a migração de fonte de verdade sem necessidade.

## 11. Fronteira obrigatória

No backend real, o navegador pode pedir uma ação, mas não decidir sozinho:

- preço final;
- estoque;
- estado válido;
- aprovação;
- valor de repasse;
- estorno;
- taxa.

## 12. Rastreabilidade

Mapa por função/chave/tabela:
[IMPLEMENTATION_TRACEABILITY.md](IMPLEMENTATION_TRACEABILITY.md).

## Experiência de inicialização

O bootstrap visual fica fora de `App.tsx` para não misturar a experiência de abertura com regras de marketplace.

Fluxo:

```
src/main.tsx
→ LaunchExperience
→ App
```

Responsabilidades:

- `src/components/LaunchExperience.tsx`: decide abertura completa, rápida ou reduced motion;
- `src/components/LaunchExperience.css`: anima banca, produtos, rota, entrega e marca;
- `src/domain/feiraeSound.ts`: assinatura sonora e preferência local;
- `src/components/LaunchExperience.test.tsx`: cobre os três modos de abertura.

A splash não é gate de dados nem autenticação. Falha de áudio não pode bloquear o app.

## Arquitetura de governança do repositório

A sincronização de mudanças possui duas camadas:

1. contrato humano em `docs/CHANGE_GOVERNANCE.md`;
2. política automatizada em `scripts/change-sync-policy.mjs`.

`scripts/check-change-sync.mjs` coleta o diff do PR e delega a avaliação para a política. A própria política possui testes Node em `scripts/change-sync-policy-checks.mjs`.

Isso reduz o risco de um PR atualizar “qualquer documento” em vez do documento correto para o domínio alterado.

### Splash premium — composição interna

`LaunchExperience.tsx` usa uma cena SVG vetorial com grupos independentes para:

- banca outline/fill;
- caixas e produtos;
- elementos orgânicos flutuantes;
- rota principal + glow;
- moto, entregador e rodas;
- pin;
- marca final.

`LaunchExperience.css` controla a linha do tempo por variante `full`, `quick` e `reduced`. A cena não depende de imagem externa, vídeo ou serviço remoto.

### Splash alinhada à referência aprovada — 27/09/2026

A composição visual anterior da splash foi substituída. `LaunchExperience.tsx` agora atua somente como orquestrador dos três quadros aprovados e `LaunchExperience.css` controla as transições.

Fonte visual local:

- `public/launch/feirae-splash-start.svg`;
- `public/launch/feirae-splash-market.svg`;
- `public/launch/feirae-splash-logo.svg`.

Não há dependência de CDN, imagem remota ou vídeo. O shell do app continua pré-carregado e oculto até o término do temporizador da variante.

### Regra de implementação da splash

A splash premium não deve ser implementada como slideshow de imagens prontas.

A fonte canônica é a cena SVG inline de `LaunchExperience.tsx`, animada por grupos via `LaunchExperience.css`. Isso permite movimento contínuo e independente de banca, produtos, rota, moto, rodas, pin e marca.

## Manutenção de formatação — 27/09/2026

Durante a integração do mapa das feiras, o Prettier também normalizou a formatação de
`src/components/LaunchExperience.tsx`. Não houve mudança de comportamento, duração, assets,
áudio, fallback ou fluxo da experiência de abertura.

## Arquitetura do mapa nativo de feiras — 27/09/2026

A cartografia do Cliente foi separada em domínio e UI:

- `src/domain/fairMap.ts` mantém referências regionais temporárias, resolve prioridade de `fair.lat/lng`, projeta coordenadas no canvas do DF e calcula proximidade;
- `src/features/customer/FairMapPanel.tsx` renderiza o mapa, pins, posição do Cliente, seleção e CTAs;
- `CustomerScreens.tsx::FairsPage` aplica o filtro regional antes de enviar as feiras ao mapa;
- `App.tsx` fornece as coordenadas obtidas pelo fluxo de GPS já existente.

A projeção é deliberadamente independente de SDK externo. Coordenadas regionais são fallback de apresentação e não pertencem ao domínio de frete/roteamento. Quando o backend fornecer coordenadas verificadas, o mesmo componente passa a priorizá-las sem mudança de contrato visual.

## Arquitetura do acompanhamento cartográfico — 28/09/2026

`src/components/OrderRouteMap.tsx` é o componente compartilhado por Cliente, Feirante e Entregador.

Fontes de estado:

- `UnifiedOrderRecord.status`: posição operacional quando não existe GPS;
- `UnifiedOrderRecord.route.pickupStops`: bancas e sequência de coleta;
- `UnifiedOrderRecord.customerAddress/customerLat/customerLng`: destino;
- `UnifiedOrderRecord.driver.location`: snapshot opcional de GPS do entregador;
- `fairMapCoordinate()`: coordenada de feira, priorizando `lat/lng` verificados e usando fallback regional somente quando necessário.

O Entregador usa `navigator.geolocation.watchPosition()` apenas durante corrida ativa e somente depois de existir localização-base configurada pelo próprio usuário. Escritas são limitadas a no máximo uma a cada 5 segundos.

A posição visual da moto é:

- por GPS quando há snapshot utilizável;
- por etapa do pedido como fallback explícito.

O protótipo persiste snapshots na bridge local. Produção deve substituir isso por backend autenticado/realtime sem alterar o contrato do componente.

## Integridade de dados Feirante → Catálogo — 28/09/2026

`VendorProduct` possui dados de apresentação que precisam atravessar a bridge do marketplace. `Product` e `SharedCatalogProduct` passam a preservar `description` e `packageSize`.

`syncVendorMarketplace()` não deve reduzir o produto a nome/preço/estoque. Novos campos públicos do cadastro do Feirante devem ser avaliados para propagação à camada de Cliente quando tiverem finalidade de compra.

Dados internos de operação permanecem fora do contrato público do produto.

## Estado da quantidade nos cards — 28/09/2026

Os cards de produto recebem `cart` e as ações `addProductToCart` / `removeFromCart` a partir de `App.tsx`.

`ProductCard` recebe apenas a quantidade derivada `cart[product.id] ?? 0`; não cria estado local de quantidade. Isso garante sincronização imediata entre todas as telas que exibem o mesmo produto e o `CartDrawer`.

O limite superior continua sendo validado por `useDemoCart.addToCart()` contra `product.stock`. A interface também desabilita visualmente o incremento ao atingir o estoque, mas a regra de domínio permanece no hook.

## Camada de identidade compartilhada — 28/09/2026

A marca deixa de ser montada localmente em cada tela e passa a ter uma camada compartilhada:

- assets em `public/brand/`;
- alias legado `public/feirae-mark.svg`;
- componente `src/components/FeiraeBrand.tsx`;
- tokens em `src/styles/tokens.css`;
- estilos institucionais em `src/styles/brand.css`.

Login, header e fallback da splash consomem essa camada. A gestão estática em `public/gestao/` usa os mesmos assets, sem compartilhar lógica de negócio do app.
