# Produtos, unidades e métricas — Feiraê

## Problema que este documento resolve

“Preço” sozinho não basta.

O sistema precisa saber **como o produto é vendido**, **qual quantidade o cliente está comprando** e **quanto isso representa para o cálculo da entrega**.

Todo produto deve ter:

- nome;
- categoria;
- foto principal;
- fotos adicionais opcionais;
- descrição;
- modelo de venda;
- unidade comercial;
- preço por unidade comercial;
- quantidade mínima;
- incremento;
- estoque;
- peso real/estimado para logística;
- volume;
- disponibilidade;
- origem/feirante;
- informações específicas da categoria.

## Modelos de preço

### fixed_unit
Preço fechado por unidade.

Exemplos:
- 1 abacaxi;
- 1 vaso;
- 1 camiseta;
- 1 cesta pronta.

### fixed_package
Preço fechado por embalagem/pacote com conteúdo conhecido.

Exemplos:
- bandeja de 500 g;
- saco de 5 kg;
- dúzia de ovos;
- garrafa de 1 L.

### weight
Preço por massa.

Exemplos:
- R$/kg;
- R$/100 g.

Para o MVP, produtos de peso variável podem ser oferecidos em frações/pacotes predefinidos para evitar diferença financeira depois do pagamento.

### volume
Preço por volume.

Exemplos:
- R$/L;
- R$/500 ml.

### length
Preço por comprimento.

Exemplos:
- tecido por metro;
- mangueira por metro.

### service
Preço por serviço.

Usar somente em feiras/boxes cuja atividade permitida inclua serviço.

## Unidades permitidas

- kg;
- g;
- un;
- dúzia;
- par;
- maço;
- bandeja;
- pacote;
- saco;
- caixa;
- cesta;
- kit;
- porção;
- L;
- ml;
- m;
- vaso;
- serviço.

A UI deve mostrar de forma explícita, por exemplo:
- R$ 8,90 / kg
- R$ 6,00 / maço
- R$ 18,00 / dúzia
- R$ 25,00 / bandeja 500 g

## Matriz por categoria

| Categoria | Unidade principal sugerida | Alternativas | Campos adicionais obrigatórios/sugeridos |
|---|---|---|---|
| Frutas | kg ou un | bandeja, caixa, cesta | variedade, origem, maturação opcional, peso logístico |
| Verduras e legumes | kg ou un | maço, bandeja, pacote | variedade, origem, peso logístico |
| Folhas e ervas | maço ou un | pacote, g | variedade, peso por maço |
| Cereais e grãos | kg | g, pacote, saco | peso líquido, origem/marca quando aplicável |
| Temperos e raízes | kg ou g | maço, pacote | peso líquido |
| Ovos | dúzia | bandeja, un | quantidade de unidades, classificação quando aplicável |
| Carnes e aves | kg | g, pacote | corte, conservação, peso, origem/inspeção aplicável |
| Pescados e frutos do mar | kg | g, bandeja | espécie, apresentação, conservação, peso líquido/drenado quando aplicável |
| Laticínios | kg ou un | g, ml, L, pacote | peso/volume, conservação, validade |
| Doces e produtos caseiros | un ou kg | g, pote, pacote | peso/volume, validade, ingredientes/alergênicos quando aplicável |
| Pães e panificados | un ou kg | pacote, bandeja | quantidade/peso, validade |
| Refeições/lanches | un ou porção | combo | composição, tamanho, alergênicos quando aplicável |
| Bebidas | L ou ml | un, garrafa | volume, tipo, conservação |
| Flores | un ou maço | vaso, buquê | espécie, tamanho opcional |
| Plantas | vaso ou un | kit | espécie, tamanho do vaso/planta, peso aproximado |
| Artesanato | un | kit, par | material, dimensões, peso |
| Confecções | un | kit | tamanho, cor, material |
| Calçados | par | un | numeração, cor/material |
| Bolsas e acessórios | un | kit | dimensões, material, peso |
| Bijuterias | un | par, kit | material, tamanho |
| Artigos religiosos | un | kit | material/dimensões |
| Ferramentas | un | kit | marca/modelo, dimensões, peso |
| Utensílios domésticos | un | kit, conjunto | material, dimensões, peso |
| Eletrônicos | un | kit | marca, modelo, condição, garantia quando aplicável |
| Bazar/papelaria | un | pacote, kit | marca/modelo quando aplicável |
| Tecidos/armarinho | m | un, rolo, pacote | largura, composição, comprimento |
| Produtos agropecuários | kg ou un | saco, pacote | tipo, peso/volume, regras específicas |
| Serviços permitidos | serviço | — | descrição, duração/preço, atividade autorizada |

## Peso comercial x peso logístico

São conceitos diferentes.

Exemplo:

Produto:
- venda: 1 cesta;
- preço: R$ 60/cesta;
- peso logístico: 8 kg.

Mesmo quando a venda é por unidade, o Feiraê precisa de `weightKg` para selecionar veículo.

## Produtos de peso variável

Fluxo recomendado:

1. cliente escolhe quantidade aproximada;
2. sistema mostra preço estimado;
3. feirante pesa;
4. peso final é registrado;
5. diferença financeira só pode ser aplicada com mecanismo de autorização do pagamento.

Para o MVP sem integração avançada de pagamento, preferir:
- 250 g;
- 500 g;
- 1 kg;
- 2 kg;
- pacotes fechados.

Isso evita cobrança adicional posterior.

## Fotos

Cadastro de produto deve permitir:

- pelo menos 1 foto principal antes de publicar;
- múltiplas fotos adicionais;
- reordenar;
- remover/substituir;
- preview antes de salvar.

Na fase real:
- validar tipo MIME/magic bytes;
- limitar tamanho;
- gerar thumbnails;
- remover metadados desnecessários;
- moderar conteúdo quando necessário.

## Edição

Produto existente deve permitir editar:

- nome;
- fotos;
- descrição;
- categoria;
- preço;
- unidade;
- peso;
- estoque;
- disponibilidade;
- variações;
- origem;
- dados específicos da categoria.

Mudança de preço não deve ser “+ R$ 1”. Deve abrir edição explícita.

## Estoque

Unidade do estoque acompanha o modelo de venda:

- produto por unidade: estoque em unidades;
- pacote fechado: estoque em pacotes;
- produto por peso: estoque em kg/g;
- serviço: capacidade/agenda, não estoque físico.

## Metrologia e conformidade

Para produtos pré-embalados, a indicação quantitativa deve refletir a natureza do produto:
- sólidos/granulados/gel: massa;
- líquidos: volume;
- semissólidos: massa ou volume;
- vendidos por quantidade: número de unidades;
- vendidos por comprimento: unidade de comprimento.

Alimentos vendidos a peso exigem balança apropriada e apresentação de peso/preço conforme regras do Inmetro.

Fontes:
- Inmetro — Produtos Pré-embalados:
  https://www.gov.br/inmetro/pt-br/assuntos/metrologia-legal/produtos-pre-embalados
- Inmetro — alimentos a peso/tara:
  https://www.gov.br/inmetro/pt-br/acesso-a-informacao/perguntas-frequentes/metrologia-legal/pre-medidos/qual-a-portaria-das-regras-para-comercializacao-de-alimentos-a-peso-tara
- Lei distrital nº 6.956/2021: feirante deve manter preço exposto, procedência dos produtos e balança aferida quando aplicável.
