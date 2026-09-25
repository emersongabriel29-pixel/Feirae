# Sistema de design do Feiraê

## Princípios

O Feiraê deve parecer:
- simples;
- confiável;
- acolhedor;
- local;
- moderno;
- fácil de usar no celular.

A interface não deve parecer um painel administrativo genérico.

## Navegação

Decisões registradas:
- não usar menu vertical fixo à esquerda como padrão das experiências públicas;
- não abrir seções importantes apenas “embaixo” da tela atual;
- cards de navegação devem abrir uma tela/área clara;
- evitar excesso de conteúdo lado a lado em telas estreitas;
- priorizar navegação mobile-first.

## Cards

Cards devem:
- ter hierarquia visual clara;
- mostrar informação suficiente sem parecer tabela;
- possuir área clicável evidente;
- manter espaçamento consistente;
- evitar dezenas de ações concorrentes.

Cards de feira podem mostrar:
- nome;
- local;
- status;
- avaliação;
- prazo estimado;
- taxa;
- distância quando disponível.

## Painéis de métricas

Informações curtas e relacionadas podem aparecer lado a lado, por exemplo:
- tempo de entrega;
- avaliação;
- taxa ou outra métrica principal.

No mobile, devem continuar legíveis e podem quebrar responsivamente quando necessário.

## Formulários

Formulários devem:
- ter labels;
- validar antes do envio;
- indicar erro no campo;
- usar mensagens claras;
- oferecer mostrar/ocultar senha;
- diferenciar campo obrigatório de opcional;
- evitar telas longas quando etapas fizerem mais sentido.

## Estados

Todo componente de dados deve prever:
- loading;
- vazio;
- erro;
- sucesso;
- indisponível;
- desabilitado.

## Feedback

Ações importantes precisam de feedback:
- produto adicionado;
- alteração salva;
- pedido confirmado;
- corrida aceita;
- cancelamento registrado.

Evitar feedback que desapareça rápido demais ou sem contexto.

## Acessibilidade

- contraste suficiente;
- foco visível;
- navegação por teclado;
- labels para ícones;
- áreas de toque confortáveis;
- não depender apenas de cor;
- respeitar `prefers-reduced-motion`.

## Responsividade

Prioridade:
1. celular real;
2. tablet;
3. desktop.

Visualizar o site em um navegador desktop estreito não substitui testes reais em mobile.

## Identidade

“Feiraê” é a marca exibida ao usuário.

O nome técnico do repositório pode permanecer `Feirae`, mas textos visíveis devem manter a marca de forma consistente.

## Preservação visual durante refatorações

Refatoração estrutural não é redesign.

Ao mover componentes:
- preservar classes ou comportamento visual;
- comparar telas antes/depois;
- corrigir regressões antes de avançar;
- mudanças de UX devem ficar em PR separado quando possível.
