# Produtos, unidades e métricas — Feiraê

Atualizado em 26/09/2026 contra `vendorModel.ts`, `products` SQL e `saveProduct()`.

## 1. Campos implementados hoje

`VendorProduct` possui:

- `id`;
- `name`;
- `category`;
- `description`;
- `stock`;
- `minStock`;
- `active`;
- `price`;
- `saleUnit`;
- `packageSize`;
- `weightKg`;
- `photoDataUrl`;
- `photoName`.

## 2. Validação real ao salvar

`saveProduct()` exige:

- nome não vazio;
- preço > 0;
- peso logístico > 0.

Não exige hoje:

- foto;
- descrição;
- estoque > 0;
- origem;
- validade;
- código sanitário;
- variação.

Se estoque = 0:

- produto é salvo;
- `active` é forçado para false;
- UI o trata como esgotado.

## 3. Categorias disponíveis na UI atual

Exatamente as opções de `productCategories`:

1. Frutas
2. Verduras e legumes
3. Folhas e ervas
4. Cereais e grãos
5. Ovos
6. Carnes e aves
7. Pescados e frutos do mar
8. Laticínios
9. Doces e produtos caseiros
10. Pães e panificados
11. Refeições e lanches
12. Bebidas
13. Flores
14. Plantas
15. Artesanato
16. Confecções
17. Calçados
18. Bolsas e acessórios
19. Bijuterias
20. Ferramentas
21. Utensílios domésticos
22. Eletrônicos
23. Bazar e papelaria
24. Tecidos e armarinho
25. Produtos agropecuários
26. Outros

Não estão disponíveis hoje como categoria própria:

- Temperos e raízes;
- Artigos religiosos;
- Serviços permitidos.

Se forem desejadas, precisam ser adicionadas ao código/schema/admin.

## 4. Unidades disponíveis na UI atual

Exatamente `productSaleUnits`:

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
- vaso.

`serviço` não existe hoje na lista.

## 5. Foto

O frontend atual suporta **uma foto** por produto:

- `photoDataUrl`;
- `photoName`.

Não suporta hoje:

- galeria;
- múltiplas fotos;
- reordenação;
- imagem principal entre várias.

Foto não é obrigatória para salvar/publicar.

## 6. SQL atual

Tabela `products` possui:

- vendor_id;
- store_id;
- category_id;
- name;
- description;
- price;
- unit;
- stock;
- available;
- promotion_price;
- min_stock;
- weight_kg;
- archived_at;
- timestamps.

Não possui:

- `package_size`;
- foto/path;
- volume;
- variações;
- origem;
- validade;
- atributos por categoria.

## 7. Gap de foto

Não existe tabela `product_images`.

Produção precisa definir, por exemplo:

- product_id;
- storage_path;
- position;
- is_primary;
- alt_text;
- created_at.

## 8. Peso comercial x peso logístico

O campo atual `weightKg` é peso logístico por unidade comercial.

Exemplo atual:

```
Cesta de frutas
saleUnit = cesta
packageSize = 1 cesta
weightKg = 4
```

Ao comprar 3:

```
peso estimado = 4 × 3 = 12 kg
```

Esse peso entra na compatibilidade de veículo.

## 9. Peso real no preparo

Pedido por banca permite atualizar `actualWeightKg`.

`orderBridge` propaga o peso real para o item do pedido.

Depois disso, logística soma `order.items.weightKg`.

## 10. Produto por peso variável

O frontend atual ainda não possui mecanismo de autorização adicional de cobrança depois da pesagem.

Portanto, antes de PSP com autorização incremental, o catálogo deve preferir apresentações previsíveis, por exemplo:

- 250 g;
- 500 g;
- 1 kg;
- bandeja;
- pacote.

Não documentar ajuste financeiro pós-pesagem como implementado.

## 11. Modelo de preço

Hoje existe essencialmente:

```
preço por saleUnit
```

Não existem campos estruturados de:

- `fixed_unit`;
- `fixed_package`;
- `weight`;
- `volume`;
- `length`;
- `service`.

Esses modelos são evolução futura e exigem schema/UI.

## 12. Matriz de evolução por categoria

A tabela abaixo é requisito futuro, não estado atual.

| Categoria atual | Campo futuro útil | Existe hoje? |
| --- | --- | --- |
| Frutas | variedade/maturação/origem | não |
| Verduras e legumes | variedade/origem | não |
| Folhas e ervas | peso médio por maço | não |
| Ovos | unidades/classificação | apenas texto livre |
| Carnes e aves | corte/conservação/inspeção | não |
| Pescados e frutos do mar | espécie/apresentação/conservação | não |
| Laticínios | validade/conservação | não |
| Caseiros | ingredientes/alergênicos/validade | não |
| Bebidas | volume/tipo/conservação | apenas unidade/texto |
| Plantas | espécie/tamanho vaso | não |
| Confecções | tamanho/cor/material | não |
| Calçados | numeração/cor | não |
| Eletrônicos | marca/modelo/condição/garantia | não |

## 13. Estoque

Hoje:

- número único em `stock`;
- ajuste local;
- `minStock`;
- zero desativa produto.

Não existe:

- lote;
- validade por lote;
- reserva SQL;
- inventário por unidade/depósito;
- histórico server-side.

## 14. Status do produto

Frontend distingue na prática:

- ativo/com estoque: à venda;
- ativo=false com estoque > 0: pausado;
- estoque = 0: esgotado.

SQL possui `available` e `archived_at`, mas essa semântica ainda precisa ser alinhada ao frontend.

## 15. Requisitos metrológicos

As regras do Inmetro continuam sendo referência para produtos pré-medidos/vendidos a peso, mas o Feiraê atual **não valida automaticamente** conformidade metrológica.

Fontes:

- https://www.gov.br/inmetro/pt-br/assuntos/metrologia-legal/produtos-pre-embalados
- https://www.gov.br/inmetro/pt-br/acesso-a-informacao/perguntas-frequentes/metrologia-legal/pre-medidos/qual-a-portaria-das-regras-para-comercializacao-de-alimentos-a-peso-tara

Antes de produção, os campos regulatórios devem ser definidos por categoria real vendida, não por uma matriz genérica fixa.
