# Fluxos de usuário do Feiraê

## Entrada

```text
Abrir Feiraê
→ escolher Cliente, Feirante ou Entregador
→ criar conta ou entrar
→ acessar experiência do papel escolhido
```

A troca de papel deve ocorrer por saída da sessão, não por um seletor solto dentro do painel.

## Fluxo do Cliente

### Descoberta e compra

```text
Entrar
→ Feiras
→ feira mais próxima / escolher feira
→ visualizar lojas da feira
→ entrar na loja
→ catálogo
→ produto
→ adicionar ao carrinho
→ revisar Minha Feira
→ endereço
→ entrega ou retirada
→ pagamento
→ confirmar pedido
→ acompanhar pedido
```

### Localização

```text
Cliente autoriza GPS
→ ordenar feiras por proximidade
→ mostrar distância
```

ou

```text
Cliente recusa GPS
→ informar endereço/região
→ continuar usando o app
```

GPS nunca deve ser obrigatório.

### Pedido

```text
Recebido
→ Preparando
→ Coleta
→ Em rota
→ Entregue
```

No estado “Em rota”, a interface deve evidenciar acompanhamento da entrega.

Após entrega:
- avaliar compra/produto;
- avaliar entrega;
- opção de comprar novamente.

## Fluxo do Feirante

```text
Criar conta
→ enviar dados/documentos
→ validação
→ cadastrar ou vincular banca/box
→ configurar dias e horários
→ cadastrar produtos
→ definir preço/estoque/fotos
→ publicar produtos
→ receber pedido
→ aceitar/processar
→ separar pedido
→ liberar para coleta
→ acompanhar conclusão
→ financeiro e avaliações
```

O feirante deve conseguir editar produto, valor, disponibilidade e estoque sem depender de suporte administrativo para ações rotineiras.

## Fluxo do Entregador

```text
Criar conta
→ enviar dados/documentos
→ validação
→ cadastrar foto
→ cadastrar veículo e capacidade
→ ficar disponível
→ receber corrida compatível
→ aceitar
→ ir até coleta
→ confirmar coleta
→ iniciar rota
→ entregar
→ confirmar conclusão
→ visualizar ganho
→ avaliar partes envolvidas
```

## Cancelamento de entrega

```text
Cancelar
→ selecionar motivo
→ confirmar
→ registrar responsável e etapa
→ recalcular estado do pedido
→ buscar nova alocação quando aplicável
```

Motivos devem ser pré-definidos, com campo adicional opcional quando necessário.

## Avaliações

### Cliente
Compra/produto → nota + comentário opcional  
Entrega → nota + comentário opcional

### Feirante
Entregador → nota + comentário opcional  
Cliente → nota + comentário opcional

### Entregador
Feirante → nota + comentário opcional  
Cliente → nota + comentário opcional

## Fluxo multi-feirante

```text
Cliente adiciona produtos de lojas diferentes
→ carrinho único
→ resumo por vendedor
→ checkout único
→ pedido principal
→ subpedidos por feirante
→ preparação independente
→ coordenação de entrega conforme regra operacional
```

O produto deve preservar uma experiência simples para o cliente, mesmo que internamente haja múltiplos vendedores.

## Estados de erro obrigatórios no produto real

Cada fluxo deve prever:
- carregando;
- vazio;
- erro;
- sem conexão;
- permissão negada;
- localização negada;
- produto indisponível;
- estoque alterado;
- pagamento não confirmado;
- entrega indisponível.

Esses estados devem fazer parte do design e dos testes.
