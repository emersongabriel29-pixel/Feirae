# Sistema de gestão administrativo — Feiraê

Atualizado em 26/09/2026.

Este documento corresponde ao painel separado solicitado para administrar o Feiraê sem alterar código.

## 1. Situação atual

Existe um **shell visual de gestão** em `public/gestao/`, já alinhado à identidade oficial Feiraê e preparado para servir de referência de UI.

O painel administrativo **operacional ainda não está implementado**.

O SQL possui papéis `admin` e `fair_manager`, mas ainda não existem:

- telas admin;
- RBAC granular;
- tabela de suspensões;
- tabela de auditoria;
- tabela de regras de taxas;
- catálogo global de veículos;
- tabela de estados/UF atendidos.

### Identidade visual da gestão

A gestão deve reutilizar os mesmos assets e tokens do app:

- `/brand/feirae-logo-horizontal.svg`;
- `/brand/feirae-symbol.svg`;
- Verde Feira, Verde Folha, Amarelo Feiraê, Creme Natural e Marrom Terra.

O shell atual mostra data/hora e a arquitetura visual dos módulos, mas mantém ações administrativas desabilitadas até existirem RBAC, auditoria, persistência e APIs reais.

## 2. Estados/UF atendidos

A gestão deve possuir uma tabela/configuração própria, por exemplo `service_regions`.

Campos necessários:

- `uf`;
- nome;
- ativo/inativo;
- aceita clientes;
- aceita feirantes;
- aceita entregadores;
- data de ativação;
- data de desativação;
- observação;
- admin responsável.

Ação: **ativar/desativar UF sem deploy**.

Desativar uma UF impede novos cadastros/operações naquela UF, mas não apaga histórico.

## 3. Feiras

Hoje SQL: `fairs.is_active`.

Gestão precisa permitir:

- cadastrar;
- editar nome;
- editar endereço;
- coordenadas;
- ativar/desativar;
- definir agenda;
- registrar fonte oficial;
- `verified_at`;
- `valid_from`;
- `valid_until`;
- exceções/feriados;
- feirantes vinculados;
- gestor responsável.

Desativar uma feira:

- remove de novas compras/publicação;
- preserva pedidos e histórico.

### Gate obrigatório de ativação/publicação

A gestão **não pode ativar uma feira para compras** enquanto houver configuração obrigatória incompleta. Antes de ativar, validar no mínimo:

- nome e região/UF atendida;
- endereço ou coordenadas válidas;
- agenda/horário definido e com estado de verificação conhecido;
- pelo menos um modo de atendimento habilitado (entrega e/ou retirada);
- se entrega estiver habilitada: política de frete/taxa vigente;
- vínculo operacional necessário para receber pedidos;
- status administrativo não suspenso/bloqueado.

A UI administrativa deve listar exatamente quais pendências impedem a ativação. Não usar apenas um botão ativo/inativo sem explicar o bloqueio.

**Situação atual:** esta é uma regra contratual do painel futuro. O painel administrativo runtime ainda não existe, portanto o repositório não deve afirmar que esse gate já está executando no backend.

## 4. Catálogo global de tipos de veículo

Isto é diferente de editar o veículo particular de um entregador.

Hoje os tipos estão hard-coded em `src/domain/vehicles.ts`:

| Tipo                         | Capacidade padrão atual |
| ---------------------------- | ----------------------: |
| Bicicleta                    |                   10 kg |
| Bicicleta cargueira/triciclo |                   40 kg |
| Moto                         |                   12 kg |
| Moto com baú                 |                   20 kg |
| Carro                        |                   80 kg |
| Utilitário/Pickup            |                  250 kg |
| Van                          |                  500 kg |
| Outro                        |                   10 kg |

A gestão deve mover isso para tabela, por exemplo `vehicle_types`:

- id;
- nome;
- ativo;
- capacidade padrão;
- capacidade máxima permitida;
- exige placa;
- exige CRLV;
- exige CNH;
- exige motofrete;
- ordem de exibição.

Exemplos de ação administrativa:

- desativar “Patinete” globalmente;
- ativar “Bicicleta cargueira”;
- alterar peso máximo permitido de Moto com baú;
- criar novo tipo sem alterar frontend.

Isso **não** significa editar a moto específica de João/entregador X.

## 5. Veículos dos entregadores

A gestão pode visualizar e moderar o cadastro individual:

- entregador;
- tipo global;
- marca/modelo;
- placa;
- capacidade declarada;
- status;
- documento.

Admin pode:

- bloquear veículo;
- pedir correção;
- aprovar documento;
- limitar capacidade ao teto do tipo.

O admin não deve “inventar” dados do veículo do entregador.

## 6. Taxas e valores

Hoje as taxas de produção não estão modeladas.

Criar regra versionada, por exemplo `pricing_rules`:

- tipo da taxa;
- versão;
- valor fixo;
- percentual;
- por km;
- por kg;
- mínimo;
- máximo;
- UF/região;
- feira opcional;
- início de vigência;
- fim;
- ativo;
- admin responsável.

Tipos mínimos:

- taxa administrativa;
- tarifa base de entrega;
- componente por distância;
- componente por peso;
- taxa mínima;
- subsídio da plataforma;
- limite promocional.

Alterar regra nunca reescreve pedidos antigos. Pedido guarda snapshot da regra aplicada.

## Pedido mínimo por banca

O modelo funcional é **mínimo por banca**, não mínimo global por carrinho.

### Controle do Feirante

O Feirante pode:

- não exigir mínimo;
- definir um valor mínimo para novos pedidos;
- visualizar o valor publicado ao Cliente.

### Governança da plataforma

A Gestão precisa controlar a política global, sem editar manualmente cada pedido:

- ativar/desativar a possibilidade de pedido mínimo;
- definir o **teto permitido** para as bancas;
- opcionalmente definir um valor de fallback para cadastros legados;
- listar bancas com e sem mínimo;
- identificar valores fora do padrão;
- registrar quem alterou a política e quando;
- versionar alterações para que pedidos antigos preservem a regra aplicada.

No protótipo atual:

- teto central = **R$ 100,00**;
- fallback para banca estática/legada sem configuração = **R$ 30,00**;
- banca nova criada pelo Feirante inicia **sem mínimo**;
- esses parâmetros ainda estão no código, porque o painel administrativo runtime ainda não foi implementado.

Antes de produção, o teto/fallback devem sair de constantes do frontend e passar para configuração administrativa persistida e validada no backend.

## 7. Feirantes

Admin deve acessar:

- perfil;
- PF/PJ;
- banca;
- feira/box;
- produtos;
- documentos;
- avaliações;
- pedidos;
- recebíveis;
- ocorrências.

Ações:

- aprovar;
- solicitar correção;
- suspender;
- banir;
- reativar;
- bloquear publicação;
- bloquear recebimento de novos pedidos;
- bloquear saque.

Toda sanção exige motivo e prazo quando temporária.

## 8. Entregadores

Admin deve acessar:

- perfil;
- documentos;
- veículos;
- regiões;
- disponibilidade;
- corridas;
- avaliações;
- incidentes;
- recebíveis.

Ações:

- aprovar;
- solicitar correção;
- suspender;
- banir;
- impedir ficar online;
- impedir aceitar corridas;
- bloquear veículo específico;
- bloquear saque.

## 9. Clientes

Admin pode:

- consultar conta;
- pedidos;
- tickets;
- cancelamentos;
- avaliações;
- sanções.

Ações possíveis:

- suspender;
- banir;
- reativar;
- restringir compras;
- restringir avaliações, se política permitir.

Não deve editar arbitrariamente histórico do cliente.

## 10. Documentos

Fila administrativa precisa mostrar:

- titular;
- papel;
- tipo;
- arquivo;
- validade;
- status;
- última revisão.

Ações:

- aprovar;
- rejeitar;
- pedir correção;
- definir motivo;
- registrar validade;
- suspender automaticamente se documento crítico expirar.

## 11. Pedidos

Busca por:

- ID;
- cliente;
- banca;
- feira;
- entregador;
- período;
- status.

Visualização:

- itens;
- snapshots;
- estoque;
- pagamento;
- bancos/recebedores;
- entrega;
- eventos;
- suporte;
- avaliações.

Admin não altera status com dropdown livre.

Ações excepcionais devem chamar função de domínio e gerar evento.

## 12. Entregas

Gestão vê:

- fila;
- pedido;
- entregador;
- veículo;
- peso;
- rota;
- ETA;
- aceite;
- coleta;
- entrega;
- cancelamento;
- incidente.

Pode:

- remover entregador antes da coleta;
- bloquear corrida;
- abrir incidente;
- escalar suporte.

## 13. Financeiro

Painel precisa separar:

- pagamento do cliente;
- ledger;
- recebível do feirante;
- recebível do entregador;
- comissão Feiraê;
- taxa PSP;
- subsídio;
- estorno;
- repasse.

Não editar saldo diretamente.

Ajuste financeiro = novo lançamento auditável.

## 14. Suporte

Ticket precisa ter:

- protocolo;
- pedido/corrida;
- solicitante;
- tópico;
- descrição;
- prioridade;
- responsável;
- status;
- timestamps;
- mensagens.

## 15. Suspensões

Criar tabela específica, por exemplo `account_restrictions`:

- profile_id;
- role;
- restriction_type;
- reason;
- starts_at;
- ends_at;
- active;
- created_by;
- evidence/reference.

Tipos:

- login;
- publicar;
- vender;
- ficar online;
- aceitar corrida;
- sacar;
- avaliar.

## 16. Permissões administrativas

O enum atual `admin/fair_manager` é insuficiente para menor privilégio.

RBAC mínimo:

| Permissão         | Suporte  | Operações | Documentos    | Financeiro | Superadmin |
| ----------------- | -------- | --------- | ------------- | ---------- | ---------- |
| ver pedidos       | sim      | sim       | limitado      | sim        | sim        |
| responder ticket  | sim      | sim       | não           | não        | sim        |
| aprovar documento | não      | não       | sim           | não        | sim        |
| suspender conta   | limitado | sim       | por documento | não        | sim        |
| alterar taxa      | não      | não       | não           | sim        | sim        |
| repasse/ajuste    | não      | não       | não           | sim        | sim        |
| gerenciar admin   | não      | não       | não           | não        | sim        |

## 17. Auditoria

Criar `admin_audit_log`.

Registrar:

- admin;
- permissão usada;
- ação;
- entidade;
- ID;
- estado anterior;
- estado novo;
- motivo;
- timestamp;
- request/correlation ID.

Ações críticas não podem ser apagadas pelo próprio admin.

## 18. Estruturas SQL ainda faltantes

Para este painel funcionar ainda faltam migrations para:

- `service_regions`;
- `vehicle_types`;
- `pricing_rules`;
- `account_restrictions`;
- `admin_roles/admin_permissions` ou equivalente;
- `admin_audit_log`.

O painel não deve ser construído em cima de constantes hard-coded do frontend.

## Gestão de versões jurídicas

A área de gestão futura precisa tratar termos como documentos versionados, nunca como texto editável que substitui retroativamente o que já foi aceito.

Funções necessárias:

- visualizar versões publicadas;
- criar nova versão em rascunho;
- comparar alterações;
- marcar a partir de quando uma versão entra em vigor;
- definir quais papéis precisam assinar;
- exigir nova assinatura quando a alteração for material;
- consultar quem aceitou cada versão;
- consultar data/hora e fingerprint do aceite;
- exportar trilha para auditoria/disputa;
- impedir exclusão ou edição silenciosa de versão já assinada;
- suspender a ativação operacional de Feirante/Entregador sem versão vigente aceita.

A publicação de nova versão jurídica deve exigir permissão administrativa específica e gerar evento de auditoria.

Essa gestão **ainda não está implementada no painel runtime**; é contrato obrigatório para a futura área de gestão.
