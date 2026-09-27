# Especificação funcional consolidada — Feiraê

Atualizado em 27/09/2026 após nova auditoria contra o código atual.

## 1. Regra central

Uma compra deve manter o mesmo identificador do checkout à conclusão.

Fluxo atual do protótipo:

```
Feira
→ Banca
→ Produto
→ Carrinho
→ Endereço ou retirada
→ Pagamento local
→ Pedido unificado
→ Banca prepara
→ Pronto para coleta
→ Entregador aceita ou cliente retira
→ Coleta/retirada
→ Entrega/conclusão
→ Avaliações
→ Recebível local
```

Fonte do pedido compartilhado: `src/domain/orderBridge.ts`.

## 2. O que existe de verdade hoje

### Cliente

Implementado em `src/features/customer/CustomerScreens.tsx` e `src/App.tsx`:

- cadastro/login local;
- conta;
- endereços;
- GPS;
- feira;
- banca;
- catálogo;
- favoritos;
- carrinho;
- checkout;
- pagamento agora/na entrega;
- cartão local;
- Pix demonstrativo;
- dinheiro/troco;
- promoções;
- carteira local;
- pedidos;
- notificações de pedido e promoções com identidade Feiraê;
- rastreamento por estados;
- cancelamento;
- suporte;
- avaliações;
- comprar novamente;
- preferências;
- consentimento WhatsApp no pedido.

### Feirante

Implementado em `src/features/vendor/VendorScreens.tsx`:

- conta;
- banca;
- produtos;
- estoque;
- horários;
- promoções;
- entrega/retirada;
- pagamento na entrega;
- pedidos;
- pedidos novos e em andamento no painel principal;
- notificações locais/browser para novo pedido, pagamento, coleta, entrega e cancelamento;
- separação;
- peso real;
- documentos;
- avaliações;
- financeiro local.

### Entregador

Implementado em `src/features/delivery/DeliveryScreens.tsx`:

- conta;
- documentos;
- veículos;
- capacidade;
- disponibilidade;
- agenda;
- raio;
- regiões;
- ofertas;
- corridas compatíveis no painel principal;
- notificações locais/browser para nova corrida, rota, coleta, aproximação, conclusão e cancelamento;
- corrida ativa;
- coleta;
- rota;
- entrega;
- cancelamento;
- suporte;
- avaliações;
- financeiro local.

## 2.0. Mensagem de entrada

Na tela inicial de autenticação:

- slogan: **A feira do seu jeito**;
- título de propósito: **Da banca até você.**;
- apoio: **Compre de feirantes locais, gerencie sua banca ou faça entregas. Tudo pelo Feiraê.**

A mensagem deve comunicar imediatamente Cliente, Feirante e Entregador sem competir com o slogan principal.

## 2.1. Login e onboarding operacional

### Autenticação

- mensagens de erro são descartadas ao mudar de Entrar para Criar conta, trocar o papel selecionado ou editar o e-mail;
- quando um e-mail já pertence a outro papel, a mensagem informa explicitamente o acesso correto;
- no cadastro mobile, a apresentação promocional é compactada para priorizar os campos.

### Cliente

Ao criar uma nova conta, o Cliente precisa confirmar separadamente:

- **Li e aceito os Termos de Uso do Cliente Feiraê**;
- **Li o Aviso de Privacidade e estou ciente de como meus dados são tratados**.

Sem as duas confirmações, a conta não é criada.

**Ofertas e novidades** é uma preferência opcional, inicia desmarcada e não pode ser condição para criar a conta.

Os textos completos ficam disponíveis antes do cadastro e também depois em **Perfil → Configurações → Termos e privacidade**.

### Feirante

Se o cadastro não estiver aprovado, a Central mostra um bloco prioritário **Complete seu cadastro para vender** e leva primeiro à banca ou aos documentos conforme a pendência.

O antigo card **Painel** foi removido da grade porque a própria Central já cumpre essa função.

### Entregador

Se o cadastro não estiver aprovado, a Central mostra **Complete seu cadastro para entregar** e direciona para Conta, Veículos ou Documentos conforme a próxima pendência.

A área que antes se chamava **Painel** agora se chama **Disponibilidade**, preservando o controle de ficar online/offline sem duplicar o conceito de Central.

## 3. Limite do protótipo

A aplicação ainda não usa Supabase como fonte de verdade.

Persistência real atual:

- `localStorage`;
- bridges em `src/domain`;
- fixtures de demonstração.

Consequência: duas pessoas em aparelhos diferentes não compartilham estado real.

## 3.1. Central operacional e notificações

Feirante e entregador não precisam abrir um módulo secundário para descobrir trabalho novo.

### Feirante

Na Central:

- pedidos novos e em andamento aparecem em lista própria;
- o resumo mostra cliente, itens, valor, forma de atendimento e horário;
- “Abrir pedido” leva direto ao detalhe;
- o card de notificações usa a identidade Feiraê.

### Entregador

Na Central:

- corridas compatíveis aparecem na própria tela principal;
- corrida ativa permanece visível;
- filtros de raio, região, disponibilidade e veículo continuam valendo;
- novas corridas compatíveis podem disparar notificação local/browser.

### Aplicativo fechado

`public/feirae-sw.js` já recebe eventos `push` e exibe a identidade Feiraê, mas o protótipo ainda não possui backend que salve `PushSubscription` e envie notificações remotas.

Portanto, **notificação com o app totalmente fechado não está completa ponta a ponta** até existir backend compartilhado e Web Push. Ver [NOTIFICATIONS.md](NOTIFICATIONS.md).

## 3.2. Matriz de notificações por papel

As notificações seguem o fluxo de cada experiência e usam a identidade **Feiraê**.

### Cliente

Eventos principais:

- **Pedido feito**;
- **Pagamento confirmado** ou **Pagamento na entrega**;
- **Pedido em preparação**;
- **Pedido pronto** / **Pronto para retirada**;
- **Entregador a caminho da banca**;
- **Saiu para entrega**;
- **Pedido chegando**;
- **Pedido chegou**;
- cancelamento, substituição e promoções.

O cliente pode ativar notificações do sistema dentro da tela **Notificações**. As preferências **Ofertas e novidades** e **Atualizações dos pedidos** continuam independentes.

### Feirante

Eventos principais:

- **Novo pedido**;
- pagamento confirmado ou pagamento na entrega;
- entregador a caminho;
- rota calculada;
- pedido coletado;
- pedido entregue;
- troca/cancelamento de corrida;
- cancelamento do pedido.

O módulo **Notificações** da operação lista eventos relevantes somente da banca.

### Entregador

Eventos principais:

- **Nova corrida**;
- **Pedido pronto para coleta**;
- **Rota atualizada**;
- **Corrida aceita**;
- **Coleta confirmada**;
- **Rota para o cliente**;
- **Chegada sinalizada**;
- **Entrega concluída**;
- cancelamento e suporte prioritário.

A etapa operacional ganhou **Avisar chegada** entre iniciar a entrega e confirmar a entrega. Esse evento gera **Pedido chegando** para o Cliente.

## 3.3. Termos jurídicos obrigatórios dos parceiros

A área **Documentos** de Feirante e Entregador inclui termos jurídicos versionados antes dos uploads documentais.

### Feirante

Obrigatórios:

- **Termo de Adesão, Conduta e Responsabilidade do Feirante**;
- **Aviso de Privacidade e Proteção de Dados — Parceiros Feiraê**.

O termo cobre veracidade, responsabilidade por produtos, CDC, segurança sanitária, estoque/peso, fraude, ética, discriminação, proteção de dados, repasses, suspensão, contestação, responsabilidade civil e autonomia da atividade.

### Entregador

Obrigatórios:

- **Termo de Adesão, Segurança e Conduta do Entregador Parceiro**;
- **Aviso de Privacidade e Proteção de Dados — Parceiros Feiraê**.

O termo cobre autonomia real, ausência de exclusividade, possibilidade de ficar offline e recusar oferta antes do aceite, segurança viária, moto-frete, veículo, fraude/GPS falso, ética, geolocalização, acidentes, cancelamento, dados e responsabilidade.

### Assinatura

Cada termo registra no protótipo:

- ID e versão;
- papel;
- nome digitado;
- e-mail;
- data/hora;
- impressão digital do conteúdo.

Se a versão vigente mudar, a aceitação antiga não libera a operação.

### Aprovação

Feirante e Entregador só podem alcançar **Aprovado** quando todos os termos vigentes obrigatórios estiverem aceitos e os documentos obrigatórios estiverem aprovados.

O armazenamento local atual serve apenas ao protótipo. Produção exige trilha de auditoria server-side, identidade do controlador, Storage privado e revisão jurídica. Ver [PARTNER_LEGAL_TERMS.md](PARTNER_LEGAL_TERMS.md).

## 3.4. Experiência de Documentos e Regularização

A tela **Documentos** é uma central de regularização compartilhada por Feirante e Entregador.

Ela apresenta:

- identidade visual Feiraê e logomarca;
- status de aprovação;
- percentual calculado a partir de termos vigentes aceitos + documentos obrigatórios aprovados;
- contadores de termos, enviados, aprovados e pendências;
- termos obrigatórios em bloco separado;
- filtros por estado documental;
- timeline da análise de cada arquivo;
- visualização local de arquivo quando disponível;
- envio/substituição;
- orientações de segurança, LGPD, veracidade e aprovação.

O botão **Ver pendências** altera o filtro documental para **Pendentes**, sem esconder os termos obrigatórios.

O progresso é informativo e não substitui a regra de aprovação: a operação só é liberada quando os requisitos de negócio realmente estiverem satisfeitos.

## 4. Cliente — carrinho

O carrinho exibe:

- itens;
- quantidade;
- subtotal;
- peso estimado.

Regras implementadas:

- não misturar produtos de feiras diferentes;
- o contador da sacola representa a quantidade total de unidades;
- ao atingir o estoque disponível, o botão `+` da sacola fica desabilitado e informa o limite.

O código não mostra “veículo indicado” para o cliente.

## 5. Peso e capacidade de veículo

Fonte: `src/domain/vehicles.ts`.

Capacidades padrão atuais:

| Tipo                         |  kg |
| ---------------------------- | --: |
| Bicicleta                    |  10 |
| Bicicleta cargueira/triciclo |  40 |
| Moto                         |  12 |
| Moto com baú                 |  20 |
| Carro                        |  80 |
| Utilitário/Pickup            | 250 |
| Van                          | 500 |
| Outro                        |  10 |

Compatibilidade atual do entregador:

```
vehicle.active
AND vehicle.capacityKg >= orderWeight
AND vehicleReady(vehicle)
```

`vehicleReady` exige documento aprovado + placa válida somente quando `requiresPlate(type)` retorna true.

Comportamento atual importante:

- Bicicleta: não exige placa;
- Bicicleta cargueira/triciclo: não exige placa;
- `Outro`: **também não exige placa atualmente**.

A isenção de `Outro` é comportamento técnico atual e precisa ser revista antes de produção.

## 6. Placa

`isValidBrazilianPlate()` aceita sete caracteres no padrão:

```
AAA0A00
```

e também permite o quinto caractere numérico, cobrindo a placa antiga após normalização.

## 7. Endereço e GPS

Cliente pode:

- cadastrar endereço manual;
- usar localização atual;
- editar número/complemento.

Serviços usados hoje:

- Geolocation API do navegador;
- Nominatim reverse em `CustomerScreens.tsx`;
- Nominatim search em `routing.ts`.

Se GPS falha no fluxo principal, o app mantém região de fallback exibida.

## 8. Pagamentos atuais

### Pagar agora

UI oferece:

- Pix;
- cartão.

O protótipo muda o pedido para pagamento localmente autorizado. Não existe cobrança real.

### Pagar na entrega

Pode oferecer:

- dinheiro;
- cartão na maquininha.

Disponibilidade depende das configurações das bancas no carrinho.

### Dinheiro

Se selecionado:

- pergunta se precisa de troco;
- registra `changeFor`.

### Cartão salvo no protótipo

Persistido:

- titular;
- últimos 4 dígitos;
- validade;
- crédito/débito;
- bandeira.

Não persistido:

- número completo;
- CVV.

Produção deve usar tokenização do PSP.

## 9. Frete — comportamento real atual

O checkout **não calcula o preço do frete pela rota**.

Código atual em `CustomerScreens.tsx`:

1. obtém as bancas do carrinho;
2. lê `vendorMetrics.deliveryFee`;
3. pega o maior valor entre as bancas;
4. chama esse valor de `fallbackDeliveryFee`;
5. exige endereço de entrega antes de considerar o frete pronto;
6. sem endereço, mantém `calculatedDeliveryFee = 0`, mostra **A calcular** e não inclui frete no total;
7. com endereço, aplica o fallback local e então calcula subsídio/promoção.

Para **retirada**, frete permanece zero e endereço de entrega não é exigido.

Portanto, hoje:

- peso filtra veículo;
- rota calcula distância/ETA para logística;
- peso **não** altera preço;
- distância real **não** altera preço;
- frete exibido vem de métrica fixture/local, somente depois de existir endereço de entrega.

Produção precisa substituir esse cálculo por regra server-side configurável.

## 10. Promoções — comportamento atual

Tipos existentes no frontend:

- `percentual`;
- `valorFixo`;
- `compreLeve`;
- `produtoCategoria`;
- `freteGratis`;
- `combo`;
- `horario`;
- `cupom`.

### Implementados com semântica específica

- percentual;
- valor fixo;
- produto/categoria;
- frete grátis;
- cupom;
- Compre X Leve Y.

### Parcialmente implementados

`combo` e `horario` entram hoje na mesma regra percentual do subtotal-alvo.

Isso significa:

- `horario` não verifica janela de horário como regra específica;
- `combo` não monta composição de produtos/preço próprio.

Não documentar esses dois como completos.

### Gap SQL

A tabela `promotions` não possui:

- `coupon_code`;
- `pay_quantity`;
- `take_quantity`.

## 11. Horário da banca

O feirante escolhe:

- horário oficial da feira;
- horário próprio.

Agenda própria suporta fechamento depois da meia-noite.

Exemplo atual:

```
Segunda 19:00 → 02:00
```

é interpretado como fechamento na terça.

Para Feira do Produtor de Planaltina, seed atual usa Segunda e Quinta 19:00–02:00.

## 12. Publicação da banca

`VendorScreens.tsx` calcula `approvalStatus`.

A banca só é sincronizada no marketplace local como aprovada quando todos os documentos obrigatórios estão `approved`.

Documentos obrigatórios seed do feirante:

- documento oficial com foto;
- comprovante de residência;
- permissão/autorização da banca.

Licença sanitária está marcada como opcional no seed e depende da atividade.

## 13. Produto

### Taxonomia de categorias

A categoria de derivados de leite é **Laticínios**. Produtos como queijo, manteiga, requeijão, iogurte e leite ficam dentro dessa categoria; o nome específico continua no produto.

Não usar **Queijos** como categoria principal do catálogo.

`VendorProduct` possui atualmente:

- id;
- nome;
- categoria;
- descrição;
- estoque;
- estoque mínimo;
- ativo;
- preço;
- unidade;
- tamanho/apresentação;
- peso logístico;
- uma foto Data URL;
- nome do arquivo da foto.

`saveProduct()` exige somente:

- nome;
- preço > 0;
- peso logístico > 0.

Foto **não é obrigatória hoje**.

Se estoque = 0, o produto é salvo como inativo/esgotado.

## 13.1. Pedido mínimo da banca

Em **Minha banca**, o Feirante pode definir:

- **Sem valor mínimo**; ou
- **Definir valor mínimo**.

O valor configurado é público para o Cliente na página da banca e usado no carrinho/checkout.

Regras:

- mínimo pertence à banca, não à sacola global;
- cada banca do pedido é validada individualmente;
- R$ 0,00 = sem mínimo;
- protótipo limita configuração a R$ 100,00;
- valor inválido não é salvo;
- mudança não reescreve pedido já confirmado;
- backend real deverá validar a mesma regra server-side.

## 14. Multi-banca

Regra canônica: [MULTI_VENDOR_ORDERS.md](MULTI_VENDOR_ORDERS.md).

Pedido unificado mantém uma lista de bancas e seus estados.

Regras locais implementadas/testadas:

- uma sacola pertence a uma única feira;
- até **4 bancas** da mesma feira por pedido no MVP;
- pedido mínimo **configurável por banca**, não pelo total do carrinho;
- cada banca pode escolher R$ 0,00 (sem mínimo) ou um valor próprio;
- teto atual do protótipo: **R$ 100,00 por banca**;
- bancas estáticas/legadas sem configuração explícita usam R$ 30,00 como fallback;
- carrinho pré-valida e checkout + criação do pedido revalidam o mínimo de cada banca;
- frete/taxas/carteira não contam para o mínimo;
- descontos financiados pela própria banca reduzem o valor de produtos elegível para o mínimo;
- checkout continua único para o cliente;
- logística só libera quando todas as bancas estão prontas;
- peso logístico é a soma dos itens ativos de todas as bancas;
- retirada multi-banca mantém o pedido aberto após a primeira banca;
- o pedido de retirada só vira entregue após todas as bancas ativas confirmarem a entrega ao cliente;
- entrega cria `pickupStops` ordenados e o entregador confirma a coleta de cada banca individualmente;
- o pedido de entrega permanece `driver_assigned` durante as coletas e só vira `collected` após a última banca ativa;
- acompanhamento do cliente mostra progresso por banca;
- frete multi-banca é único: frete-base + R$ 2,50 por coleta adicional;
- cancelamento de uma banca remove somente sua participação, recalcula subtotal/frete/peso/rota e preserva as demais bancas.

Fixtures de corrida de demonstração são restritas às contas `@feirae.test`; uma conta real/recém-criada não deve receber ofertas fictícias.

Roteamento intra-feira implementado no protótipo:

- a localização atual do entregador é a origem do trecho externo até a feira;
- cada banca pode persistir setor/pavilhão, corredor/ala, box e posição interna X/Y;
- `pickupStops` são reordenados por proximidade quando existem posições internas;
- distância/ETA internos são somados à corrida;
- bancas sem X/Y usam setor/corredor/box como fallback;
- confirmação de coleta pode exigir código/QR da banca;
- OSRM continua responsável apenas pelos trechos dirigíveis externos.

Limites: a planta ainda não modela obstáculos/corredores como grafo, entrada/saída ainda usam o ponto geográfico de referência da feira e QR antifraude real depende de backend. Ver [INTERNAL_FAIR_ROUTING.md](INTERNAL_FAIR_ROUTING.md).

A recusa de uma banca só encerra o pedido global quando nenhuma banca ativa restar. O protótipo registra ajuste/reembolso local; estorno externo continua dependente de PSP/ledger real. Política: [REFUND_CANCELLATION_POLICY.md](REFUND_CANCELLATION_POLICY.md).

## 15. Entregador — aprovação real do protótipo

Sempre obrigatórios:

- identidade;
- comprovante de residência.

Se houver veículo motorizado ativo:

- CNH;
- CRLV.

Se houver Moto/Moto com baú ativa:

- motofrete.

O código não valida automaticamente:

- idade;
- tempo de CNH;
- EAR;
- autenticidade;
- consulta Detran;
- certidões.

## 16. Entregador — filtros de corrida

Uma corrida visível precisa:

- estar disponível;
- estar dentro de `radiusKm`;
- estar em região permitida, se configurada.

Para aceitar também precisa:

- `online = true`;
- agenda permitir;
- cadastro aprovado;
- não existir outra corrida ativa;
- existir veículo ativo compatível/documentado.

Ordenação prioriza:

1. corridas dentro de `preferredDistanceKm`;
2. menor distância total.

## 17. Pedido e estados

Referência canônica: [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md).

Frontend global:

```
received
preparing
ready_for_pickup
driver_assigned
collected
out_for_delivery
delivered
cancelled
```

O SQL atual ainda não está totalmente compatível. Ver [SCHEMA_GAP_MATRIX.md](SCHEMA_GAP_MATRIX.md).

## 18. Cancelamento

Antes da coleta:

- ator;
- motivo;
- detalhe;
- data/hora;
- evento;
- liberação de estoque;
- reembolso local quando aplicável.

Depois da coleta:

- cliente não usa cancelamento simples;
- abre suporte/ocorrência.

## 19. Estoque

`inventoryBridge.ts` implementa localmente:

- reserva;
- rejeição por quantidade insuficiente;
- liberação;
- consumo.

Não existe tabela SQL de reserva de estoque.

## 20. Rastreamento

Cliente vê estados derivados dos eventos do pedido.

Após entregador atribuído, o pedido pode conter:

- nome;
- veículo;
- placa mascarada;
- ETA;
- distância.

Rastreamento GPS em tempo real ainda não existe.

## 21. Documentos

`storedFile.ts`:

- limite: 1.500.000 bytes;
- leitura Data URL;
- armazena nome/type/tamanho/data.

Não existe validação por magic bytes nem Storage remoto.

## 22. Critério de interface

Auditoria atual: [UI_INTERACTION_AUDIT.md](UI_INTERACTION_AUDIT.md).

Regra:

- controle disponível deve agir;
- controle indisponível deve estar `disabled`;
- formulário com Salvar deve usar rascunho;
- upload não pode fingir aprovação;
- preferência deve ter consumidor funcional.

## 23. Mapeamento direto para código

Veja [IMPLEMENTATION_TRACEABILITY.md](IMPLEMENTATION_TRACEABILITY.md).

## 21. Navegação e cabeçalho do cliente

- navegação móvel: **Início, Feiras, Produtos, Pedidos e Perfil**;
- **Início** usa ícone de casa e abre `#/cliente/inicio`;
- em telas de descoberta (`Início`, `Feiras`, `Produtos`), a busca ocupa uma linha inteira acima do contexto de feira/localização;
- em `Pedidos`, `Perfil`, checkout, rastreamento e demais subtelas, busca e contexto de feira/localização não são exibidos;
- o cabeçalho continua mantendo marca, notificações e sacola.

## 22. Feiras com configuração incompleta

Na interface do cliente, campos administrativos incompletos não usam mais os textos “Entrega a configurar” e “Taxa a configurar”; aparecem como indisponíveis no momento.

A regra de **bloquear ativação/publicação de uma feira com configuração obrigatória incompleta** pertence ao painel de gestão. O contrato está em `ADMIN_MANAGEMENT_SPEC.md`; o painel administrativo runtime ainda não existe no repositório e não deve ser documentado como implementado.

## Experiência de abertura

Ao iniciar o Feiraê:

- primeira abertura do dia: splash completa de aproximadamente 3,3 s;
- reabertura no mesmo dia: versão rápida de aproximadamente 1,55 s;
- `prefers-reduced-motion: reduce`: versão estática curta;
- falha/bloqueio de áudio não impede acesso ao app;
- retorno do background não deve criar um novo gate funcional.

A sequência visual comunica feira → produtos → entrega → marca.

A assinatura da splash é **“Da feira até você”**.

A preferência de som é local em `feirae:sound-enabled` e pode ser desativada em Configurações.

Detalhes: [LAUNCH_EXPERIENCE.md](LAUNCH_EXPERIENCE.md).

## Identidade verbal

Para evitar conflito entre mensagens da marca:

- slogan institucional: **A feira do seu jeito**;
- mensagem de propósito da tela de entrada: **Da banca até você.**;
- assinatura da experiência de abertura: **Da feira até você**.

Essas três frases possuem funções diferentes e não devem ser trocadas automaticamente entre superfícies.

### Critério visual da abertura

A versão completa deve mostrar, de forma perceptível e nessa ordem:

1. banca sendo desenhada;
2. banca ganhando cor/profundidade;
3. produtos/folhagens aparecendo;
4. rota surgindo;
5. moto/entregador atravessando a cena;
6. pin de localização;
7. saída da cena;
8. Feiraê + **Da feira até você**.

Uma versão em que esses elementos aparecem apenas como pequeno ícone central não atende ao critério visual aprovado.

## Aceite visual da abertura — referência aprovada de 27/09/2026

A splash deve reproduzir a sequência aprovada, sem substituir por outra interpretação visual:

- quadro 1: banca em traço luminoso sobre verde, com elementos de feira flutuando;
- quadro 2: banca completa com produtos + moto de entrega + rota/pin;
- quadro 3: logo Feiraê em fundo claro + assinatura **“Da feira até você”** + produtos na base.

Não usar na abertura o card quadrado de marca da versão anterior nem adicionar legenda promocional abaixo da cena. O modo rápido preserva a cena de entrega e encerra na mesma marca final; reduced motion exibe diretamente o quadro final.

