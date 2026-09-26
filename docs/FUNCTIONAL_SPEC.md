# Especificação funcional consolidada — Feiraê

Atualizado em 26/09/2026.

## Princípio central

Carrinho, checkout, pagamento, pedido, banca, logística, rastreamento, avaliações e financeiro devem operar sobre o mesmo pedido e o mesmo identificador. Nenhuma tela deve criar um estado paralelo para representar a mesma compra.

Fluxo principal:

```
Feira → Banca → Produto → Carrinho → Peso → Endereço → Frete → Pagamento
→ Pedido → Confirmação da banca → Separação → Pronto para coleta
→ Oferta ao entregador → Coleta → Rota → Entrega → Avaliações → Repasse
```

Cada mudança de estado deve registrar data/hora e, quando aplicável, ator e motivo.

## Estado atual do protótipo

Esta especificação descreve tanto comportamento já implementado quanto requisitos de produção.

Já funciona localmente:

- login/cadastro local com senha;
- edição de nome/e-mail/senha;
- pedido unificado;
- catálogo compartilhado;
- multi-banca;
- estoque;
- retirada/entrega;
- promoções;
- avaliações;
- suporte;
- carteira/reembolso;
- documentos locais;
- preferências.

Ainda exige backend/integração:

- Auth real;
- RLS;
- pagamentos;
- Storage privado;
- KYC;
- roteamento/rastreamento de produção;
- push/WhatsApp;
- split/repasse real.

Estados canônicos: [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md).

## Contas, formulários e edição

Quando a interface exibir **Salvar**, o formulário deve trabalhar com rascunho e persistir somente ao salvar. Quando houver risco de alteração acidental, oferecer **Descartar/Cancelar**.

Regras:

- senha nunca deve ser ignorada pelo fluxo de login;
- senha não deve ser armazenada junto do perfil comum;
- alteração de e-mail deve atualizar a identidade e referências relacionadas;
- opção indisponível deve estar desabilitada, não receber clique vazio;
- toggle de configuração precisa produzir efeito observável;
- upload precisa armazenar/enviar o arquivo, não apenas mostrar o nome.

A auditoria específica está em [UI_INTERACTION_AUDIT.md](UI_INTERACTION_AUDIT.md).

## Cliente

### Endereços

- Permitir endereço manual.
- Permitir “Usar minha localização atual”.
- O GPS fornece latitude/longitude.
- Quando o serviço de geocodificação reversa responder, preencher CEP, rua/quadra, bairro/setor, cidade e UF.
- Número, complemento e referência permanecem editáveis.
- Endereços podem ser editados, excluídos e marcados como principal.

### Carrinho

Exibir:

- itens;
- quantidade;
- peso estimado;
- subtotal.

Não exibir “veículo indicado”. O cliente não escolhe nem precisa conhecer a classe de veículo usada na distribuição da corrida.

Uma sacola não deve misturar produtos de feiras diferentes sem um fluxo explícito para isso.

### Peso e veículo

Peso é uma restrição de compatibilidade, não uma recomendação.

Regra:

```
veículo pode receber a corrida se:
veículo.ativo
E veículo.documentação_válida_quando_exigida
E veículo.capacidade_kg >= pedido.peso_total_kg
```

Exemplo:

- pedido 10 kg;
- bicicleta 15 kg: compatível;
- moto 25 kg: compatível;
- carro 100 kg: compatível.

Pedido 100 kg:

- bicicleta 15 kg: incompatível;
- moto 25 kg: incompatível;
- carro 150 kg: compatível.

## Pagamentos

Separar o momento do pagamento da forma de pagamento.

### Pagar agora

- Pix;
- cartão de crédito;
- cartão de débito.

### Pagar na entrega

- dinheiro;
- cartão na maquininha, quando disponível na operação.

Para dinheiro:

- perguntar se precisa de troco;
- se sim, solicitar “Troco para quanto?”.

Para cartões:

- exibir bandeira;
- nunca armazenar CVV;
- na integração real, usar token do provedor em vez do número completo.

## Frete e taxas

O preço da entrega deve ser calculado a partir de dados da rota e da carga. A arquitetura deve receber do provedor de rotas:

- distância do entregador até a banca;
- distância da banca até o cliente;
- distância total;
- tempo estimado;
- eventuais pedágios/regras de área quando aplicável.

A regra comercial final deve ser configurável e não espalhada pelas telas. O modelo previsto é:

```
frete_calculado =
  tarifa_base
  + componente_distância
  + componente_peso/volume
  + adicionais_operacionais
```

Depois são aplicados subsídios/descontos:

```
frete_cliente = max(0, frete_calculado - subsidio_feirante - subsidio_plataforma)
```

A remuneração do entregador é calculada separadamente do valor promocional mostrado ao cliente. “Frete grátis” não significa corrida sem remuneração.

No checkout, apresentar quando houver subsídio:

- Frete calculado;
- Desconto/subsídio;
- Você paga de entrega;
- Total.

As tarifas comerciais definitivas ainda devem ser definidas antes da integração do provedor. Até lá, valores de desenvolvimento não devem virar regra hard-coded de produção.

## Entregador

### Disponibilidade

O entregador controla:

- disponível/indisponível;
- agenda automática opcional;
- horário de início/fim;
- raio máximo;
- distância preferida;
- regiões;
- veículos ativos.

A agenda pode atravessar a meia-noite.

Uma corrida só pode aparecer/ser aceita se:

- cadastro do entregador estiver aprovado;
- entregador estiver disponível;
- horário automático permitir;
- corrida estiver dentro do raio;
- destino estiver nas regiões configuradas, quando houver filtro;
- existir veículo ativo e compatível com o peso;
- documentação do veículo estiver aprovada quando exigida.

### Oferta da corrida

Antes de aceitar, mostrar:

- pedido;
- feira;
- banca;
- região;
- distância até a banca;
- distância banca → cliente;
- distância total;
- previsão em minutos;
- peso total;
- quantidade/resumo dos itens;
- remuneração;
- veículo compatível disponível.

### Veículos

Permitir:

- cadastrar;
- editar;
- excluir;
- ativar/desativar;
- alterar capacidade.

Veículos com placa exigem:

- placa brasileira válida no padrão antigo ou Mercosul;
- documento do veículo;
- estado de validação do documento.

Bicicletas não exigem placa/documento de veículo.

## Feirante

### Produtos

Estados distintos:

- À venda;
- Pausado pelo feirante;
- Estoque esgotado.

Estoque zero não deve ser descrito simplesmente como “Pausado”.

Permitir:

- cadastrar;
- editar;
- pausar/reativar;
- ajustar estoque;
- excluir do catálogo.

Pedidos antigos preservam seus snapshots mesmo se um produto sair do catálogo.

### Promoções

Tipos previstos:

- percentual;
- valor fixo;
- compre X leve Y;
- desconto por produto/categoria;
- frete grátis;
- oferta por horário;
- cupom;
- combo.

Campos:

- nome;
- regra;
- valor/percentual quando aplicável;
- produto/categoria alvo;
- pedido mínimo;
- limite de usos;
- início;
- fim.

Estados:

- Agendada;
- Ativa;
- Encerrada.

Permitir editar, encerrar/reativar e excluir.

### Horários

“Usar horário padrão da feira” e “Definir meu próprio horário” são escolhas mutuamente exclusivas.

Horário que fecha depois da meia-noite pertence ao dia seguinte. Exemplo:

```
Segunda 19:00 → 02:00
```

significa abertura segunda às 19h e fechamento terça às 02h.

Exibir estado operacional:

- Aberta agora;
- Fecha às HH:MM;
- Fechada;
- Abre [dia] às HH:MM;
- Em pausa / volta às HH:MM.

## Cancelamentos

Sempre registrar:

- pedido/corrida;
- ator;
- motivo;
- data/hora;
- descrição adicional quando necessária.

Quando o motivo for “Outro”, a descrição é obrigatória.

Antes da coleta, cliente pode usar cancelamento simples de acordo com a política. Depois da coleta, abrir ocorrência/suporte em vez de apagar o fluxo.

## Rastreamento

Estados apresentados ao cliente:

1. Pedido recebido
2. Confirmado pela banca
3. Em separação
4. Pronto para coleta
5. Entregador a caminho da banca
6. Pedido coletado
7. A caminho do cliente
8. Entregue

Depois que houver entregador atribuído, exibir:

- nome;
- veículo;
- placa parcialmente mascarada quando aplicável;
- distância;
- previsão;
- suporte;
- mapa/rastreamento quando o provedor estiver integrado.

## Favoritos e destaques

Favoritos:

- produtos;
- bancas/lojas.

Destaques da feira devem permitir adicionar o produto ao carrinho diretamente.

## Persistência e backend

No protótipo atual, parte dos fluxos usa persistência local para validação da experiência. Na implantação real:

- banco/backend é a fonte de verdade;
- transições de pedido são validadas no servidor;
- pagamento e repasse vêm do provedor;
- roteamento fornece distância/tempo;
- cada transição gera evento auditável;
- valores financeiros não são confiados ao frontend.

## Critério de aceite de interface

Todo botão, card clicável, seletor, toggle ou campo exibido deve:

1. executar uma ação;
2. persistir a alteração apropriada;
3. refletir a mudança nas telas relacionadas;
4. não exibir texto interno de desenvolvimento ao usuário final.
