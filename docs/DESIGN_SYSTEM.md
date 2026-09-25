# Diretrizes de design — Feiraê

Este documento registra decisões de UX para preservar consistência durante refatorações.

## Princípios

- Mobile-first.
- Interface clara e amigável.
- Cards como principal porta de entrada para áreas e ações.
- Conteúdo importante abre em tela própria.
- Evitar sensação de painel administrativo genérico para usuários finais.
- Priorizar informações reais do fluxo em vez de blocos decorativos.

## Navegação

### Não usar como padrão
- menu vertical fixo à esquerda;
- conteúdo principal abrindo abaixo do item clicado;
- duas áreas densas lado a lado em telas pequenas;
- páginas genéricas compostas apenas por cards sem função real.

### Preferir
- entrada por cards;
- tela dedicada após clicar em entrar/abrir;
- navegação adequada a cada perfil;
- hierarquia clara e retorno previsível.

## Painéis e métricas

Quando existirem três métricas curtas relacionadas, podem aparecer lado a lado em um painel responsivo, por exemplo tempo de entrega, avaliação e indicador operacional.

Em mobile, devem continuar legíveis sem compressão excessiva.

## Cards

Um card deve ter título claro, informação principal, estado/status quando necessário, ação evidente e área de clique coerente.

Evitar cards que pareçam clicáveis sem ação.

## Cliente

Visual deve favorecer descoberta de feiras, lojas, produtos, carrinho e acompanhamento visual do pedido.

## Feirante

Telas devem refletir operação real: banca/box, produtos, estoque, pedidos, horários, receitas/custos e avaliações.

Evitar páginas genéricas sem conteúdo operacional.

## Entregador

Telas devem refletir disponibilidade, veículos, capacidade, oportunidades de corrida, rota, status, ganhos e avaliações.

## Formulários

- Mostrar erros perto do campo.
- Senhas devem possuir controle de mostrar/ocultar.
- Ações primárias precisam ser visualmente destacadas.
- Campos obrigatórios e opcionais devem ser distinguíveis.
- Não remover dados preenchidos quando ocorrer erro recuperável.

## Estados

Toda tela de dados deve prever carregando, vazio, erro, sucesso e sem permissão quando aplicável.

## Acessibilidade

- foco visível;
- navegação por teclado;
- rótulos em controles;
- contraste adequado;
- respeito a redução de movimento;
- áreas de toque adequadas no mobile.

## Regra para refatorações

Refatoração técnica não autoriza mudança visual. Mudanças de layout/UX devem entrar em tarefa ou PR separado.
