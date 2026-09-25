# Domínio de entregas

## Objetivo

A entrega deve conectar pedido, feirante e entregador com estados rastreáveis, regras de capacidade e cancelamentos auditáveis.

## Veículos

Cada entregador pode cadastrar um ou mais veículos.

Campos mínimos:
- tipo;
- descrição;
- capacidade de peso;
- ativo/inativo.

Exemplos de classes podem incluir bicicleta/cargueira, moto e carro, mas os limites exatos devem ser configuração de negócio.

## Elegibilidade

Uma corrida só deve ser oferecida quando houver compatibilidade entre:
- peso do pedido;
- volume;
- capacidade do veículo;
- região;
- disponibilidade;
- demais regras operacionais.

A interface pode estimar, mas a decisão real deve ser validada no servidor.

## Cálculo da taxa

Pode combinar:
- distância de rota;
- peso;
- classe de veículo;
- taxa mínima;
- adicionais operacionais.

A fórmula deve ficar centralizada em domínio/configuração.

## Estados

Fluxo interno recomendado:

```text
pending
→ assigned
→ accepted
→ collecting
→ collected
→ out_for_delivery
→ delivered
```

Estados alternativos:
- cancelled;
- failed;
- reassignment_required.

Para o cliente, estes estados podem ser resumidos para:
- Recebido;
- Preparando;
- Coleta;
- Em rota;
- Entregue;
- Cancelado.

## Aceite

Uma entrega não deve ser aceita por dois entregadores simultaneamente.

No backend real, o aceite deve usar operação atômica/condicional.

## Coleta

Ao chegar:
- entregador confirma coleta;
- horário é registrado;
- status do pedido é atualizado;
- rota de entrega é liberada.

## Rastreio

O design deve suportar:
- posição do entregador;
- última atualização;
- estimativa de chegada;
- fallback quando localização não estiver disponível.

Localização contínua depende de consentimento e integração futura.

## Cancelamento

Ao cancelar:
1. selecionar motivo;
2. confirmar;
3. registrar responsável;
4. registrar etapa do fluxo;
5. decidir se haverá realocação;
6. recalcular impactos financeiros quando aplicável.

Motivos podem incluir:
- problema com veículo;
- endereço incorreto;
- pedido não pronto;
- cliente indisponível;
- problema de segurança;
- outro.

## Avaliações

Após conclusão:
- cliente avalia entrega;
- feirante pode avaliar entregador;
- entregador pode avaliar cliente e feirante.

## Arte e UI

A identidade visual de “entrega em rota” deve ser consistente entre cliente e painel do entregador.

Elementos visuais não substituem estados reais do pedido.

## Testes mínimos

Sem integrações externas já é possível testar:
- cálculo de peso;
- escolha de veículo compatível;
- transições válidas de estado;
- bloqueio de transições inválidas;
- motivos de cancelamento;
- resumo de taxa;
- renderização dos estados.
