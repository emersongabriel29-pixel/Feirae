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
- corrida ativa;
- coleta;
- rota;
- entrega;
- cancelamento;
- suporte;
- avaliações;
- financeiro local.

## 3. Limite do protótipo

A aplicação ainda não usa Supabase como fonte de verdade.

Persistência real atual:

- `localStorage`;
- bridges em `src/domain`;
- fixtures de demonstração.

Consequência: duas pessoas em aparelhos diferentes não compartilham estado real.

## 4. Cliente — carrinho

O carrinho exibe:

- itens;
- quantidade;
- subtotal;
- peso estimado.

Regra implementada:

- não misturar produtos de feiras diferentes.

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
5. define `calculatedDeliveryFee = fallbackDeliveryFee` para entrega;
6. aplica subsídio/promoção.

Portanto, hoje:

- peso filtra veículo;
- rota calcula distância/ETA para logística;
- peso **não** altera preço;
- distância real **não** altera preço;
- frete exibido vem de métrica fixture/local.

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

Regra local testada:

- logística só libera quando todas as bancas estão prontas.

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
