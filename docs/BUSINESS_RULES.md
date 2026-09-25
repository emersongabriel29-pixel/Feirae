# Regras de negócio — Feiraê

Este documento registra regras de produto já definidas e deve ser consultado antes de alterar fluxos.

## Perfis

### Cliente
- Deve criar conta antes de operar funções autenticadas.
- Pode explorar feiras e lojas antes da compra.
- Deve conseguir escolher estado/região; o produto não deve ser rigidamente preso ao DF.
- Quando autorizado, a localização pode ordenar feiras por proximidade.
- Pode comprar de vários feirantes na mesma experiência.
- Pode escolher entrega ou retirada quando disponível.
- Pode avaliar produto/compra e entrega.
- Pode usar “comprar novamente” em pedidos/sacolas.
- Na finalização, pode autorizar recebimento de mensagens por WhatsApp.

### Feirante
- Deve possuir cadastro próprio e validação documental.
- Cadastra banca/box e vincula a uma feira.
- Define horários próprios respeitando regras/horários da feira.
- Cadastra, edita, pausa e reativa produtos.
- Gerencia preços, estoque e fotos.
- Acompanha receitas, custos e resultados.
- Pode receber e fazer avaliações nos fluxos previstos.
- Pode optar por absorver a taxa de entrega quando a regra comercial permitir.

### Entregador
- Deve possuir cadastro, validação documental e foto de perfil.
- Cadastra um ou mais veículos e respectivas capacidades.
- Só deve receber/aceitar corridas compatíveis com capacidade, rota e regras operacionais.
- Pode cancelar entrega mediante motivo.
- Acompanha taxa, ganhos, histórico e avaliações.

## Feiras, lojas e catálogo

- “Feiras” é a entrada principal de descoberta.
- Feiras em destaque pertencem à área de Feiras.
- Uma feira pode conter vários feirantes/lojas.
- “Minhas feiras” e “Lojas” são conceitos distintos.
- A loja representa o feirante e seu catálogo.
- “Pescados” é a categoria preferível quando houver variedade além de peixe.

## Carrinho e checkout

- O carrinho deve mostrar quantidade, valor e peso.
- Deve existir limite operacional de peso por entrega.
- A compatibilidade do veículo depende do peso/volume configurado.
- Checkout com múltiplos feirantes deve criar divisão interna por vendedor sem obrigar o cliente a fazer vários checkouts.
- Preço, estoque, comissão, taxa e disponibilidade precisam ser recalculados no servidor no modo real.
- Cartão de crédito, débito e Pix fazem parte do escopo, mas a integração do provedor é etapa posterior.

## Pedido

Estados de alto nível esperados:
- criado;
- confirmado;
- em preparação;
- pronto para coleta/retirada;
- em rota;
- entregue;
- cancelado.

O cliente deve enxergar claramente quando o pedido está em rota e quando foi entregue.

## Avaliações

A avaliação é relacional, não um bloco genérico:
- Cliente avalia produto/compra e entrega.
- Feirante pode avaliar entregador e cliente quando aplicável.
- Entregador pode avaliar a experiência operacional prevista.
- A interface deve mostrar média agregada e avaliações individuais.

Regras de elegibilidade devem evitar avaliação por quem não participou da transação.

## Cancelamentos

Cancelamentos precisam registrar:
- quem cancelou;
- motivo;
- momento do fluxo;
- impacto financeiro;
- impacto operacional.

## Localização e privacidade

- GPS é opcional.
- Negar GPS não pode bloquear o uso básico.
- Deve existir alternativa manual de endereço/região.
- Localização é dado privado e deve ser usada apenas com consentimento.
