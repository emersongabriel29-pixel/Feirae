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
