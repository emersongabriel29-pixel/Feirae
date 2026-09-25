# Regras de negócio do Feiraê

Este documento registra decisões funcionais do produto. Mudanças nessas regras devem ser deliberadas e não feitas automaticamente durante refatorações.

## Papéis

Existem três papéis públicos principais:
- Cliente;
- Feirante;
- Entregador.

Administrador é uma área separada e não deve aparecer como quarta opção no login público.

Cada papel deve possuir cadastro próprio, validações compatíveis e experiência específica.

## Cliente

O cliente deve poder:
- criar conta antes de entrar;
- escolher localização por GPS ou informar região/endereço manualmente;
- visualizar feiras próximas;
- entrar em uma feira;
- visualizar várias lojas/feirantes da feira;
- entrar em uma loja;
- navegar por produtos;
- adicionar produtos ao carrinho;
- acompanhar peso, quantidade e valor;
- escolher entrega ou retirada quando disponível;
- cadastrar cartão e usar Pix quando o pagamento real existir;
- acompanhar status do pedido;
- comprar novamente a partir de pedidos/sacolas anteriores;
- avaliar produto/compra e entrega;
- autorizar ou não mensagens por WhatsApp no checkout.

`Minhas feiras` e `Lojas` são conceitos diferentes e não devem ser fundidos.

## Feiras

- A aplicação não deve assumir permanentemente que só existirá no Distrito Federal.
- Enquanto a operação estiver restrita, a interface pode informar “no momento disponível apenas no DF”.
- Deve existir seleção de estado/região quando a expansão começar.
- A feira mais próxima deve ser priorizada quando o cliente autorizar localização.
- Feiras possuem endereço, coordenadas, dias e horários.
- Uma feira pode conter múltiplos feirantes.

## Feirante

O feirante deve poder:
- criar conta;
- enviar documentação e passar por validação;
- cadastrar banca/box;
- vincular-se a uma feira;
- definir horários próprios respeitando regras da feira;
- cadastrar e editar produtos;
- definir preço, unidade, estoque e fotos;
- pausar produtos;
- acompanhar pedidos;
- acompanhar receitas, custos e repasses;
- visualizar e receber avaliações;
- avaliar entregador e cliente quando aplicável.

A opção de absorver a taxa de entrega é uma regra comercial prevista, mas os percentuais e critérios ainda precisam ser definidos antes da operação real.

## Entregador

O entregador deve poder:
- criar conta;
- enviar documentação e passar por validação;
- cadastrar foto de perfil;
- cadastrar um ou mais veículos;
- informar capacidade dos veículos;
- ficar disponível ou indisponível;
- receber corridas compatíveis;
- aceitar corrida;
- acompanhar coleta, rota e conclusão;
- cancelar com motivo;
- visualizar ganhos;
- avaliar cliente e feirante quando aplicável.

## Carrinho e checkout

O carrinho deve exibir, no mínimo:
- quantidade de itens;
- peso estimado;
- valor dos produtos;
- taxa de entrega quando aplicável;
- resumo por feirante quando houver múltiplos vendedores.

Um checkout pode reunir produtos de vários feirantes, mas internamente o pedido deve ser dividido por vendedor.

Antes da confirmação real, servidor deve recalcular:
- preço;
- estoque;
- subtotal;
- peso;
- taxa;
- comissão;
- repasses.

## Peso e capacidade

O peso do pedido influencia elegibilidade do veículo e pode influenciar a taxa.

A aplicação deve impedir a seleção de uma modalidade incapaz de transportar o pedido.

As faixas exatas de capacidade são configuráveis e não devem ficar espalhadas pela interface.

## Pedidos

Estados de alto nível para o cliente:
- Recebido;
- Preparando;
- Coleta;
- Em rota;
- Entregue;
- Cancelado.

Estados internos podem ser mais detalhados.

Cancelamentos devem registrar motivo, responsável e momento do cancelamento.

## Avaliações

A avaliação é bidirecional quando a relação existir:
- cliente pode avaliar compra/produto e entrega;
- feirante pode avaliar entregador e cliente;
- entregador pode avaliar cliente e feirante.

A interface deve mostrar média geral e avaliações individuais.

Avaliações não devem ser automaticamente publicadas sem mecanismos de moderação no produto real.

## Notificações e WhatsApp

Mensagens por WhatsApp exigem consentimento explícito do cliente.

A autorização no checkout deve ser opt-in e registrada de forma auditável quando houver backend.

## Categorias

Categorias devem ser compreensíveis para o cliente e consistentes com o catálogo.

Termos amplos devem ser preferidos quando facilitarem descoberta. Por exemplo, “Pescados” é mais abrangente que “Peixe” quando a categoria também inclui frutos do mar.

## Regra de preservação

Refatorações técnicas não podem:
- remover telas;
- juntar conceitos distintos;
- esconder funcionalidades existentes;
- alterar regra comercial;
- mudar fluxo de usuário;

sem uma decisão explícita de produto.
