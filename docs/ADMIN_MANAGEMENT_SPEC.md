# Sistema de gestão administrativo — Feiraê

Atualizado em 26/09/2026.

Este documento descreve o estado **implementado** da Área de Gestão e os limites que continuam dependentes de infraestrutura externa.

## 1. Estado atual

A Gestão está implementada em `/admin` como aplicação web separada do app de Cliente, Feirante e Entregador.

Arquivos principais:

- `admin/index.html`;
- `admin/app.js`;
- `admin/modules.js`;
- `admin/styles.css`;
- `supabase/migrations/0003_management_console.sql`;
- `supabase/functions/admin-actions/index.ts`;
- `supabase/functions/document-upload/index.ts`;
- `supabase/config.toml`;
- `admin/management.test.js`;
- `admin/core.test.js`.

A migration ainda precisa ser aplicada no **projeto Supabase correto do Feiraê** e a Edge Function precisa ser publicada nesse mesmo ambiente.

## 2. Segurança administrativa

Acesso exige:

1. Supabase Auth;
2. `profiles.role = 'admin'`;
3. linha ativa em `admin_access`;
4. MFA/TOTP com sessão em `aal2`;
5. permissão granular para o módulo, ou `admin_access.is_superadmin = true`.

Não existe mais a regra “admin sem permissões = acesso total”.

Administradores que já existiam antes da migration recebem `is_superadmin=true` apenas no bootstrap inicial. Novos administradores entram com menor privilégio.

A permissão curinga `*` foi removida. Superadmin é uma propriedade explícita e protegida.

O último superadmin ativo não pode perder esse nível por uma ação administrativa comum.

## 3. Papéis administrativos

O painel aceita somente `admin`.

O enum legado `fair_manager` permanece no schema por compatibilidade histórica, mas está **reservado e desativado**. Novas atribuições desse papel são bloqueadas até existir um modelo realmente limitado por feira.

Não existe falsa sensação de segurança permitindo um `fair_manager` sem escopo.

## 4. Operação

### Dashboard

Exibe:

- pedidos;
- aprovações pendentes;
- suporte;
- documentos;
- repasses;
- pedidos recentes;
- integrações.

### Alertas

`operational_alerts` persiste:

- pedido parado;
- entrega parada;
- documento vencendo;
- falha de pagamento;
- falha de repasse;
- integração com problema.

Alertas possuem:

- severidade;
- primeira detecção;
- última ocorrência;
- status;
- reconhecimento;
- responsável;
- resolução.

A Edge Function recalcula as condições sem apagar reconhecimento/histórico.

### Pedidos

A Gestão exibe:

- cliente;
- endereço;
- itens;
- bancas;
- pagamentos;
- entrega;
- eventos;
- suporte;
- avaliações.

Status **não é mais editado por dropdown genérico**.

Transições administrativas passam por `admin-actions`, que valida a transição e grava evento + auditoria.

### Entregas

Detalhe inclui:

- pedido;
- entregador;
- veículo;
- quilometragem;
- ETA;
- valor;
- timestamps;
- avaliações.

Ações administrativas permitidas antes da coleta:

- remover entregador;
- reatribuir para entregador aprovado;
- cancelar com motivo.

Essas ações são server-side e auditadas.

## 5. Cadastros e cobertura

A Gestão possui:

- Estados;
- Feiras;
- Bancas/Boxes;
- Usuários;
- Feirantes;
- Entregadores;
- Produtos;
- Categorias;
- Regiões.

Listagens genéricas usam paginação server-side e busca no banco, em vez de carregar apenas os primeiros 300 registros.

Campos de Estado, Região e Tipo de Veículo usam seletores amigáveis quando aplicável.

## 6. Visão 360°

### Cliente

Pode reunir:

- perfil;
- pedidos;
- suporte;
- avaliações;
- restrições.

### Feirante

Pode reunir:

- perfil;
- feiras/boxes;
- lojas;
- produtos;
- documentos;
- repasses;
- restrições.

### Entregador

Pode reunir:

- perfil;
- veículos;
- disponibilidade;
- corridas;
- documentos;
- repasses;
- restrições.

As seções respeitam as permissões do administrador logado.

## 7. Documentos

A Gestão:

- abre arquivo privado por URL assinada;
- aprova;
- rejeita;
- solicita correção;
- registra validade;
- registra automaticamente `reviewed_by` e `reviewed_at`.

A migration cria/configura bucket privado `onboarding-documents` com:

- acesso público desativado;
- limite de 5 MB;
- PDF/JPEG/PNG;
- políticas de acesso por pasta do próprio usuário;
- leitura administrativa com `documents.review`.

Magic bytes e antivírus continuam sendo responsabilidade do fluxo server-side de upload antes de produção.

## 8. Veículos

`vehicle_type_rules` é o catálogo global de modalidades aceitas.

Configura:

- código;
- nome;
- capacidade padrão;
- placa;
- documento;
- CNH;
- ativo/inativo;
- ordem.

`delivery_vehicles` continua sendo o veículo particular do entregador.

O app principal ainda precisa consumir `vehicle_type_rules` em runtime para abandonar os valores hard-coded como fonte autoritativa.

## 9. Frete e taxas

A Gestão administra:

- `delivery_fee_rules`;
- `platform_fee_rules`;
- vigência;
- prioridade;
- região;
- veículo;
- km;
- minuto;
- peso;
- mínimo/máximo;
- remuneração mínima;
- percentual de plataforma.

O cálculo final de preço deve permanecer server-side. O navegador administra parâmetros, não deve ser a autoridade do preço de um pedido real.

## 10. Pagamentos e financeiro

A Gestão separa:

- bruto;
- taxa do provedor;
- Feiraê;
- feirante;
- entregador;
- reembolso;
- conciliação;
- repasses.

O browser possui leitura, mas não recebe permissão genérica para alterar valor/status de:

- `payments`;
- `payouts`;
- `wallet_entries`.

A conciliação passa pela Edge Function e registra:

- administrador;
- data/hora.

Liquidação real e estorno continuam no PSP/backend.

## 11. Suporte

Ticket exibe:

- pedido;
- solicitante;
- assunto;
- prioridade;
- status;
- detalhes;
- responsável;
- resolução.

Atualização passa por ação server-side e registra `assigned_to`, `resolved_by`, `resolved_at`.

## 12. Suspensões e bloqueios

`account_enforcements` suporta:

- suspensão;
- banimento;
- bloqueio de pedidos;
- bloqueio de vendas;
- bloqueio de entregas.

Criação/revogação passam pela Edge Function e preservam histórico.

## 13. Avaliações

Moderação passa por ação server-side.

Registra:

- visibilidade;
- motivo;
- `moderated_by`;
- `moderated_at`.

## 14. LGPD

`privacy_requests` possui:

- tipo;
- detalhes;
- status;
- responsável;
- resolução;
- data de conclusão.

A alteração administrativa passa pela Edge Function, não por CRUD livre.

## 15. Administradores e RBAC

Permissões atuais:

- `operations.manage`;
- `documents.review`;
- `accounts.enforce`;
- `registrations.manage`;
- `rules.manage`;
- `finance.manage`;
- `communications.manage`;
- `settings.manage`;
- `permissions.manage`;
- `audit.view`;
- `reports.view`.

A Gestão permite:

- promover usuário existente a admin;
- ativar/desativar acesso;
- definir permissões;
- conceder/remover superadmin somente por superadmin;
- impedir auto-desativação;
- impedir remoção do último superadmin.

Mudanças passam por `admin-actions`.

## 16. MFA

Administradores usam MFA TOTP do Supabase Auth.

Fluxo:

- login por e-mail/senha;
- checagem de AAL;
- se não houver fator, Gestão inicia enrollment e exibe QR Code;
- usuário confirma código;
- sessão sobe para `aal2`;
- RLS e Edge Function também exigem `aal2`.

Portanto, esconder a tela de MFA no frontend não contorna a proteção do backend.

## 17. Integrações

A Gestão mostra:

- provedor;
- ambiente;
- status;
- latência;
- última verificação;
- histórico.

O botão de health check chama a Edge Function.

Endpoints de health check são definidos por secrets/env server-side:

- `MAPS_HEALTH_URL`;
- `PAYMENTS_HEALTH_URL`;
- `WHATSAPP_HEALTH_URL`;
- `PUSH_HEALTH_URL`.

A URL precisa ser HTTPS. Segredos não ficam no navegador.

## 18. Relatórios

Relatórios disponíveis:

- resumo;
- pedidos;
- pagamentos;
- entregas;
- repasses;
- cancelamentos;
- suporte;
- documentos;
- usuários;
- avaliações;
- restrições.

A leitura ocorre em páginas de 1.000 registros, até 20.000 registros por geração no browser.

Volumes superiores devem migrar para agregação/exportação server-side.

## 19. Auditoria

`admin_audit_logs` registra:

- administrador;
- ação;
- entidade;
- registro;
- antes;
- depois;
- metadata;
- data/hora.

A interface filtra administrador por nome, entidade, ação e período.

Ações críticas executadas pela Edge Function registram auditoria explicitamente.

## 20. O que continua fora do browser

Não executar diretamente no painel:

- confirmação de cobrança;
- webhook;
- estorno real;
- liquidação;
- criação de ledger;
- alteração arbitrária de saldo;
- transição livre de status;
- service role;
- segredos de provedores.

## 21. Dependências ainda externas

Para operação real ainda é obrigatório:

1. identificar o Supabase correto do Feiraê;
2. aplicar `0001`, `0002` e `0003` nesse ambiente;
3. publicar `admin-actions` e `document-upload`;
4. publicar `admin/config.json` por ambiente;
5. configurar health URLs/secrets;
6. rodar advisors de segurança/performance;
7. testar RLS por papel;
8. conectar o app principal às tabelas de runtime configuration;
9. substituir backend/localStorage do app principal por backend compartilhado.

Esses itens não devem ser chamados de concluídos apenas porque a interface administrativa existe.
