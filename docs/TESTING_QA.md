# Testes e QA — Feiraê

Atualizado em 27/09/2026 com contagem e nomes reais da suite.

## 1. Pipeline atual

Arquivo:

`.github/workflows/quality.yml`.

Executa:

```bash
npm ci
npm run check
npm run check:sync   # somente em pull_request, com BASE_SHA/HEAD_SHA
npm run format:check
```

`check:sync` não mede cobertura. Ele aplica a matriz semântica de `scripts/change-sync-policy.mjs`: mudanças de comportamento em `src/` exigem teste, testes exigem `TESTING_QA.md` e domínios como UI/UX, migrations, splash/som, pedidos e notificações exigem seus documentos específicos.

`npm run check` executa:

```bash
npm run lint
npm run test
npm run test:sync-policy
npm run build
```

## 2. Contagem atual

| Arquivo                                    |  Testes |
| ------------------------------------------ | ------: |
| `src/App.test.tsx`                         |      58 |
| `src/components/LaunchExperience.test.tsx` |       3 |
| `src/domain/orderBridge.test.ts`           |      11 |
| `src/domain/feiraeNotifications.test.ts`   |       6 |
| `src/domain/legalTerms.test.ts`            |       8 |
| `src/domain/customerLegal.test.ts`         |       4 |
| `src/domain/marketplaceBridge.test.ts`     |       5 |
| `src/domain/multiVendor.test.ts`           |      11 |
| `src/domain/fairInternalRouting.test.ts`   |       4 |
| `src/domain/inventoryBridge.test.ts`       |       4 |
| `src/domain/localAuth.test.ts`             |       4 |
| `src/domain/marketplace.test.ts`           |       4 |
| `src/domain/session.test.ts`               |       3 |
| `src/utils.test.ts`                        |       4 |
| **Total Vitest**                           | **129** |

Além da suíte Vitest, `npm run check` executa **8 testes Node** da política de sincronização em `scripts/change-sync-policy-checks.mjs`. Eles validam as regras automáticas que obrigam documentação específica para UI/UX, migrations, testes, splash/som, pedidos e notificações.

## 3. Cobertura comprovada de App.test.tsx

Os 58 testes cobrem explicitamente:

### Cliente

- abrir catálogo e acessar Início pela navegação principal;
- bloquear checkout quando uma banca não atinge o próprio mínimo e liberar ao atingir;
- exibir o pedido mínimo configurado ao abrir uma banca;
- permitir ao Feirante desativar o mínimo ou configurar outro valor;
- concluir checkout demo;
- não incluir frete no total antes de existir endereço de entrega;
- ocultar ferramentas de busca/localização fora das telas de descoberta;
- desabilitar incremento do carrinho no limite do estoque e contar unidades;
- identidade da conta;
- campos de conta;
- endereço estruturado;
- mostrar/ocultar senha;
- senha incorreta;
- limpar erro antigo ao trocar Entrar/Criar conta, perfil de acesso ou editar o e-mail;
- bloquear criação de Cliente sem Termos de Uso + Aviso de Privacidade;
- registrar aceite versionado e manter ofertas como opção separada;
- alterar nome/e-mail/senha;
- cards compactos;
- feiras em área correta;
- filtro por região;
- detalhe de pedido e apresentação pós-entrega sem ETA zero;
- bancas da feira;
- impedir mistura entre feiras;
- busca sem acento;
- horários verificados;
- pagar agora/na entrega;
- formulário de cartão e CVV não persistido;
- motivos de cancelamento;
- notificações a partir de estados;
- card de ativação das notificações Feiraê;
- etapa “Avisar chegada” antes da confirmação da entrega;
- avaliações;
- retirada completa;
- consentimento WhatsApp explícito;
- descarte de perfil inválido.

### Feirante

- abrir experiência;
- remover o atalho redundante “Painel” da Central;
- priorizar “Complete seu cadastro” quando a aprovação está pendente;
- mostrar pedidos novos/em andamento diretamente no painel principal;
- exibir card de notificações Feiraê;
- produto/estoque;
- conta separada da banca;
- pedido sequencial;
- cancelar edição da banca;
- editar banca;
- horário oficial/customizado;
- entrega/retirada/frete grátis;
- recebimento/taxas não configuradas;
- documento enviado entra em análise;
- termos jurídicos e aviso LGPD aparecem dentro de Documentos;
- conta real sem storage de documentos não recebe aprovação seed.

### Entregador

- abrir experiência;
- renomear o antigo “Painel” para “Disponibilidade”;
- priorizar “Complete seu cadastro” quando a aprovação está pendente;
- mostrar corridas compatíveis diretamente no painel principal;
- exibir card de notificações Feiraê;
- completar etapas de entrega;
- tipos/capacidade de veículo;
- conta com CPF/CNH;
- suporte com detalhe digitado;
- Pix/conta bancária;
- estados de repasse;
- aprovação documental;
- conta nova fica com termos jurídicos pendentes até assinar as versões vigentes;
- conta real recém-criada não recebe corridas fixture;
- lock de corrida cancelada externamente é liberado;
- trocar perfil somente após logout.

## 4. Cobertura comprovada de domínio

### feiraeNotifications

- Cliente recebe linguagem própria para pedido feito, preparação, saída, aproximação e entrega;
- promoção do catálogo gera mensagem própria para Cliente;
- Feirante recebe linguagem de novo pedido, pagamento e coleta;
- Entregador recebe linguagem de rota, coleta e conclusão;
- evento irrelevante para um papel é ignorado.

### customerLegal

- Termos de Uso e Aviso de Privacidade são documentos separados;
- Aviso distingue execução de contrato, legítimo interesse e consentimento;
- consentimento genérico é rejeitado;
- Termos preservam direitos do consumidor e referência ao Decreto nº 7.962/2013;
- aceite de cadastro é versionado e persistido com fingerprint local.

### legalTerms

- termo do Feirante contém verdade, CDC, responsabilidade, ética e segurança sanitária;
- termo do Entregador contém autonomia real, ausência de exclusividade e salvaguarda contra cláusula fictícia de não vínculo;
- regras atuais de moto-frete e referência à Resolução Contran nº 1.020/2025;
- aviso LGPD separa ciência, bases legais e consentimentos opcionais;
- assinatura exige versão vigente;
- aceites são isolados por papel;
- fingerprint muda quando o termo muda;
- Feirante e Entregador exigem termo próprio + aviso de privacidade.

### orderBridge

- multi-banca só libera após todas prontas;
- retirada multi-banca só conclui após todas as bancas confirmarem;
- peso real propaga;
- suporte/avaliações ficam no mesmo pedido;
- histórico isolado por cliente.

### fairInternalRouting

- otimiza bancas mapeadas a partir da entrada;
- soma retorno para a saída de referência;
- usa fallback por setor/corredor/box quando não há X/Y;
- valida código e payload de confirmação de coleta.

### marketplaceBridge

- catálogo dinâmico substitui fixture;
- cupom válido e consumo;
- Compre X Leve Y;
- banca não aprovada fica oculta;
- posição interna e código de coleta são sincronizados;
- pedido mínimo configurado é publicado na banca;
- desconto de promoção é separado por banca para a validação do mínimo.

### multiVendor

- fallback de R$ 30,00 para banca sem configuração explícita;
- mínimo diferente por banca;
- R$ 0,00 como ausência de mínimo;
- desconto financiado pela banca reduz o valor elegível;
- normalização e teto atual de R$ 100,00;
- checkout libera somente quando todas as bancas atingem os próprios mínimos;
- limite de quatro bancas e regra de uma feira por sacola;
- cálculo do adicional de coleta e rateio promocional existente.

### inventoryBridge

- reservar/liberar;
- liberar apenas os itens de uma banca cancelada;
- não liberar depois de consumir;
- rejeitar excesso de estoque.

### localAuth

- senha demo;
- criar conta e exigir senha;
- trocar e-mail/senha;
- remover senha antiga em texto.

## 5. O que os 129 testes Vitest NÃO comprovam diretamente

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
- KYC real;
- notificação Web Push remota com o app totalmente fechado e backend real.

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

- migrations 0001/0002/0003 + migrations futuras;
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

O número 74 é referência do protótipo atual, não selo de produção.

## 12. QA visual após auditoria de design

A auditoria de 26/09/2026 alterou layout e navegação sem adicionar framework de browser E2E.

Cobertura funcional foi ajustada para a entrada direta de Feirante/Entregador nas Centrais.

Ainda não há prova automatizada de regressão visual para:

- 320 px;
- 360 px;
- 390/412 px;
- 768 px;
- 1024 px;
- 1280 px;
- 1440 px;
- foto de produto com diferentes proporções;
- quebra de KPI com textos longos;
- drawer/carrinho com teclado virtual;
- contraste calculado por ferramenta automatizada.

Antes de produção, adicionar Playwright (ou equivalente) com screenshots das telas-chave e comparação visual.

## 11. Sincronização mestre — 27/09/2026

Após a revisão do repositório completo:

- Vitest: **129/129**;
- arquivos de teste Vitest: **14/14**;
- política de sincronização: **8/8** testes Node;
- lint: obrigatório no `npm run check`;
- build TypeScript/Vite: obrigatório no `npm run check`;
- Prettier: obrigatório no workflow Quality;
- `check:sync`: executado em pull requests com regras semânticas por domínio.

A política automática não substitui browser E2E, migration tests, RLS tests, concorrência ou regressão visual.

## QA da splash premium — 27/09/2026

`LaunchExperience.test.tsx` continua com 3 testes e agora também verifica a presença estrutural de:

- contorno da banca;
- moto/entregador;
- pin de localização;
- novos tempos full (~3,3 s) e quick (~1,55 s).

Limite mantido: jsdom não prova qualidade visual da animação. A gravação em aparelho real deve continuar sendo usada como validação visual até existir Playwright/regressão por screenshot.

## QA da splash conforme referência aprovada — 27/09/2026

Os 3 testes de `LaunchExperience.test.tsx` passaram a validar os ativos específicos da sequência aprovada:

- `/launch/feirae-splash-start.svg`;
- `/launch/feirae-splash-market.svg`;
- `/launch/feirae-splash-logo.svg`;
- duração full de 3,3 s;
- duração quick de 1,55 s;
- quadro final presente no reduced motion.

O teste estrutural evita que a splash volte silenciosamente para a composição anterior. A fidelidade visual final continua exigindo conferência em viewport móvel/aparelho real, pois jsdom não faz regressão por pixel.

## Proteção contra regressão da splash estática

O teste de `LaunchExperience` valida a presença estrutural da banca, moto e pin na cena contínua. Os antigos SVGs estáticos de `public/launch/` foram removidos e não fazem mais parte da implementação.

## Mapa interativo das feiras do DF — 27/09/2026

- `src/features/customer/FairMapPanel.test.tsx` cobre o carregamento sob demanda do Google My Maps.
- O teste confirma que o `iframe` não é criado antes da ação do usuário, reduzindo carregamento externo desnecessário.
- Também valida URL do mapa incorporado, `loading="lazy"`, estado acessível `aria-expanded` e acesso ao mapa completo em nova aba.
