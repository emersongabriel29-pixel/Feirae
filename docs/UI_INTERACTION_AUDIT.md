# Auditoria de botões, campos e edição — Feiraê

Atualizado em 27/09/2026.

## Correções já aplicadas

### Login

- senha é verificada;
- senha errada mostra erro;
- criar conta cria credencial local;
- trocar e-mail/senha atualiza login local.

Teste direto:

- `rejects an incorrect password instead of ignoring it`;
- testes de `localAuth.test.ts`.

### Conta do cliente

- usa rascunho;
- Salvar persiste;
- Descartar reverte;
- nome/e-mail/senha atualizam identidade.

Teste direto:

`applies customer name email and password only when the account form is saved`.

### Banca

- editar usa draft;
- Salvar persiste;
- Cancelar descarta.

Testes:

- `can discard bank edits...`;
- `opens real bank editing...`.

### Checkout

Opções incompatíveis usam `disabled`:

- entrega;
- retirada;
- dinheiro na entrega;
- cartão na entrega.

Há cobertura de modalidades em testes, mas não há um teste nominal separado para cada estado disabled.

### Produto de banca fechada

Botão de adicionar recebe `disabled`.

### Cards compactos

Preferência altera classe:

```
html.compact-product-cards
```

Teste direto existente.

### Suporte do entregador

Detalhe digitado é usado no ticket local.

Protocolos persistem em:

`feirae:delivery-help:<email>`.

Teste direto existente.

### Documentos

Upload de:

- feirante;
- entregador;
- veículo.

usa `readFileForLocalStorage()`.

O arquivo não é só nome: Data URL é persistido.

## Upload — validação real atual

`storedFile.ts` faz:

- limite 1.500.000 bytes;
- FileReader;
- nome;
- `file.type`;
- tamanho;
- Data URL.

Não faz:

- magic bytes;
- validação do conteúdo;
- antivírus;
- PDF parsing.

O atributo `accept=".pdf,image/*"` da UI não é controle de segurança.

## Preferências com efeito

### Cards compactos

Efeito comprovado.

### Atualizações de pedido

Usado para badge/notificações.

### Ofertas

Afeta notificações promocionais locais.

Não há teste dedicado do toggle de ofertas.

### GPS

Controla solicitação/uso de localização no fluxo do cliente.

### WhatsApp

Consentimento é mostrado no checkout e enviado ao `confirmOrder()`.

Não há teste dedicado verificando o valor dentro de `UnifiedOrder`.

## Regras para novos controles

### Botão indisponível

Usar:

```tsx
disabled = { condicao };
```

Não:

```tsx
onClick={() => undefined}
```

### Formulário com Salvar

Obrigatório:

- estado draft;
- Salvar copia draft para persistido;
- Cancelar/Descartar restaura persistido.

### Upload

Só considerar “upload concluído” em produção quando o backend devolver referência válida.

Selecionar arquivo local não significa aprovação.

## Gaps de teste da auditoria

Ainda adicionar:

1. todos os métodos indisponíveis do checkout;
2. ofertas toggle;
3. WhatsApp dentro do pedido;
4. arquivo Data URL persistido após reload;
5. limite >1,5 MB;
6. erro de upload;
7. substituição de documento;
8. reembolso/carteira completo.

## Critério

Um controle só é “funcional” quando:

- ação executa;
- estado resultante é visível;
- persistência é a esperada;
- outra tela dependente recebe a alteração;
- teste existe para ação crítica.

## Auditoria de design/layout aplicada em 26/09/2026

Correções implementadas no código:

- tokens semânticos de superfície, sucesso, atenção, erro e informação;
- escala compartilhada de radius, shadow e alvo de toque;
- breakpoint grande alinhado em 1024 px;
- login mobile com bloco promocional reduzido;
- hero do cliente reduzido no mobile;
- contexto de feira/localização mantém texto visível em tela pequena;
- navegação primária Cliente alinhada em Início, Feiras, Produtos, Pedidos e Perfil;
- Feirante e Entregador entram direto na Central operacional;
- módulos operacionais agrupados sem menu lateral;
- `operation-card` deixou de forçar 420 px de altura;
- cards de pedido reorganizam em telas estreitas;
- card de produto mobile oculta metadados secundários;
- botões de adicionar/favoritar/estoque e chips interativos ganharam área de toque maior;
- pedidos possuem cor semântica por estado;
- documentos distinguem aprovado, em análise e correção;
- erros de formulário usam `.inline-error`;
- upload de foto do produto agora pode chegar ao catálogo via `marketplaceBridge.ts`;
- catálogo usa foto quando existe e emoji apenas como fallback;
- atalhos principais da Home usam iconografia Lucide.

Documento de regra visual:
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

### Limite desta auditoria

A suite atual usa jsdom. Portanto essas correções de layout ainda precisam de regressão visual em browser real para 320, 360, 390/412, 768, 1024, 1280 e 1440 px.

## Correções da auditoria em vídeo — 26/09/2026 17:35

Implementado nesta rodada:

- **Navegação:** adicionado Início com ícone de casa na barra móvel e destino também no menu desktop do cliente.
- **Cabeçalho:** busca em linha inteira acima de feira/localização; ferramentas de descoberta ocultas em Pedidos, Perfil, checkout e rastreamento.
- **Checkout:** entrega sem endereço mostra “A calcular”; frete não entra no total até existir endereço; retirada mantém frete zero.
- **Carrinho:** contador representa unidades e o botão de incremento é desativado no limite do estoque.
- **Rastreamento:** entrega concluída não exibe “0 min”; mostra rota, horário do evento de entrega e “Ajuda pós-entrega”.
- **Feiras:** textos administrativos “a configurar” deixaram a interface do cliente; configuração ausente é apresentada como indisponível no momento.

Já estava correto no vídeo e foi preservado:

- soma do peso do carrinho;
- ordenação de pedidos por data/hora;
- filtros de categoria;
- área “Feiras em destaque” dentro de Feiras.

A trava administrativa de ativação/publicação da feira depende do painel de gestão runtime, que ainda não está implementado; a regra obrigatória foi registrada em `ADMIN_MANAGEMENT_SPEC.md`.

## Polimento após vídeo — autenticação e onboarding

- alternar entre **Entrar** e **Criar conta** limpa mensagens de erro anteriores;
- trocar Cliente/Feirante/Entregador também limpa o erro anterior;
- editar o e-mail remove a mensagem antiga antes de nova tentativa;
- conflito de perfil informa qual tipo de acesso já pertence ao e-mail;
- cadastro mobile reduz a área promocional para trazer os campos para cima;
- Feirante com cadastro pendente recebe bloco prioritário **Complete seu cadastro para vender**;
- Entregador com cadastro pendente recebe bloco prioritário **Complete seu cadastro para entregar**;
- card **Painel** foi removido da Central do Feirante;
- no Entregador, **Painel** foi renomeado para **Disponibilidade**.

## Documentos — redesign premium

Feirante e Entregador não usam mais uma lista simples de documentos.

Checklist da tela:

- [x] logomarca Feiraê no cabeçalho;
- [x] mensagem de confiança/regularização;
- [x] status e progresso visíveis sem rolar;
- [x] contadores de termos e documentos;
- [x] ação rápida para pendências;
- [x] termos separados dos arquivos;
- [x] filtros por situação;
- [x] timeline por documento;
- [x] preview quando o arquivo local está disponível;
- [x] CTA explícito para enviar/atualizar;
- [x] card final de segurança/LGPD;
- [x] responsividade mobile.

## UI/UX Pro Max — revisão sincronizada em 27/09/2026

A revisão visual mais recente foi comparada novamente contra os componentes reais.

### Cliente

- Home usa composição vetorial da marca em vez de emoji estrutural;
- capas de feira usam ícone vetorial e marca Feiraê;
- categoria selecionada e favorito expõem `aria-pressed`;
- navegação móvel expõe `aria-current="page"`;
- Pedidos possui estado vazio explícito;
- ações de sacola e formulários possuem alvos de toque maiores;
- CTAs reorganizam em telas estreitas.

### Feirante

- banca aberta/fechada expõe estado pressionado;
- fallback visual da banca usa vetor;
- cards, métricas e listas operacionais usam hierarquia compartilhada;
- feedbacks importantes usam região de status acessível.

### Entregador

- disponibilidade expõe `aria-pressed`;
- filtros de ajuda expõem seleção;
- cards de corrida reorganizam ações no mobile;
- feedbacks de protocolo/conta usam status acessível.

### Acessibilidade transversal

- foco usa token `--fe-focus`;
- `scroll-padding-top` evita foco escondido sob header;
- `touch-action: manipulation` nos controles;
- `100dvh` em telas cheias;
- reduced motion continua obrigatório.

### Limite

Essa revisão continua sem prova de layout em browser real. Browser E2E/regressão visual permanece pendente.

## Correção da splash após vídeo — 27/09/2026

A inspeção da gravação em aparelho real identificou divergência entre o conceito aprovado e a primeira versão implementada.

Problemas observados:

- ilustração pequena demais;
- aparência de ícone/cartoon simples;
- pouca profundidade;
- movimento da entrega pouco destacado;
- transição para a marca curta demais.

Correção aplicada:

- cena ampliada para ocupar melhor o viewport;
- banca com mais detalhe e camadas;
- frutas/verduras com stagger;
- moto com entregador e rodas animadas;
- rota com glow;
- pin com bounce;
- fundo com profundidade;
- transição final mais próxima do conceito premium aprovado.

Acessibilidade e reduced motion foram preservados.

## Correção da splash contra a referência aprovada — 27/09/2026

A auditoria visual identificou que a splash implementada anteriormente estava funcional, porém era outra composição. Ela foi substituída pelos três quadros que correspondem à referência aprovada: banca em contorno → feira com moto → logo final.

Critérios de revisão visual em aparelho real:

- preencher a tela sem bordas ou recortes indesejados;
- manter banca, moto e logo legíveis em 360, 390 e 412 px;
- não exibir o antigo card quadrado de marca;
- não exibir legenda adicional após o logo;
- transições não podem piscar o conteúdo do app entre quadros.

## Regressão corrigida — splash estática

Foi identificada e removida uma regressão em que a abertura premium havia sido substituída por três SVGs estáticos em sequência.

A correção restaura a cena vetorial contínua e elimina os assets estáticos para reduzir o risco de repetição desse desvio.

## Mapa nativo Feiraê na tela de Feiras — 27/09/2026

A tela **Feiras** exibe, logo após os seletores de estado e cidade/região, um mapa construído dentro do próprio frontend do Feiraê.

Comportamento:

- os pontos respeitam o filtro de cidade/região;
- tocar em um pin abre diretamente a feira correspondente;
- o card inferior permite abrir a feira ou traçar rota;
- **Usar minha localização** reaproveita a permissão de GPS já existente no app;
- com GPS disponível, o mapa destaca o Cliente e mostra a feira mais próxima;
- a distância recebe `~` quando deriva do centro aproximado da Região Administrativa;
- o Google My Maps deixou de ser incorporado e permanece somente como referência externa opcional;
- Feira → **Ver bancas** → Banca → Produtos forma uma navegação explícita e contínua.

Acessibilidade e mobile:

- cada pin é um `button` com nome acessível e `aria-pressed`;
- o mapa possui rótulo próprio;
- o marcador de localização possui descrição acessível;
- CTAs mantêm área mínima de toque;
- mapa, legenda e card de seleção são responsivos;
- em telas estreitas, os CTAs principais ocupam a largura disponível;
- a camada visual não depende de gesto de arrastar ou zoom para acessar uma feira.

## Mapa Feiraê no acompanhamento — 28/09/2026

A mesma linguagem visual do mapa de Feiras foi aplicada ao acompanhamento do pedido.

### Cliente

- mapa aparece antes da timeline;
- origem identificada como feira;
- bancas aparecem como paradas numeradas;
- destino de entrega usa ícone **Casa do cliente**;
- moto aparece apenas após atribuição do entregador;
- GPS real recebe halo e texto de atualização;
- sem GPS, a interface informa que a posição é estimada pela etapa.

### Feirante

- mapa aparece no detalhe do pedido;
- a própria banca recebe destaque amarelo;
- o Feirante acompanha entregador indo à feira, coleta, saída e deslocamento ao cliente;
- a casa do cliente é mostrada como destino logístico, usando somente o endereço já pertencente ao pedido.

### Entregador

- mapa aparece na entrega em andamento;
- preserva o percurso interno Entrada → Bancas → Saída;
- mostra o destino **Casa do cliente**;
- oferece CTA para abrir o GPS externo até o endereço do cliente;
- localização contínua só é compartilhada durante corrida ativa e após o Entregador já ter habilitado GPS na configuração.

O componente compartilhado evita três experiências visuais diferentes para a mesma rota.

## Recuperação da informação dos produtos — 28/09/2026

Foi eliminado o padrão reduzido de produto nos destaques da tela inicial. Produtos destacados agora usam o mesmo card informativo do catálogo.

A grade foi ajustada para evitar que informações desapareçam por falta de largura:

- celular: 1 card por linha;
- telas médias: 2 cards;
- telas largas: até 3 cards.

O card prioriza leitura em blocos: identidade, promoção, serviço, dados do produto, disponibilidade e compra. A opção de cards compactos reduz espaçamento, mas não deve remover preço, estoque, peso, unidade, banca ou feira.

## Controle − quantidade + nos produtos — 28/09/2026

Foi adotado o padrão de comércio mobile em que o CTA inicial **+** se transforma em um stepper após a primeira adição.

Estados:

- **0 unidades:** botão verde **+**;
- **1 ou mais:** controle **− quantidade +**;
- **estoque máximo:** botão **+** do stepper desabilitado;
- **banca fechada:** incremento desabilitado, remoção preservada.

O contador fica no próprio card, ao lado do preço, evitando que o Cliente precise abrir a sacola para confirmar quantas unidades já adicionou.

## Padronização de marca — 28/09/2026

Revisão aplicada às superfícies institucionais:

- login deixa de montar um “ê” isolado + texto variável;
- cabeçalho usa o mesmo lockup canônico;
- fallback de splash usa o mesmo lockup;
- ícone legado `feirae-mark.svg` foi substituído pelo símbolo oficial;
- manifesto/favicon usam o símbolo oficial;
- página `/gestao/` usa a mesma identidade do app;
- tokens de cor foram sincronizados à paleta oficial.

Critério de regressão: nenhuma nova tela deve reconstruir “Feiraê” com texto/CSS quando o asset canônico puder ser usado.

## Ajustes de interação — 28/09/2026

### Produtos

- a grade mobile passa a usar **2 cards por linha**;
- o card vira um quadrado compacto com banca, nome, avaliação, prazo, frete, preço, pedido mínimo e stepper;
- peso logístico, volume, estoque detalhado e descrição deixam de competir com a decisão rápida de compra no card.

### Rotas

- **Mapa Feiraê** é a ação primária;
- Google Maps e Waze aparecem dentro do painel de rota como ações secundárias;
- Cliente, Feirante e Entregador usam a mesma hierarquia de navegação.

### Endereços

- **Usar minha localização atual** atualiza CEP, UF, cidade/região, bairro/setor, rua/quadra e, quando disponível, número;
- o usuário continua podendo revisar e completar dados que o GPS não consegue inferir com segurança.

### Sacola

- CTA principal: **Finalizar pedido**;
- pedido mínimo mostra sempre o valor configurado da banca;
- subtotal do carrinho não substitui o texto do mínimo; o estado de cumprimento aparece separadamente.

## GPS e seletores — 28/09/2026

### Endereço

Quando o ambiente não oferece geolocalização ou a permissão falha, o fluxo não termina em erro genérico. A interface orienta explicitamente:

> Não foi possível acessar sua localização neste ambiente. Você pode informar seu CEP ou preencher o endereço manualmente.

O formulário permanece disponível e nenhum campo manual é bloqueado.

### Estado / cidade / região

Os selects do Feiraê usam superfície clara, chevron verde, foco visível e estado desabilitado legível. O objetivo é evitar que o preview ou o navegador apresente um campo fechado visualmente incompatível com o restante do aplicativo.

Limite conhecido: alguns sistemas operacionais renderizam a lista aberta do `<select>` fora do controle CSS da aplicação. Nesses casos, a superfície fechada e os estados de interação continuam padronizados.

## Esqueci minha senha — 28/09/2026

Fluxo implementado na tela de entrada:

1. usuário toca **Esqueci minha senha**;
2. escolhe/confirma o tipo de acesso;
3. informa o e-mail;
4. cria a nova senha;
5. confirma a nova senha;
6. o protótipo valida conta/papel e atualiza o digest local;
7. a interface volta ao login com confirmação de sucesso;
8. o usuário entra manualmente com a nova senha.

Estados cobertos:

- senhas diferentes: bloqueio com mensagem clara;
- senha menor que 6 caracteres: rejeição pela validação da autenticação/HTML;
- e-mail inexistente: nenhuma conta local é criada silenciosamente;
- papel incorreto: recuperação é recusada;
- sucesso: não ocorre login automático.

O aviso do protótipo deixa explícito que produção deverá confirmar identidade por código ou link enviado ao e-mail.

## Categoria obrigatória ao criar produto — 28/09/2026

O fluxo **Feirante → Produtos → Adicionar produto** não deve mais iniciar silenciosamente em **Frutas**.

Comportamento esperado:

1. abrir **Adicionar produto**;
2. o campo **Categoria do produto** inicia em **Selecione uma categoria**;
3. o Feirante escolhe uma das categorias oficiais;
4. o formulário impede salvar sem categoria válida;
5. ao salvar, a categoria é persistida junto ao produto;
6. a sincronização Feirante → Cliente mantém a categoria para filtros e catálogo;
7. em edição, a categoria atual do produto vem pré-selecionada.

## Correção visual da marca no cabeçalho — 28/09/2026

Foi removido o wrapper visual que transformava a logomarca em um cartão creme no topo do aplicativo. O cabeçalho volta a apresentar a marca limpa, preservando o espaço original da navegação e evitando o quadrado vazio observado em ambientes que não carregam recursos externos dentro de SVG usado como imagem.

Nenhum fluxo de Home, produtos, mapa, carrinho, pedidos, autenticação, Feirante ou Entregador foi alterado nesta correção.

## Rodada de referência de marketplace — 28/09/2026

Os vídeos externos desta rodada são referência de comportamento, não de identidade visual. O Feiraê mantém marca, cores, tipografia, mapas e linguagem próprios.

### Página da banca

O resumo da banca deve apresentar o pedido mínimo como estado transacional:

- valor mínimo permanece fixo;
- subtotal atual da banca é mostrado separadamente;
- enquanto não atingir, informar **quanto falta**;
- ao atingir, trocar a mensagem por **✓ Atingido** sem transformar o mínimo em um valor progressivo;
- em compra multi-banca, cada banca conserva sua própria validação.

### Checkout multi-banca

Itens deixam de ser uma lista única quando há mais de uma banca. O padrão é:

1. cabeçalho da banca;
2. subtotal daquela banca;
3. estado do pedido mínimo;
4. itens daquela banca;
5. resumo geral do pedido permanece separado.

Essa hierarquia deve permitir que o Cliente entenda imediatamente qual banca está bloqueando a finalização.

### Pedidos e ajuda

Cards de pedido usam ação contextual:

- pedido ativo: **Acompanhar pedido**;
- pedido concluído/cancelado: **Ver detalhes**;
- **Preciso de ajuda** abre suporte já vinculado ao pedido;
- **Comprar novamente** permanece disponível quando aplicável.

O suporte vinculado mostra o identificador do pedido antes do chat e o protocolo criado conserva esse contexto.

### Responsividade

Em largura móvel, card de pedido e ações podem empilhar. Os grupos de banca do checkout preservam hierarquia e não devem gerar rolagem horizontal.

## Localização, feira mais próxima e carrinho — 28/09/2026

### Feira mais próxima

Quando o Cliente tem coordenadas reais, a ordenação usa a distância até os pontos cadastrados ou referências regionais das feiras. Quando o GPS não está disponível, a região conhecida — por exemplo **Planaltina, DF** — vira a referência de proximidade.

Regras:

1. feiras da região atual aparecem primeiro;
2. as demais seguem da mais próxima para a mais distante;
3. o atalho **Feiras próximas** abre a feira oficial mais próxima, não o primeiro registro estático;
4. a seleção automática da feira acompanha mudança real de localização, mas não deve ficar sobrescrevendo a escolha manual do Cliente;
5. feiras sem coordenada própria continuam usando a referência regional aproximada e a rota final usa o endereço cadastrado.

### Limpar carrinho

A sacola não usa mais **Comprar novamente** como ação de topo. Histórico e repetição de compra permanecem em **Pedidos**.

Na sacola existe **Limpar carrinho**:

- ação destrutiva secundária;
- pede confirmação;
- remove todos os itens;
- mantém a sacola aberta e mostra o estado vazio.

### Pedido mínimo

O valor mínimo pertence à configuração da banca:

- **sem valor configurado** = sem mínimo;
- **valor configurado pelo Feirante** = usar exatamente esse valor;
- a página da banca é o lugar principal para comunicar o mínimo e o progresso;
- o carrinho não repete cartão/resumo de mínimo quando está tudo válido;
- somente quando uma banca está abaixo do valor exigido, o carrinho mostra um erro objetivo com banca, valor faltante e mínimo;
- **Finalizar pedido** permanece bloqueado enquanto existir ao menos uma banca abaixo do mínimo.

## Entrada premium antes da autenticação — 28/09/2026

A abertura do Feiraê passa a separar **marca/primeira impressão** de **autenticação operacional**.

Fluxo:

1. ao chegar sem sessão, o usuário vê uma tela de entrada em tela cheia;
2. a tela usa somente a identidade oficial do Feiraê e uma ilustração própria de feira, sem copiar a interface interna;
3. os três benefícios resumem a proposta: **Produtos frescos**, **Entrega rápida** e **Compra confiável**;
4. existem somente dois CTAs principais: **Entrar** e **Criar conta**;
5. **Entrar** abre o fluxo existente de autenticação;
6. **Criar conta** abre diretamente o fluxo existente de cadastro;
7. a autenticação mantém escolha Cliente/Feirante/Entregador, recuperação de senha, termos e validações já implementados;
8. **Voltar à abertura** retorna à capa sem perder a identidade do app;
9. logout retorna à entrada premium antes de permitir nova escolha de perfil.

A tela premium é deliberadamente restrita à porta de entrada. Home, Feiras, Produtos, Pedidos, Perfil, Feirante e Entregador mantêm a linguagem operacional já aprovada.

## Revisão de UX — 28/09/2026: simplificação após auditoria móvel

A revisão por capturas reais de Android gerou as seguintes correções no Cliente:

- o hero da Home preserva a identidade verde do Feiraê, mas ficou mais compacto e com uma única ação principal;
- o contexto do cabeçalho separa **feira selecionada** de **localização do aparelho**, evitando combinações incorretas como feira do Plano Piloto com legenda “Planaltina, DF”;
- o botão **Voltar** continua no topo esquerdo, porém sem o grande bloco branco. O histórico do navegador já usa `pushState/popstate`, portanto o botão/gesto nativo de voltar continua funcional;
- o pedido mínimo no checkout virou uma faixa compacta por banca e ganha ênfase apenas quando bloqueia a compra;
- o resumo financeiro mostra uma única linha **Entrega** ao Cliente; frete-base e composição permanecem dados de cálculo, não cobranças duplicadas;
- consentimento de WhatsApp não aparece no resumo financeiro;
- o stepper `− quantidade +` recebeu dimensões menores para não cortar o botão direito em grid móvel de duas colunas;
- abrir uma feira agora inicia por um **perfil da feira** com capa, marca, local, horário, avaliação, entrega e ações, antes do catálogo;
- mapas decorativos foram removidos dos fluxos revisados. Quando não há coordenada/GPS suficiente, a interface informa a limitação em vez de inventar posição ou percurso.

QA visual ainda obrigatório em 360, 390 e 412 px, especialmente para stepper, checkout, perfil da feira, mapa e teclado virtual.

## Correção do seletor de quantidade em grid móvel — 29/09/2026

Captura real em Android mostrou que o controle `− 1 +` ainda podia cortar o botão direito em cards de produto de duas colunas.

A correção final no mobile (`<= 640px`) faz o bloco de compra do card selecionado usar duas linhas: preço primeiro e seletor de quantidade abaixo, ocupando a largura disponível. O seletor passa a usar três colunas iguais e não depende mais do espaço restante ao lado do preço.

Critério visual: os três elementos **− | quantidade | +** devem permanecer integralmente visíveis em 360, 390 e 412 px.
