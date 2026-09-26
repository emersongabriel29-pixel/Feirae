# Testes e QA — Feiraê

Atualizado em 26/09/2026 com contagem e nomes reais da suite.

## 1. Pipeline atual

Arquivo:

`.github/workflows/quality.yml`.

Executa:

```bash
npm ci
npm run check
npm run format:check
```

`npm run check` executa:

```bash
npm run lint
npm run test
npm run build
```

## 2. Contagem atual

| Arquivo | Testes |
| --- | ---: |
| `src/App.test.tsx` | 43 |
| `src/domain/orderBridge.test.ts` | 4 |
| `src/domain/marketplaceBridge.test.ts` | 4 |
| `src/domain/inventoryBridge.test.ts` | 3 |
| `src/domain/localAuth.test.ts` | 4 |
| `src/domain/marketplace.test.ts` | 4 |
| `src/domain/session.test.ts` | 3 |
| `src/utils.test.ts` | 4 |
| **Total** | **69** |

## 3. Cobertura comprovada de App.test.tsx

Os 43 testes cobrem explicitamente:

### Cliente

- abrir catálogo;
- concluir checkout demo;
- identidade da conta;
- campos de conta;
- endereço estruturado;
- mostrar/ocultar senha;
- senha incorreta;
- alterar nome/e-mail/senha;
- cards compactos;
- feiras em área correta;
- filtro por região;
- detalhe de pedido;
- bancas da feira;
- impedir mistura entre feiras;
- busca sem acento;
- horários verificados;
- pagar agora/na entrega;
- formulário de cartão e CVV não persistido;
- motivos de cancelamento;
- notificações a partir de estados;
- avaliações;
- retirada completa;
- consentimento WhatsApp explícito;
- descarte de perfil inválido.

### Feirante

- abrir experiência;
- produto/estoque;
- conta separada da banca;
- pedido sequencial;
- cancelar edição da banca;
- editar banca;
- horário oficial/customizado;
- entrega/retirada/frete grátis;
- recebimento/taxas não configuradas;
- documento enviado entra em análise.

### Entregador

- abrir experiência;
- completar etapas de entrega;
- tipos/capacidade de veículo;
- conta com CPF/CNH;
- suporte com detalhe digitado;
- Pix/conta bancária;
- estados de repasse;
- aprovação documental;
- trocar perfil somente após logout.

## 4. Cobertura comprovada de domínio

### orderBridge

- multi-banca só libera após todas prontas;
- peso real propaga;
- suporte/avaliações ficam no mesmo pedido;
- histórico isolado por cliente.

### marketplaceBridge

- catálogo dinâmico substitui fixture;
- cupom válido e consumo;
- Compre X Leve Y;
- banca não aprovada fica oculta.

### inventoryBridge

- reservar/liberar;
- não liberar depois de consumir;
- rejeitar excesso de estoque.

### localAuth

- senha demo;
- criar conta e exigir senha;
- trocar e-mail/senha;
- remover senha antiga em texto.

## 5. O que os 69 testes NÃO comprovam diretamente

Não afirmar “CI cobre” estes itens sem adicionar teste específico:

- cancelamento pago → crédito/reembolso na carteira ponta a ponta;
- conteúdo binário/Data URL do documento persistido após reload;
- toggle de ofertas alterando a lista de notificações;
- consentimento WhatsApp persistido no `UnifiedOrder` após checkout;
- todos os quatro casos de opção indisponível no checkout;
- rota multi-banca com múltiplas paradas;
- cálculo de frete por distância/peso;
- status SQL/RLS;
- integração Supabase;
- pagamento real;
- KYC real.

## 6. E2E atual não é browser E2E

`App.test.tsx` usa Testing Library + jsdom.

Não há Playwright/Cypress.

Portanto não há evidência automatizada atual de:

- Chrome real;
- Android real;
- Safari/WebKit;
- permissão GPS real;
- upload real no browser;
- comportamento após refresh em browser real;
- navegação externa Google Maps.

## 7. Testes necessários antes de conectar Supabase

Criar suite de banco descartável para:

- migrations 0001/0002 + migrations novas;
- constraints;
- enum de estados;
- RLS por papel;
- Storage policies;
- RPCs;
- rollback/forward fix.

## 8. Casos de concorrência obrigatórios

- dois clientes no último item;
- duas bancas alterando o mesmo pedido;
- dois entregadores aceitando a mesma corrida;
- webhook duplicado;
- retry de pedido;
- estorno duplicado;
- payout duplicado.

## 9. Casos de segurança

- cliente acessando pedido de outro;
- feirante acessando banca alheia;
- entregador assumindo corrida atribuída;
- alteração de preço via devtools;
- alteração de status via API;
- upload executável mascarado;
- IDOR;
- service key no bundle.

## 10. Gaps de teste que devem virar testes antes de marcar “concluído”

Adicionar testes específicos para:

1. reembolso + carteira;
2. WhatsApp no pedido;
3. ofertas/notificações;
4. documento Data URL + limite;
5. opções disabled no checkout;
6. rejeição/cancelamento multi-banca;
7. promoção `horario` após implementação real;
8. promoção `combo` após implementação real;
9. múltiplas paradas após implementação;
10. migration/RLS.

## 11. Critério de release

Uma release deve registrar:

- commit;
- ambiente;
- migrations aplicadas;
- total de testes;
- browser E2E;
- integrações testadas;
- bugs conhecidos;
- rollback disponível.

O número 69 é referência do protótipo atual, não selo de produção.
