# Área de gestão — Feiraê

## Decisão de arquitetura

O painel administrativo deve ser um aplicativo web separado do app usado por Cliente, Feirante e Entregador.

Nesta implementação ele fica em `/admin` dentro do mesmo repositório apenas para facilitar revisão e versionamento enquanto o produto ainda está em construção. O diretório possui HTML/CSS/JS próprios e pode ser publicado separadamente. Quando o fluxo estiver estabilizado, a recomendação é movê-lo para um repositório `Feirae-Gestao`.

Separar repositórios ajuda em deploy e organização, mas a segurança real depende de autenticação, RLS, permissões e do fato de credenciais secretas nunca irem para o frontend.

## Diagnóstico do projeto atual

O Feiraê já possui domínio de:

- Cliente;
- Feirante;
- Entregador;
- Feiras e bancas;
- Produtos e estoque;
- Carrinho e pedidos;
- Logística/rotas;
- Veículos e capacidade;
- Pagamentos;
- Carteira e repasses;
- Promoções;
- Avaliações;
- Suporte;
- Documentos e aprovação.

A base de dados prevista nas migrations já contempla boa parte dessas entidades.

Ao mesmo tempo, o frontend atual ainda mantém diversos dados e regras em código/local state, por exemplo:

- lista de feiras;
- categorias;
- capacidades padrão de veículos;
- parte do catálogo e métricas;
- sessão e pedidos de demonstração.

Por isso, o painel administrativo sozinho não deve ser tratado como fonte efetiva até cada módulo do app passar a consumir o banco/runtime configuration correspondente.

## Funções do painel

### 1. Dashboard

- total de pedidos;
- feirantes aguardando aprovação;
- entregadores aguardando aprovação;
- documentos pendentes;
- tickets de suporte abertos;
- saques solicitados;
- pedidos recentes;
- status das integrações.

### 2. Configurações gerais

Editar sem código:

- modo manutenção;
- habilitação de novos cadastros;
- contatos de suporte;
- texto de consentimento do WhatsApp;
- política de cancelamento;
- raio de entrega padrão;
- peso operacional máximo;
- tempo de oferta de corrida;
- saque mínimo;
- prazo padrão de liberação;
- política de carrinho multi-feira.

Novas configurações podem ser adicionadas por linha em `platform_settings`.

### 3. Feiras

- criar feira;
- editar nome, endereço e descrição;
- ativar/desativar;
- editar horários;
- posteriormente vincular gestor da feira e regras locais.

### 4. Regiões de operação

- estados/cidades/regiões atendidas;
- ativar/desativar pedidos;
- ativar/desativar cadastro de feirantes;
- ativar/desativar entregas;
- raio padrão por região;
- ordem de exibição.

### 5. Feirantes

- consultar cadastro;
- aprovar/reprovar operação;
- revisar documentos;
- acompanhar banca;
- consultar produtos;
- acompanhar promoções;
- consultar pedidos e ocorrências;
- acompanhar repasses.

### 6. Entregadores

- consultar cadastro;
- aprovar/reprovar operação;
- revisar documentos;
- consultar veículos;
- consultar capacidade;
- acompanhar disponibilidade;
- acompanhar corridas;
- acompanhar avaliações;
- acompanhar repasses.

### 7. Documentos e onboarding

Configurar por papel e tipo de veículo:

- documento obrigatório;
- documento crítico;
- necessidade de validade;
- instruções;
- exigência específica por veículo.

Operação:

- pendente;
- em análise;
- aprovado;
- correção solicitada;
- rejeitado;
- motivo da correção;
- validade.

### 8. Veículos

Parâmetros sem código:

- tipos de veículo;
- capacidade padrão;
- exigência de placa;
- exigência de documento;
- exigência de CNH;
- ativo/inativo;
- ordem.

Os valores atuais de bicicleta, moto, carro, pickup e van passam a ter uma fonte de configuração própria.

### 9. Pedidos

- listar e pesquisar;
- consultar status;
- visualizar valor, frete e pagamento;
- permitir intervenção administrativa auditada;
- futuramente abrir detalhe completo com timeline, bancas, itens, entregador, pagamento e eventos.

### 10. Entregas

- corrida vinculada ao pedido;
- entregador atribuído;
- status;
- taxa;
- cancelamento e motivo;
- timestamps de aceite/conclusão;
- intervenção auditada.

### 11. Frete

Criar regras de preço com:

- valor base;
- preço por quilômetro;
- preço por minuto;
- preço por quilo;
- cobrança mínima;
- cobrança máxima;
- remuneração mínima do entregador;
- percentual da plataforma;
- distância máxima;
- região;
- veículo;
- prioridade;
- vigência.

A regra final deve ser calculada no backend. O painel somente administra parâmetros.

### 12. Taxas da plataforma

Configurar:

- taxa por pedido;
- taxa do feirante;
- taxa administrativa da entrega;
- taxa relacionada ao pagamento;
- percentual;
- valor fixo;
- prioridade;
- período de vigência.

### 13. Meios de pagamento

Ativar/desativar:

- Pix;
- cartão de crédito;
- cartão de débito;
- crédito Feiraê;
- dinheiro na entrega;
- maquininha na entrega;
- outros futuros.

Também é possível definir se o método:

- aparece ao cliente;
- depende do feirante;
- depende do entregador;
- exige provedor online.

Credenciais permanecem fora do painel.

### 14. Cancelamentos

Configurar:

- motivos por papel;
- etapa do fluxo;
- exigência de justificativa;
- abertura automática de suporte;
- eventual valor de penalidade;
- ativação e ordem.

### 15. Promoções

- consultar promoções dos feirantes;
- ativar/desativar;
- editar período;
- pedido mínimo;
- desconto;
- patrocínio de frete pelo feirante.

### 16. Financeiro e repasses

- consultar valor;
- papel do recebedor;
- pendente;
- disponível;
- solicitado;
- pago;
- falhou;
- referência do provedor.

O painel não deve executar transferência bancária diretamente pelo navegador. A liquidação real é responsabilidade do backend/provedor.

### 17. Avaliações

- consultar nota/comentário;
- identificar autor e alvo;
- ocultar/exibir;
- registrar motivo da moderação.

### 18. Suporte

- listar tickets;
- pedido relacionado;
- assunto;
- prioridade;
- detalhes;
- aberto;
- resolvido;
- fechado.

### 19. Conteúdo

Administrar sem deploy:

- banners;
- textos;
- chamadas;
- imagens;
- botões;
- URLs;
- áreas do aplicativo;
- período de exibição;
- ativo/inativo.

### 20. Avisos

- aviso geral;
- aviso por público;
- informativo;
- sucesso;
- atenção;
- crítico;
- início/fim da publicação.

### 21. Mensagens

Templates para:

- notificações internas;
- push;
- e-mail;
- WhatsApp;
- SMS.

O painel armazena textos e parâmetros, não tokens dos provedores.

### 22. Feature flags

Ligar/desligar funcionalidades sem deploy, como:

- pagamento na entrega;
- checkout multi-banca;
- agenda automática do entregador;
- atualizações via WhatsApp;
- promoções;
- carteira.

### 23. Integrações

Registrar:

- provedor;
- ambiente sandbox/produção;
- ativo/inativo;
- status;
- última verificação;
- parâmetros públicos;
- observações.

Não armazenar:

- service role;
- secret keys;
- client secrets;
- tokens privados;
- chaves de webhook.

### 24. LGPD

- acesso aos dados;
- correção;
- exclusão;
- portabilidade;
- retirada de consentimento;
- outras solicitações;
- status;
- responsável;
- resolução.

### 25. Administração e auditoria

- autenticação obrigatória;
- somente `role=admin`;
- futura granularidade por `admin_permissions`;
- log de alterações;
- antes/depois;
- administrador responsável;
- entidade;
- registro;
- data/hora.

## O que deve permanecer fora do painel

Mesmo com a gestão pronta, alguns itens continuam exigindo código/infraestrutura:

- migrations de banco;
- políticas RLS;
- funções server-side;
- algoritmos estruturais;
- segredos de integração;
- assinatura e validação de webhooks;
- regras antifraude;
- alterações de arquitetura;
- novos componentes/telas do app;
- correções de bugs;
- deploys de versão.

## Contrato com o aplicativo

Para cumprir a meta “mudar configuração sem mexer no código”, o app final deve consultar as tabelas de runtime configuration em vez de manter valores fixos.

Prioridade de migração:

1. `vehicle_type_rules`;
2. `service_regions`;
3. `payment_method_rules`;
4. `cancellation_reasons`;
5. `feature_flags`;
6. `platform_settings`;
7. `content_blocks`;
8. regras de frete/taxas no backend.

Até essa migração do frontend/backend ser concluída, o painel pode salvar corretamente as configurações, mas telas ainda baseadas em dados locais não refletirão todas as mudanças.
