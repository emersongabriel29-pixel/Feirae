# Arquitetura — Feiraê

Atualizado em 26/09/2026.

## Visão geral

O Feiraê usa hoje uma arquitetura de **protótipo local com regras de domínio separadas**, preparada para migração incremental ao Supabase.

```
React UI
├─ customer
├─ vendor
└─ delivery
      ↓
hooks + domain bridges
      ↓
localStorage / serviços públicos de protótipo
```

Arquitetura alvo:

```
React UI
      ↓
features / use-cases / repositories
      ↓
Supabase Auth + Postgres + Storage + Edge Functions/RPC
      ↓
pagamento / rotas / KYC / notificações
```

## Camadas atuais

### `src/App.tsx`

Responsável por:

- shell;
- sessão;
- navegação;
- composição dos papéis;
- carrinho e pedido do cliente;
- coordenação de bridges.

Não deve concentrar novas regras complexas de domínio.

### `src/features/customer`

- feiras;
- catálogo;
- carrinho/checkout;
- endereços;
- pagamentos locais;
- pedidos/rastreamento;
- avaliações;
- suporte;
- conta/configurações.

### `src/features/vendor`

- banca;
- catálogo/estoque;
- horários;
- promoções;
- pedidos;
- preparo;
- documentos;
- avaliações;
- financeiro local.

### `src/features/delivery`

- disponibilidade;
- regiões/raio;
- veículos;
- documentos;
- ofertas;
- corrida ativa;
- coleta/rota/entrega;
- suporte;
- avaliações;
- financeiro local.

## Bridges de domínio atuais

### `orderBridge.ts`

Fonte local compartilhada do pedido unificado.

Mantém:

- pedido;
- estados por banca;
- pagamento;
- eventos;
- suporte;
- avaliações;
- motorista/rota.

### `marketplaceBridge.ts`

Sincroniza banca/produtos/promoções com a experiência do cliente.

### `inventoryBridge.ts`

Implementa no protótipo:

- reserva;
- liberação;
- consumo de estoque.

### `walletBridge.ts`

Créditos de reembolso e débitos da carteira local.

### `localAuth.ts`

Somente para validar UX de login/cadastro/alteração de credenciais.

**Não é segurança de produção.**

### `routing.ts`

Geocodificação/rota para protótipo. Provedor real deve substituir essa dependência.

### `storedFile.ts`

Permite armazenar documento no navegador para validar upload e edição.

**Produção exige Storage privado.**

## Persistência

Hoje:

- `localStorage`;
- eventos de sincronização local;
- fixtures para contas demo.

Problemas inerentes:

- sem consistência multi-dispositivo;
- sem transação real;
- sem isolamento de segurança;
- limite de armazenamento;
- dados podem ser apagados pelo navegador;
- concorrência não é confiável.

## Backend planejado

As migrations existentes são:

1. `0001_feirae_core.sql`;
2. `0002_feirae_operations.sql`.

Elas não significam que o app já está conectado ao Supabase.

## Migração recomendada

Não reescrever a UI. Substituir bridges por interfaces.

Exemplo conceitual:

```ts
interface OrderRepository {
  get(id: string): Promise<Order>
  create(input: CreateOrder): Promise<Order>
  transition(id: string, action: OrderAction): Promise<Order>
}
```

Implementações:

- `LocalOrderRepository` para protótipo;
- `SupabaseOrderRepository` para staging/produção.

## Fonte de verdade

Produção:

| Domínio | Fonte de verdade |
| --- | --- |
| sessão | Auth |
| papéis | Postgres/RLS |
| catálogo | Postgres |
| imagens/documentos | Storage |
| estoque | Postgres/transação |
| pedido | Postgres |
| eventos | Postgres |
| pagamento | provedor + ledger |
| rota | provedor/cache |
| notificações | backend |
| avaliações | Postgres |

## Princípios

- UI não decide autorização.
- Cliente não define preço final.
- Estoque não é decrementado apenas no browser.
- Webhook é idempotente.
- Transição crítica é server-side.
- IDs não dependem de texto/nome visível.
- Eventos críticos são auditáveis.
- Integrações ficam atrás de adapters.
