# Entrega, rota, preço e capacidade — Feiraê

## Objetivo

Definir uma regra única para:

- quais corridas aparecem para cada entregador;
- como o valor da entrega é calculado;
- como a rota muda da banca até o cliente;
- quando uma entrega aparece como “Em andamento”;
- quando mais de uma entrega pode ser agrupada;
- como funciona compra em várias bancas da mesma feira.

## 1. Área de atuação

No MVP, o entregador escolhe uma ou mais **áreas de coleta**.

Exemplo:

- Planaltina;
- Sobradinho;
- Gama;
- Ceilândia.

Uma corrida só aparece se a **feira de origem** estiver em uma das áreas ativas do entregador.

Portanto:

- entregador configurado apenas para Planaltina não recebe corrida cuja coleta começa em Sobradinho;
- ele pode ampliar manualmente as áreas depois;
- o backend futuro também deve aplicar distância máxima até a coleta e distância máxima total de rota.

O filtro de área acontece antes de peso, veículo e ganho.

## 2. Ordem dos filtros de corrida

Uma corrida só é oferecida quando passa por todos estes critérios:

1. cadastro aprovado;
2. entregador online;
3. origem dentro de área ativa;
4. veículo ativo;
5. capacidade de peso suficiente;
6. documentação compatível com o veículo;
7. nenhuma rota ativa incompatível;
8. pedido pronto para coleta.

## 3. Uma entrega por vez ou várias?

### MVP

**Uma rota ativa por entregador.**

Motivos:

- reduz erro de coleta;
- simplifica rastreamento;
- evita atraso por desvio;
- facilita suporte e prova de entrega;
- mantém cálculo financeiro previsível.

Enquanto houver uma rota ativa, novas corridas podem ser visualizadas, mas não aceitas.

### Fase futura — rota combinada

Permitir no máximo 2 ou 3 pedidos quando todos obedecerem simultaneamente:

- mesma feira ou mesmo ponto de coleta;
- pedidos prontos;
- destinos na mesma direção;
- desvio adicional menor ou igual a 20% da rota ou 3 km, o que for menor;
- peso combinado dentro da capacidade real do veículo;
- SLA de nenhum cliente é violado;
- remuneração adicional do entregador é calculada por parada;
- cliente recebe previsão individualizada.

Não agrupar apenas porque duas entregas são “próximas”. O algoritmo deve calcular o custo do desvio.

## 4. Compra em várias bancas

### Mesma feira

**Permitida.**

Um cliente pode comprar de várias bancas dentro da mesma feira na mesma sacola.

O sistema cria:

- uma compra do cliente;
- parcelas financeiras por feirante;
- uma lista de coletas dentro da feira;
- uma rota de saída da feira para o cliente.

A remuneração logística inclui adicional por banca extra.

### Feiras diferentes

**Não permitido na mesma sacola no MVP.**

Motivos:

- as feiras podem estar em regiões distintas;
- exigiria múltiplas rotas de coleta;
- aumenta prazo e custo;
- aumenta risco de itens prontos em horários diferentes.

O cliente pode finalizar uma sacola e iniciar outra em outra feira.

## 5. Como o frete é calculado

O cálculo do Feiraê deve ser transparente e separado em duas partes:

### Remuneração do entregador

```
ganho_entregador =
  base_veiculo
  + (km_rota × valor_km)
  + adicional_peso
  + adicional_bancas_extras
```

Depois é aplicado um piso mínimo interno por tipo de veículo.

### Taxa administrativa de logística

```
taxa_plataforma = maior entre:
  R$ 1,50
  ou
  12% do ganho do entregador
```

### Frete mostrado ao cliente

```
frete_cliente = ganho_entregador + taxa_plataforma
```

Se o feirante patrocinar frete grátis:

```
cliente paga entrega = R$ 0
feirante assume = frete_cliente
entregador recebe = ganho_entregador
plataforma registra = taxa_plataforma
```

O entregador nunca perde remuneração porque o cliente recebeu frete grátis.

## 6. Coeficientes iniciais de demonstração

Estes valores são parâmetros de produto, não tabela legal definitiva.

| Veículo                      |     Base |   R$/km | Peso incluído | Adicional/kg | Piso do entregador |
| ---------------------------- | -------: | ------: | ------------: | -----------: | -----------------: |
| Bicicleta                    |  R$ 4,50 | R$ 1,10 |          5 kg |      R$ 0,08 |            R$ 6,50 |
| Bicicleta cargueira/triciclo |  R$ 6,00 | R$ 1,25 |         15 kg |      R$ 0,08 |            R$ 8,00 |
| Moto                         |  R$ 6,50 | R$ 1,50 |          8 kg |      R$ 0,12 |            R$ 9,00 |
| Moto com baú                 |  R$ 7,50 | R$ 1,60 |         12 kg |      R$ 0,12 |           R$ 10,00 |
| Carro                        | R$ 10,00 | R$ 2,10 |         30 kg |      R$ 0,18 |           R$ 14,00 |
| Utilitário/Pickup            | R$ 15,00 | R$ 2,60 |         80 kg |      R$ 0,22 |           R$ 20,00 |
| Van                          | R$ 22,00 | R$ 3,20 |        150 kg |      R$ 0,25 |           R$ 30,00 |

Banca extra dentro da mesma feira:

- R$ 1,50 adicional por coleta extra no cálculo do entregador.

Os coeficientes devem ser configuráveis no backend/admin futuramente.

## 7. Rota em andamento

A rota possui dois trechos principais:

### Trecho A — até a banca

Exibir:

- “A caminho da banca”;
- distância até a feira/banca;
- minutos estimados;
- botão Google Maps;
- botão Waze.

### Coleta

Exibir:

- “Na banca / confirmando coleta”;
- número de bancas a coletar;
- itens/peso;
- confirmação de coleta.

### Trecho B — banca → cliente

Após confirmar coleta:

- trocar automaticamente o destino do mapa para o endereço do cliente;
- recalcular km restantes;
- recalcular minutos restantes;
- mostrar “Em rota para o cliente”.

### Entrega

Após iniciar entrega:

- tela continua em “Em andamento”;
- cliente acompanha a mesma rota;
- conclusão libera o recebível do entregador.

## 8. Google Maps e Waze

O entregador deve poder escolher o app de navegação.

Google Maps:

```
https://www.google.com/maps/dir/?api=1&destination=<destino>
```

Waze:

```
https://www.waze.com/ul?q=<destino>&navigate=yes
```

Antes da coleta, o destino é a banca/feira.

Depois da coleta, o destino é o cliente.

## 9. Financeiro do entregador

Deve mostrar:

- hoje;
- últimos 7 dias;
- mês atual;
- comparação com mês anterior;
- ano;
- número de entregas;
- km rodados;
- média por entrega;
- ganho médio por km;
- pendente;
- disponível;
- solicitado;
- pago;
- histórico por corrida.

O saque/repasse só pode ser solicitado para valor disponível e com destino de recebimento validado.

## 10. Financeiro do feirante

Deve mostrar:

- vendas de hoje;
- vendas dos últimos 7 dias;
- mês atual;
- comparação com mês anterior;
- total anual;
- pedidos;
- ticket médio;
- produtos mais vendidos;
- descontos;
- frete grátis patrocinado;
- taxas;
- estornos;
- bruto;
- líquido;
- pendente;
- disponível;
- repasses;
- histórico por pedido.

## 11. Avaliações cruzadas

### Cliente avalia

Após entrega/retirada:

- produto;
- banca;
- entrega.

### Entregador avalia

Após concluir entrega:

- banca: preparo, organização, espera na coleta;
- cliente: comunicação, recebimento e segurança da entrega.

### Feirante avalia

Após conclusão:

- entregador: pontualidade, cuidado e coleta;
- cliente: somente aspectos transacionais/operacionais, sem atributos pessoais.

Para reduzir retaliação, avaliações de partes opostas devem preferencialmente ficar ocultas até:

- ambas enviarem; ou
- encerrar a janela de avaliação.

## 12. Guia inicial

O “Guia inicial” não deve ser uma página perdida na central operacional.

Ele deve aparecer durante a criação da conta.

### Feirante

1. dados pessoais/PF-PJ;
2. documentos;
3. banca/box/feira;
4. horários;
5. conta de recebimento;
6. produtos;
7. análise/aprovação;
8. liberar vendas.

### Entregador

1. dados pessoais;
2. área de atuação;
3. veículo e capacidade;
4. CNH/CRLV/motofrete quando aplicável;
5. destino de recebimento;
6. documentos;
7. análise/aprovação;
8. liberar modo online.

## 13. Referências regulatórias

A política de pisos mínimos da ANTT se refere ao transporte rodoviário remunerado de cargas nas hipóteses abrangidas pela legislação própria, especialmente operações de carga lotação e regras associadas ao transporte rodoviário de cargas. O Feiraê não usa essa tabela como fórmula automática para entrega urbana por bicicleta/moto/carro; uma revisão jurídica deve confirmar obrigações aplicáveis conforme o modelo real de operação.

Referências:

- ANTT — Política Nacional de Pisos Mínimos de Frete:
  https://www.gov.br/antt/pt-br/assuntos/cargas/politica-nacional-de-pisos-minimos-de-frete
- ANTT — atualização dos pisos mínimos em 17/07/2026:
  https://www.gov.br/antt/pt-br/assuntos/noticias-defeso-eleitoral/antt-atualiza-pisos-minimos-de-frete-do-transporte-rodoviario-de-cargas
- Detran-DF — requisitos de motofrete:
  https://sisman.maestro.detran.df.gov.br/visualizar-carta/pdf/?area=28&layout=true

## 14. Disponibilidade do entregador

O entregador possui dois modos de disponibilidade:

### Manual

- **Online:** recebe e pode aceitar novas corridas compatíveis.
- **Offline:** não recebe novas corridas.
- Ficar offline não cancela uma corrida que já esteja em andamento.

### Horário automático

O entregador configura, por dia da semana:

- dia ativo/inativo;
- horário de início;
- horário de fim.

O sistema verifica a agenda automaticamente e muda a disponibilidade sem exigir que o entregador abra a tela. Janelas que atravessam a meia-noite também são suportadas.

Exemplo:

- quinta-feira 19:00 → 02:00 mantém o entregador disponível até 02:00 da sexta-feira.

Mesmo no modo automático existe **Pausar agora**, para o entregador interromper corridas sem apagar seus horários. Depois ele usa **Retomar agenda automática**.

A conta só fica online quando:

1. documentação obrigatória está aprovada;
2. o modo escolhido autoriza disponibilidade;
3. não existe pausa manual da agenda;
4. a corrida atende área, distância, veículo e capacidade.

## 15. Feira ativa ou inativa

`Fair.active` representa a disponibilidade operacional da feira dentro do Feiraê.

- `active: true` ou campo ausente: feira disponível.
- `active: false`: feira inativa e escondida das escolhas do cliente.

Feiras inativas não aparecem:

- na lista de feiras;
- no seletor de feira do cabeçalho;
- como destino válido por link interno.

Esse estado é diferente de **aberta/fechada pelo horário**. Uma feira pode estar ativa no Feiraê, mas fechada naquele momento por causa do horário de funcionamento.

No produto final, ativar/desativar uma feira deve ser permissão administrativa da plataforma, não do feirante individual.
