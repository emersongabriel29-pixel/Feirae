# Arquitetura — Feiraê

Atualizado em 26/09/2026 a partir da árvore real de `src/`.

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

- `fairHours.ts`: agenda verificada/parcial das feiras;
- `identity.ts`: IDs derivados do protótipo;
- `inventoryBridge.ts`: reserva/liberação/consumo;
- `localAuth.ts`: credenciais locais;
- `marketplace.ts`: peso, veículo e métricas;
- `marketplaceBridge.ts`: banca/produto/promoção compartilhados;
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
- carteira;
- frete fixture via `vendorMetrics.deliveryFee`.

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
- modalidades de entrega/pagamento.

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
