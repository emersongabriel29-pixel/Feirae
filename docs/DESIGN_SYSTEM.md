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

1. Início;
2. Feiras;
3. Produtos;
4. Pedidos;
5. Perfil.

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

## Pagamentos — hierarquia de texto

Nos cards de métodos de pagamento, o nome do método deve ficar em uma linha própria e a explicação deve aparecer abaixo.

Exemplo visual:

```
Pix
QR Code e copia e cola são gerados no checkout.
```

Não colocar título e descrição corridos na mesma linha. A mesma regra vale para cartão, dinheiro e pagamento na entrega.

## Central operacional ao vivo

Feirante e entregador devem enxergar trabalho novo na própria Central, antes da grade de módulos.

- Feirante: pedidos novos/em andamento aparecem em uma área de prioridade com botão **Abrir pedido**.
- Entregador: corridas compatíveis aparecem no painel principal e a corrida ativa permanece destacada.
- Cards operacionais prioritários vêm antes dos atalhos secundários.
- Não obrigar o usuário a entrar em outra tela apenas para descobrir se há trabalho novo.

## Identidade de notificação Feiraê

O card de permissão e as notificações do sistema usam:

- marca/ícone `feirae-mark.svg`;
- nome **Feiraê** como emissor visual;
- título curto do evento abaixo da marca;
- texto operacional curto;
- ação de ativar notificações apenas quando a permissão ainda está em estado `default`.

Exemplos de título do sistema:

- `Feiraê • Novo pedido`;
- `Feiraê • Nova corrida`.

No mobile, o card de permissão empilha o botão abaixo do conteúdo para preservar leitura e alvo de toque.


## Login/cadastro — polimento da auditoria em vídeo

- erros de autenticação não permanecem ao trocar entre **Entrar** e **Criar conta**;
- trocar o tipo de acesso ou editar o e-mail também limpa o erro anterior;
- no mobile, **Criar conta** usa apresentação compacta para os campos aparecerem mais cedo;
- a mensagem de conflito de perfil deve dizer qual acesso já está vinculado ao e-mail.

## Onboarding operacional prioritário

Quando Feirante ou Entregador ainda não está aprovado, a Central mostra **Complete seu cadastro** antes dos atalhos secundários.

Feirante:

1. Conta;
2. Banca;
3. Documentos;
4. Aprovação.

Entregador:

1. Conta;
2. Veículo;
3. Documentos;
4. Aprovação.

A Central do Feirante não exibe mais um card redundante chamado **Painel**. No Entregador, a antiga área “Painel” passa a se chamar **Disponibilidade**, pois sua função real é ligar/pausar novas corridas.
