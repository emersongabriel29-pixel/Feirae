# Especificação funcional consolidada — Feiraê

Atualizado em 26/09/2026 após nova auditoria contra o código atual.

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
- alerta local/browser “Feiraê • Novo pedido” após permissão;
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
- alerta local/browser “Feiraê • Nova corrida” quando disponível e com permissão;
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

## 14. Multi-banca

Pedido unificado mantém uma lista de bancas e seus estados.

Regras locais testadas:

- logística só libera quando todas as bancas estão prontas;
- retirada multi-banca mantém o pedido aberto após a primeira banca;
- o pedido de retirada só vira entregue após todas as bancas confirmarem a entrega ao cliente.

Fixtures de corrida de demonstração são restritas às contas `@feirae.test`; uma conta real/recém-criada não deve receber ofertas fictícias.

Limitação atual de rota:

- a corrida agrega nomes de várias bancas;
- o modelo de rota ainda usa uma origem de feira/banca e destino do cliente;
- **não existe otimização de múltiplas paradas entre bancas**.

Produção precisa modelar stops.

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
