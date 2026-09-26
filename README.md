# Feiraê

**A feira do seu jeito.**

Marketplace de feiras com experiências separadas para **Cliente**, **Feirante** e **Entregador**.

## Estado atual — 26/09/2026

O Feiraê está em **protótipo funcional avançado**, não em produção. Os principais fluxos internos estão conectados e testados, mas a fonte de verdade operacional ainda é local ao navegador.

Hoje o protótipo já possui:

- login/cadastro local com senha para validação da experiência;
- alteração local de nome, e-mail e senha;
- cliente, feirante e entregador com experiências próprias;
- catálogo compartilhado entre banca e cliente;
- carrinho, checkout, pedidos e histórico;
- pedido unificado entre cliente, bancas e entregador;
- compra multi-banca com estado individual por banca;
- entrega e retirada;
- estoque reservado, liberado e consumido pelo fluxo local;
- peso estimado e peso real para logística;
- veículos, capacidade, região, raio e disponibilidade do entregador;
- promoções, cupons, frete grátis e limites de uso;
- cancelamento, suporte, reembolso local e carteira;
- avaliações cruzadas;
- notificações baseadas em eventos do pedido;
- documentos de feirante/entregador armazenados localmente no protótipo;
- migrations do Supabase preparadas para o backend real.

A persistência do protótipo usa `localStorage` e bridges em `src/domain`. Isso **não substitui autenticação, banco, storage, pagamentos ou autorização de produção**.

## Produção x protótipo

### Funciona no protótipo

Fluxos de interface, regras locais, transições operacionais, persistência local, validações de formulário, catálogo compartilhado, estoque local, carteira/reembolso local, corrida e repasses simulados.

### Ainda depende de integração/backend real

- Supabase Auth e autorização por papel;
- aplicação das migrations em ambiente real;
- Storage para documentos e fotos;
- Pix/cartão com provedor, tokenização e webhooks;
- split, ledger, saque e conciliação;
- KYC/aprovação documental;
- roteamento/geocodificação com SLA de produção;
- rastreamento em tempo real;
- push/WhatsApp;
- antifraude, chargeback e observabilidade.

## Arquitetura atual

- React 19 + TypeScript + Vite.
- `src/App.tsx`: shell e orquestração.
- `src/features/customer`: cliente.
- `src/features/vendor`: feirante.
- `src/features/delivery`: entregador.
- `src/components`: componentes reutilizáveis.
- `src/hooks`: sessão, estado e observação de eventos.
- `src/domain`: regras e bridges locais de pedido, marketplace, estoque, carteira, autenticação e rotas.
- `supabase/migrations`: schema de backend planejado/implementado em SQL.

Detalhes: [Arquitetura](docs/ARCHITECTURE.md).

## Máquina de estados

A referência oficial de estados está em [Modelo de dados e estados](docs/DATA_MODEL_AND_STATES.md).

No pedido unificado do protótipo:

```
received
→ preparing
→ ready_for_pickup
→ driver_assigned
→ collected
→ out_for_delivery
→ delivered
```

Saída alternativa: `cancelled`.

Pagamento e estado por banca são máquinas separadas e não devem ser confundidos com o status global do pedido.

## Supabase

O repositório contém:

- `supabase/migrations/0001_feirae_core.sql`
- `supabase/migrations/0002_feirae_operations.sql`

Essas migrations **preparam** o backend, mas a aplicação atual ainda não usa o Supabase como fonte de verdade.

## Segurança

O login local existe somente para testar o fluxo. O digest local de senha não é um mecanismo de autenticação de produção.

Produção deve usar:

- Auth real;
- RLS;
- segredos apenas no servidor;
- preço/estoque/pagamento validados server-side;
- mutações críticas idempotentes;
- trilha de auditoria;
- storage privado para documentos.

Veja [Segurança e autenticação](docs/SECURITY_AND_AUTH.md).

## Qualidade

Pipeline atual:

```bash
npm ci
npm run check
npm run format:check
```

No commit `33fd6b58`, o GitHub Actions aprovou:

- 8 arquivos de teste;
- 69 testes;
- ESLint;
- TypeScript/build;
- Prettier.

Veja [Testes e QA](docs/TESTING_QA.md).

## Documentação

Índice completo: [docs/README.md](docs/README.md).

Documentos centrais:

- [Especificação funcional](docs/FUNCTIONAL_SPEC.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Modelo de dados e estados](docs/DATA_MODEL_AND_STATES.md)
- [Auditoria end-to-end](docs/END_TO_END_AUDIT.md)
- [Auditoria de botões e edição](docs/UI_INTERACTION_AUDIT.md)
- [Fluxo de pedido e entrega](docs/ORDER_FULFILLMENT_FLOW.md)
- [Fluxo financeiro](docs/MONEY_FLOW.md)
- [Cadastro e aprovação](docs/ONBOARDING_AND_APPROVAL.md)
- [Integrações](docs/INTEGRATIONS.md)
- [Segurança e autenticação](docs/SECURITY_AND_AUTH.md)
- [LGPD e privacidade](docs/LGPD_AND_PRIVACY.md)
- [Administração](docs/ADMIN_MANAGEMENT_SPEC.md)
- [Deploy e ambientes](docs/DEPLOYMENT_AND_ENVIRONMENTS.md)
- [Roadmap](docs/ROADMAP.md)

## Desenvolvimento

```bash
npm ci
npm run dev
```

Validação completa:

```bash
npm run check
npm run format:check
```
