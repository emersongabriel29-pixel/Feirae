# Entregas — Feiraê

## Objetivo

A entrega deve conectar pedido, feirante, entregador, veículo, rota e remuneração de forma rastreável.

## Estados recomendados

pending → assigned → accepted → collecting → collected → out_for_delivery → delivered

Estados alternativos: cancelled, failed e futuramente returned, se necessário.

## Elegibilidade da corrida

Antes de oferecer uma corrida ao entregador, considerar:
- disponibilidade;
- região de atuação;
- capacidade do veículo;
- peso/volume estimado;
- distância/rota;
- situação cadastral;
- status do veículo.

## Veículos

Cada veículo deve registrar tipo, capacidade máxima, status e informações necessárias para validação.

Exemplos podem incluir bicicleta, moto e carro. Capacidades reais devem ser configuráveis e validadas operacionalmente.

## Peso

O carrinho e o pedido devem possuir peso total calculável. A seleção de veículo precisa impedir atribuições incompatíveis. Em produção, essa regra deve ser revalidada no servidor.

## Taxa

A taxa pode combinar rota e peso. A fórmula final permanece decisão comercial pendente e deve ser parametrizável.

A taxa administrativa aplicada sobre a operação deve ficar separada da remuneração bruta do entregador para transparência e auditoria.

## Rastreamento

- O cliente vê status claros.
- “Em rota” deve ter destaque visual.
- O entregador vê origem, destino e ação de abrir rota.
- Rastreamento em tempo real é evolução posterior e exige tratamento cuidadoso da localização.

## Cancelamento

O cancelamento precisa pedir motivo e registrar ator, motivo, horário, estado anterior e possível impacto financeiro.

## Avaliações

Após conclusão:
- cliente avalia entrega/entregador;
- feirante pode avaliar entregador;
- regras adicionais podem permitir avaliação operacional do cliente.

A média agregada deve ser exibida junto às avaliações individuais.

## Segurança operacional

- Não expor endereço completo antes da necessidade operacional adequada.
- Limitar acesso à localização.
- Registrar alterações de status.
- Evitar que o cliente force estados de entrega pelo frontend.
- Entrega concluída deve ter evidência compatível com a política definida.
