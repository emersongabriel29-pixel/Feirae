# Design system e layout — Feiraê

Atualizado em 26/09/2026 após auditoria visual e de responsividade.

## Objetivo

Este documento registra as regras visuais que devem acompanhar qualquer evolução do Feiraê. Mudanças de tela, fluxo ou componente devem manter estas regras e atualizar este documento quando alterarem o padrão.

## Identidade preservada

- verde principal `--fe-green`;
- verde escuro `--fe-green-dark`;
- amarelo `--fe-amber`;
- fundo claro `--fe-bg`;
- linguagem de cards arredondados;
- navegação por cards para Feirante e Entregador;
- sem menu vertical lateral.

## Tokens atuais

Arquivo: `src/styles/tokens.css`.

### Semântica

- superfície: `--fe-surface`;
- superfície secundária: `--fe-surface-soft`;
- sucesso: `--fe-success` / `--fe-success-soft`;
- atenção: `--fe-warning` / `--fe-warning-soft`;
- erro: `--fe-danger` / `--fe-danger-soft`;
- informação/em andamento: `--fe-info` / `--fe-info-soft`.

### Radius

- pequeno: `--fe-radius-sm`;
- médio: `--fe-radius-md`;
- grande: `--fe-radius-lg`;
- extra grande: `--fe-radius-xl`.

### Elevação

- `--fe-shadow-sm`;
- `--fe-shadow-card`;
- `--fe-shadow-raised`.

### Toque

`--fe-touch: 2.75rem` é o mínimo atual de referência para ações principais/recorrentes.

## Navegação

### Cliente

A marca continua levando ao início.

Navegação primária em desktop e mobile:

1. Feiras;
2. Produtos;
3. Pedidos;
4. Perfil.

No mobile a barra inferior é fixa.

### Feirante

O login entra diretamente em `Operação do feirante`.

A Central agrupa cards em:

- Agora;
- Operação;
- Financeiro e desempenho;
- Conta e suporte.

Não há tela intermediária “Painel → abrir central”.

### Entregador

O login entra diretamente em `Central do entregador`.

Os cards usam os mesmos grupos visuais:

- Agora;
- Operação;
- Financeiro e desempenho;
- Conta e suporte.

## Responsividade

Breakpoints customizados principais devem acompanhar a escala usada no Tailwind.

A transição de layout grande foi alinhada para 1024 px.

Validar obrigatoriamente:

- 320 px;
- 360 px;
- 390/412 px;
- 768 px;
- 1024 px;
- 1280 px;
- 1440 px.

### Mobile

- hero reduzido;
- login promocional reduzido;
- contexto da feira mantém texto visível;
- pedido empilha conteúdo abaixo de 480 px;
- checkout pode cair para uma coluna em largura extrema;
- card de produto remove metadados secundários abaixo de 480 px;
- alvos de toque foram aumentados.

## Catálogo

`Product.imageDataUrl` é opcional.

Produtos cadastrados pelo feirante podem publicar `photoDataUrl` no marketplace local através de `marketplaceBridge.ts`.

Renderização:

1. usa foto cadastrada quando existe;
2. usa emoji somente como fallback.

A foto usa `object-fit: cover`.

## Estados semânticos

Pedidos:

- entregue → sucesso;
- cancelado → erro;
- recebido → atenção;
- preparando/coleta/em rota → informação.

Documentos:

- aprovado → sucesso;
- em análise → atenção;
- correção necessária → erro;
- pendente → neutro.

Erros de formulário usam `.inline-error`, não `.operation-footnote`.

Ações destrutivas devem usar linguagem visual própria; `.danger-action` é o componente CSS base.

## Densidade

Métricas de topo devem usar valor curto + legenda curta.

Evitar textos longos dentro de três KPIs lado a lado.

No catálogo mobile, a primeira camada deve priorizar:

- imagem;
- produto;
- banca;
- preço/unidade;
- ação.

Frete, peso, volume e outros metadados podem ser reduzidos/ocultados na primeira camada mobile.

## Imagens

Prioridade de uso:

1. foto real;
2. imagem cadastrada;
3. ícone Lucide;
4. emoji somente como fallback.

Não adicionar novos emojis de navegação quando houver ícone equivalente.

## Acessibilidade

Manter:

- `:focus-visible`;
- skip link;
- `prefers-reduced-motion`;
- labels de formulário;
- `aria-label` em ações somente por ícone;
- texto + ícone para status críticos.

Não reduzir texto funcional para tamanhos muito pequenos apenas para “caber”.

## QA visual ainda necessário

A suite atual é jsdom e não prova layout real.

Antes de produção adicionar:

- Playwright ou equivalente;
- screenshots em 320/360/390/768/1024/1280;
- regressão visual do login;
- catálogo;
- checkout;
- pedidos;
- Central do feirante;
- Central do entregador.

## Regra de atualização

Toda mudança de:

- navegação;
- card;
- status;
- breakpoint;
- imagem;
- formulário;
- componente compartilhado;
- padrão de cor/spacing/radius;

deve atualizar este documento e os testes correspondentes quando houver mudança funcional.


## Ajustes móveis da auditoria em vídeo — 26/09/2026

### Navegação inferior

Ordem canônica do cliente:

1. **Início** — ícone de casa;
2. **Feiras**;
3. **Produtos**;
4. **Pedidos**;
5. **Perfil**.

A navegação usa cinco colunas iguais no mobile.

### Cabeçalho de descoberta

- busca sempre ocupa a primeira linha inteira;
- feira/localização ficam abaixo da busca, nunca lado a lado com ela;
- no mobile, o resumo de feira/localização ocupa 100% da largura e expande os controles de contexto;
- busca e localização são ferramentas de descoberta e não aparecem em Pedidos, Perfil, checkout, rastreamento ou telas operacionais.

### Estados de estoque

Ao atingir o limite de estoque, o controle `+` do carrinho deve ficar visual e semanticamente desabilitado, com texto “Limite de estoque atingido”.
