# Feiraê

**A feira do seu jeito.**

Marketplace de feiras com três experiências: Cliente, Feirante e Entregador.

## Estado real do repositório — 26/09/2026

O código atual é um **protótipo funcional integrado no mesmo navegador**.

Ele não está conectado ao Supabase e não possui pagamento, Storage, KYC, push ou backend de produção.

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
- checkout;
- pagamento local;
- retirada;
- entrega;
- pedidos;
- suporte;
- avaliações;
- carteira/reembolso local.

### Feirante

- conta e banca;
- produto/estoque;
- horários;
- promoções;
- documentos;
- aprovação local;
- pedidos;
- peso real;
- avaliações;
- recebíveis simulados.

### Entregador

- conta;
- documentos;
- veículos;
- capacidade;
- disponibilidade;
- agenda/raio/região;
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

O preço do frete **não é calculado pelo OSRM**. O checkout usa `vendorMetrics.deliveryFee` como valor local de fallback.

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
- `supabase/migrations/0002_feirae_operations.sql`.

Não existem ainda:

- cliente Supabase;
- `supabase/config.toml`;
- Edge Functions;
- Storage conectado;
- Auth conectado.

As migrations atuais também possuem gaps documentados em [SCHEMA_GAP_MATRIX.md](docs/SCHEMA_GAP_MATRIX.md).

## Testes

Suite atual:

- 43 testes em `App.test.tsx`;
- 26 testes de domínio/utilidades;
- **69 testes no total**.

CI:

```bash
npm ci
npm run check
npm run format:check
```

Cobertura exata e lacunas:
[TESTING_QA.md](docs/TESTING_QA.md).

## Documentação

Índice:
[docs/README.md](docs/README.md).

Design e rastreabilidade:

- [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- [IMPLEMENTATION_TRACEABILITY.md](docs/IMPLEMENTATION_TRACEABILITY.md)
- [SCHEMA_GAP_MATRIX.md](docs/SCHEMA_GAP_MATRIX.md)
- [DATA_MODEL_AND_STATES.md](docs/DATA_MODEL_AND_STATES.md)
- [FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md)

Admin:

- [ADMIN_MANAGEMENT_SPEC.md](docs/ADMIN_MANAGEMENT_SPEC.md)

Produção:

- [SECURITY_AND_AUTH.md](docs/SECURITY_AND_AUTH.md)
- [LGPD_AND_PRIVACY.md](docs/LGPD_AND_PRIVACY.md)
- [INTEGRATIONS.md](docs/INTEGRATIONS.md)
- [DEPLOYMENT_AND_ENVIRONMENTS.md](docs/DEPLOYMENT_AND_ENVIRONMENTS.md)

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
