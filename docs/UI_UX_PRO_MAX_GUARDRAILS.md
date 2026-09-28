# UI/UX Pro Max — guardrails do Feiraê

## Objetivo

Usar a base **UI/UX Pro Max v2.15.0** como apoio para elevar acabamento, acessibilidade e consistência do Feiraê sem redesenhar o produto nem apagar decisões já tomadas.

## Decisões que devem ser preservadas

- identidade principal verde/branca do Feiraê;
- marca, linguagem visual e slogan já definidos;
- fluxos distintos para Cliente, Feirante e Entregador;
- multi-banca e pedido mínimo por banca;
- notificações por papel e por etapa do pedido;
- documentos, termos e consentimentos já definidos;
- lógica de entrega, rotas, avaliações e financeiro existente;
- splash animada e identidade sonora;
- estrutura de navegação, telas e regras de negócio já implementadas.

O UI/UX Pro Max **não autoriza** remover recursos, alterar regra de negócio, renomear fluxos consolidados ou substituir a identidade por um template genérico.

## Primeira passada aplicada

### 1. Identidade visual

A ilustração decorativa principal da Home foi alterada de emojis estruturais para elementos vetoriais já compatíveis com o projeto:

- banca/loja;
- entrega por bicicleta/moto;
- localização;
- marca Feiraê no centro;
- indicação visual de rota.

A composição continua comunicando feira + proximidade + entrega, agora com linguagem mais consistente com o restante do app.

### 2. Acessibilidade

- foco de teclado com indicador mais forte e de alto contraste;
- `scroll-padding-top` para reduzir risco de foco/conteúdo oculto pelo header fixo;
- alvos de toque alinhados ao token `--fe-touch`;
- `touch-action: manipulation` nos controles;
- manutenção de `prefers-reduced-motion` já existente;
- manutenção do skip link já existente.

### 3. Legibilidade mobile

Foram aumentados de forma conservadora textos secundários importantes no login, cadastro e cabeçalho móvel, sem ampliar títulos ou alterar densidade das telas operacionais.

Também foi adotado `100dvh` em áreas de tela cheia para comportamento mais estável nos navegadores móveis atuais.

## Regras para próximas melhorias

1. Priorizar correções de **alto impacto e baixo risco** antes de mudanças estéticas maiores.
2. Não alterar uma tela apenas porque outra tendência visual parece mais moderna.
3. Reutilizar tokens, componentes e padrões existentes antes de criar novos.
4. Manter navegação e posição relativa de ações importantes entre telas.
5. Garantir estados de foco, hover, pressed, disabled, loading, sucesso e erro quando aplicável.
6. Evitar emojis como ícones estruturais; conteúdo ilustrativo de produtos pode manter fallback existente enquanto não houver imagem real.
7. Preservar texto realista e dados de fluxo; não substituir conteúdo por placeholders genéricos.
8. Testar mobile primeiro e validar larguras de 320, 375, 414, 768, 1024 e desktop.
9. Respeitar `prefers-reduced-motion` em qualquer animação nova.
10. Qualquer alteração de regra de negócio precisa ser tratada como mudança funcional separada da revisão de UI/UX.

## Próximas prioridades recomendadas

- revisar densidade e hierarquia das telas de Feirante e Entregador;
- padronizar estados vazios, erro, carregamento e sucesso;
- revisar formulários longos e mensagens de validação;
- revisar consistência de cards e botões secundários;
- validar contraste e legibilidade de microtextos restantes;
- revisar comportamento de drawers/modais e foco ao abrir/fechar;
- validar a experiência em telas pequenas e orientação horizontal.

## Referência local

- Prompt: `.github/prompts/ui-ux-pro-max.prompt.md`
- Versão: `.github/prompts/ui-ux-pro-max/VERSION`
- React: `.github/prompts/ui-ux-pro-max/data/stacks/react.csv`
- Tailwind/web: `.github/prompts/ui-ux-pro-max/data/stacks/html-tailwind.csv`
- UX: `.github/prompts/ui-ux-pro-max/data/ux-guidelines.csv`

## Revisão tela por tela — segunda passada

### Cliente

- Home: ilustração vetorial alinhada à marca, sem emoji estrutural.
- Feiras: capa visual com ícone vetorial e marca Feiraê; horário mais legível.
- Catálogo: categoria selecionada exposta com `aria-pressed`.
- Favoritos: estado pressionado exposto aos leitores de tela.
- Pedidos: estado vazio real quando não há pedidos.
- Perfil e pagamentos: microtextos e ações com melhor legibilidade/tamanho de toque.
- Navegação móvel: item atual exposto com `aria-current="page"` e destaque visual consistente.
- Sacola: fechar, remover e alterar quantidade usam alvo de toque maior; rolagem fica contida no drawer.

### Feirante

- Central: hierarquia de resumo, métricas, pedidos ao vivo e módulos foi padronizada.
- Minha banca: fallback visual usa ícone vetorial; estado aberto/fechado usa `aria-pressed`.
- Produtos/estoque/pedidos: ações pequenas receberam alvo de toque consistente.
- Financeiro, avaliações e documentos: microtextos operacionais ficaram mais legíveis sem alterar cálculos ou fluxos.
- Feedbacks de sucesso relevantes usam região de status acessível.

### Entregador

- Corridas: cards ganharam hierarquia mais clara para rota, peso, veículo, ganho e ação.
- Disponibilidade: ligar/desligar expõe estado com `aria-pressed`.
- Veículos, financeiro e ajuda: textos, botões e ações seguem a mesma escala visual da operação do feirante.
- Filtros de ajuda selecionados expõem estado pressionado.
- Feedbacks de protocolo, conta e alertas usam status acessível.

### Responsividade

Em telas pequenas:

- CTAs principais da Home ocupam a largura disponível quando necessário;
- listas operacionais podem quebrar linha sem esmagar conteúdo;
- ações de pedido/corrida passam a ter mais espaço;
- formulários de pagamento reorganizam o botão em linha própria;
- grupos de ações ficam empilhados quando a largura é insuficiente;
- onboarding/documentos continuam usando os breakpoints já existentes.

## Critério de aceitação desta revisão

A revisão só pode ser considerada pronta quando:

- lint passar;
- testes automatizados passarem;
- build de produção passar;
- sincronização entre código, testes e documentação passar;
- Prettier passar;
- nenhuma mudança de regra de negócio for introduzida como efeito colateral de UI/UX.

## Brand lock oficial — 28/09/2026

A partir desta revisão, o UI/UX Pro Max opera sob a identidade definida em `BRAND_IDENTITY.md`.

- não redesenhar o wordmark;
- não alterar o ê;
- não trocar toldo/folhas;
- não criar paleta alternativa;
- reutilizar `FeiraeBrand` no React;
- usar `/brand/feirae-logo-horizontal.svg` na gestão e superfícies estáticas;
- priorizar tokens do Feiraê antes de qualquer sugestão de tendência visual.

A ordem de decisão é: **marca Feiraê → regras do produto → design system → UI/UX Pro Max**.
