# Modelo de dados planejado — Feiraê

Este documento descreve o modelo alvo. Ele não implica que todas as tabelas já estejam ativas no Supabase.

## Identidade

### profiles
Dados comuns de conta: id, nome, telefone, avatar, papel ativo, status e timestamps.

### vendor_profiles
Dados do feirante: profile_id, documentos/status de validação, dados comerciais e status operacional.

### delivery_profiles
Dados do entregador: profile_id, documentos/status, foto, disponibilidade e status operacional.

## Feiras e lojas

### fairs
Nome, descrição, endereço, latitude/longitude, estado/cidade/região, dias/horários padrão e status.

### fair_vendor_memberships
Relaciona feirante e feira, incluindo aprovação e posição/banca.

### vendor_stores
Loja digital do feirante: nome, descrição, capa/logo, horários próprios e status.

## Catálogo

### categories
Categorias de produtos.

### products
Loja, categoria, nome, descrição, unidade, preço atual e status.

### product_images
Imagens e ordenação.

### inventory
Produto, quantidade, reserva, disponibilidade e data de atualização.

## Cliente

### addresses
Endereços salvos e coordenadas opcionais.

### favorites
Favoritos de feira, loja ou produto.

### carts / cart_items
Carrinho persistente. O servidor deve recalcular valores antes do fechamento.

## Pedidos

### orders
Pedido principal do cliente.

### order_vendors
Divisão interna do pedido por vendedor.

### order_items
Snapshot imutável do item no momento da compra: produto, descrição, unidade, preço, quantidade e vendedor.

O histórico não deve depender do produto continuar existindo ou manter o mesmo preço.

## Pagamentos

### payments
Pedido, método, provedor, identificador externo, valor, status, timestamps e chave de idempotência.

Nunca armazenar dados sensíveis de cartão que pertençam ao provedor de pagamento.

## Entregas

### vehicles
Entregador, tipo, capacidade de peso, capacidade adicional quando aplicável e status.

### deliveries
Pedido, entregador, veículo, origem/destino, peso calculado, taxa, status e timestamps.

### delivery_events
Histórico de atribuição, aceite, coleta, rota, entrega e cancelamento.

## Avaliações

### reviews
Autor, alvo, pedido relacionado, tipo da avaliação, nota, comentário e status/moderação.

A criação deve validar participação real na transação.

## Financeiro

Prever entidades para:
- taxas;
- comissão da plataforma;
- repasse do feirante;
- remuneração do entregador;
- reembolsos;
- ajustes.

Percentuais devem ser parametrizados e não codificados diretamente na interface.

## Auditoria

### audit_logs
Registrar operações críticas, especialmente alteração de estoque, status de pedido, pagamento, repasse e aprovação/suspensão de conta.

## Segurança/RLS

- cliente acessa seus próprios dados e pedidos;
- feirante acessa apenas recursos da própria operação;
- entregador acessa corridas elegíveis e atribuídas;
- admin usa papel separado;
- Service Role nunca vai para o frontend.
