# Feiraê

**A feira do seu jeito.**

Marketplace de feiras com três experiências: Cliente, Feirante e Entregador.

## Estado real do repositório — 27/09/2026

O código atual é um **protótipo funcional integrado no mesmo navegador**.

Ele não está conectado ao Supabase e não possui pagamento, Storage, KYC ou backend de produção. Há service worker e notificações locais/browser com marca Feiraê, mas o Web Push remoto com o app totalmente fechado ainda depende de backend e assinatura persistida.

### Stack instalada

- React 19;
- TypeScript;
- Vite;
- Vitest/Testing Library;
- ESLint;
- Prettier;
- Tailwind plugin;
- lucide-react.

`@supabase/supabase-js` não está instalado.

## O que funciona localmente

### Cliente

- login/cadastro local;
- conta;
- endereço/GPS;
- feiras/bancas;
- catálogo;
- favoritos;
- carrinho;
- pedido mínimo configurável por banca;
- checkout;
- pagamento local;
- retirada;
- entrega;
- pedidos;
- notificações locais/browser por etapa do pedido e promoções;
- suporte;
- avaliações;
- carteira/reembolso local.

### Feirante

- conta e banca;
- pedido mínimo próprio ou sem mínimo;
- produto/estoque;
- horários;
- promoções;
- documentos;
- termos jurídicos versionados e assinatura eletrônica local;
- aprovação local condicionada aos termos vigentes e documentos;
- pedidos, inclusive no painel principal;
- notificações locais/browser de novo pedido, pagamento, coleta, entrega e cancelamento com identidade Feiraê;
- peso real;
- avaliações;
- recebíveis simulados.

### Entregador

- conta;
- documentos;
- termos jurídicos versionados e assinatura eletrônica local;
- veículos;
- capacidade;
- disponibilidade;
- agenda/raio/região;
- corridas compatíveis no painel principal;
- notificações locais/browser de nova corrida, rota, coleta, chegada, entrega e cancelamento com identidade Feiraê;
- corrida;
- coleta;
- rota;
- entrega;
- suporte;
- avaliações;
- ganhos simulados.

## Fonte de verdade atual

Persistência principal:

- `localStorage`;
- `src/domain/orderBridge.ts`;
- `marketplaceBridge.ts`;
- `inventoryBridge.ts`;
- `walletBridge.ts`;
- `localAuth.ts`.

Isso significa que o protótipo não prova sincronização entre aparelhos diferentes.

## Rotas atuais

- browser Geolocation API;
- Nominatim Search;
- Nominatim Reverse;
- OSRM público;
- Google Maps aberto por URL.

O preço do frete **não é calculado pelo OSRM**. O checkout usa `vendorMetrics.deliveryFee` como valor local de fallback, mas só exibe e aplica esse valor depois que existe endereço de entrega; sem endereço, o frete fica como **A calcular** e não entra no total.

## Veículos atuais

Fonte: `src/domain/vehicles.ts`.

| Tipo                         | Capacidade padrão |
| ---------------------------- | ----------------: |
| Bicicleta                    |             10 kg |
| Bicicleta cargueira/triciclo |             40 kg |
| Moto                         |             12 kg |
| Moto com baú                 |             20 kg |
| Carro                        |             80 kg |
| Utilitário/Pickup            |            250 kg |
| Van                          |            500 kg |
| Outro                        |             10 kg |

## Supabase

Existem:

- `.env.example`;
- `supabase/migrations/0001_feirae_core.sql`;
- `supabase/migrations/0002_feirae_operations.sql`;
- `supabase/migrations/0003_vendor_store_minimum_order.sql`.

Não existem ainda:

- cliente Supabase;
- `supabase/config.toml`;
- Edge Functions;
- Storage conectado;
- Auth conectado.

As migrations atuais também possuem gaps documentados em [SCHEMA_GAP_MATRIX.md](docs/SCHEMA_GAP_MATRIX.md).

## Testes

Suite atual:

- 58 testes em `App.test.tsx`;
- 3 testes do componente de abertura;
- 68 testes de domínio/utilidades;
- **129 testes Vitest**;
- 8 testes da política de sincronização do repositório em `scripts/change-sync-policy-checks.mjs`.

O `npm run check` executa lint, 129 testes Vitest, 8 testes de governança e build.

CI:

```bash
npm ci
npm run check
npm run check:sync   # em PR, com BASE_SHA/HEAD_SHA
npm run format:check
```

Cobertura exata e lacunas:
[TESTING_QA.md](docs/TESTING_QA.md).

## Documentação

Índice:
[docs/README.md](docs/README.md).

Design e rastreabilidade:

- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- [BRAND_IDENTITY.md](docs/BRAND_IDENTITY.md)
- [IMPLEMENTATION_TRACEABILITY.md](docs/IMPLEMENTATION_TRACEABILITY.md)
- [SCHEMA_GAP_MATRIX.md](docs/SCHEMA_GAP_MATRIX.md)
- [DATA_MODEL_AND_STATES.md](docs/DATA_MODEL_AND_STATES.md)
- [FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)
- [NOTIFICATIONS.md](docs/NOTIFICATIONS.md)
- [PARTNER_LEGAL_TERMS.md](docs/PARTNER_LEGAL_TERMS.md)
- [CUSTOMER_LEGAL_TERMS.md](docs/CUSTOMER_LEGAL_TERMS.md)

Admin:

- [ADMIN_MANAGEMENT_SPEC.md](docs/ADMIN_MANAGEMENT_SPEC.md)

Produção:

- [SECURITY_AND_AUTH.md](docs/SECURITY_AND_AUTH.md)
- [LGPD_AND_PRIVACY.md](docs/LGPD_AND_PRIVACY.md)
- [INTEGRATIONS.md](docs/INTEGRATIONS.md)
- [DEPLOYMENT_AND_ENVIRONMENTS.md](docs/DEPLOYMENT_AND_ENVIRONMENTS.md)

## Regra para qualquer atualização

Toda mudança futura deve seguir [Governança de mudanças](docs/CHANGE_GOVERNANCE.md).

O projeto deve avançar em conjunto quando houver impacto em:

- código;
- interface;
- testes;
- documentação;
- schema/migrations;
- segurança/RLS;
- integrações;
- LGPD/dados;
- painel administrativo;
- deploy/ambientes.

O PR template exige a revisão desses impactos e o CI executa `npm run check:sync`.

Veja também [CONTRIBUTING.md](CONTRIBUTING.md).

## Desenvolvimento

```bash
npm ci
npm run dev
```

Validação:

```bash
npm run check
npm run format:check
```

## Regra de verdade documental

Para afirmar **o que existe hoje**, verificar código + testes + migrations.

Os documentos definem contratos, decisões e lacunas, mas não podem transformar requisito futuro em funcionalidade existente.

## Shell visual da gestão

A rota estática `/gestao/` aplica a identidade oficial Feiraê ao futuro painel administrativo. Ela é referência visual e **não representa backend administrativo pronto**; permissões, auditoria, taxas e ações reais continuam descritas em `docs/ADMIN_MANAGEMENT_SPEC.md`.
