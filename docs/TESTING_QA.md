# Testes e QA — Feiraê

Atualizado em 26/09/2026.

## Estado atual

Referência: commit `33fd6b58`.

GitHub Actions aprovou:

- 8 arquivos de teste;
- 69 testes;
- ESLint;
- TypeScript + build Vite;
- Prettier.

Workflow: `.github/workflows/quality.yml`.

## Tipos de testes atuais

### `src/App.test.tsx`

Testes comportamentais com Testing Library:

- login/cadastro;
- senha;
- navegação;
- carrinho;
- checkout;
- retirada;
- entrega;
- feirante;
- entregador;
- financeiro local;
- conta;
- edição;
- suporte;
- preferências.

### Domínio

- `orderBridge.test.ts`: multi-banca, peso, suporte/avaliação, isolamento.
- `marketplaceBridge.test.ts`: catálogo e promoções.
- `inventoryBridge.test.ts`: reserva/liberação/consumo.
- `localAuth.test.ts`: credenciais/alteração.
- `marketplace.test.ts`: regras puras.
- `session.test.ts`.
- `utils.test.ts`.

## O que “69 testes passando” significa

Confirma o comportamento coberto no ambiente jsdom.

Não confirma sozinho:

- funcionamento em navegador/dispositivo real;
- backend;
- RLS;
- pagamento;
- concorrência;
- rede ruim;
- acessibilidade completa;
- performance;
- segurança.

## Matriz mínima de regressão

### Cliente

- login correto/incorreto;
- criar conta;
- editar/descartar conta;
- adicionar/remover carrinho;
- estoque insuficiente;
- entrega/retirada indisponível;
- pagamento;
- cupom;
- carteira;
- troco;
- cancelamento;
- suporte pós-coleta;
- avaliação;
- comprar novamente.

### Feirante

- editar/cancelar banca;
- produto CRUD;
- estoque;
- horário;
- promoção;
- pedido;
- multi-banca;
- peso real;
- substituição;
- retirada;
- financeiro;
- documentos.

### Entregador

- documentos/aprovação;
- veículo;
- placa/capacidade;
- disponibilidade;
- filtros de corrida;
- corrida completa;
- persistência de etapa;
- incidente;
- suporte;
- avaliação;
- repasse.

## Testes que faltam para staging/produção

### Browser E2E

Adicionar Playwright/Cypress ou equivalente:

- Chrome;
- Android viewport;
- Safari/WebKit quando relevante;
- navegação real;
- upload;
- geolocation mocking;
- reload/retomada.

### Banco

Rodar migrations em banco descartável e testar:

- constraints;
- foreign keys;
- funções;
- RLS;
- rollback/forward migration.

### Concorrência

- dois clientes comprando último item;
- dupla aceitação de corrida;
- webhook duplicado;
- retry de checkout;
- dupla solicitação de saque.

### Integrações

Contract/integration tests para:

- PSP;
- rotas;
- KYC;
- Storage;
- notificações.

### Segurança

- acesso cruzado por papel;
- manipulação de preço;
- IDOR;
- upload malicioso;
- rate limit;
- secrets.

### Acessibilidade

- teclado;
- foco;
- labels;
- contraste;
- leitor de tela;
- reduced motion.

## Política de CI

PR para `main` deve executar:

```bash
npm ci
npm run check
npm run format:check
```

Não fazer merge com falha.

## Evidência de QA

Para release, registrar:

- commit;
- ambiente;
- data;
- suite executada;
- resultado;
- bugs conhecidos;
- migrations;
- integrações testadas.
