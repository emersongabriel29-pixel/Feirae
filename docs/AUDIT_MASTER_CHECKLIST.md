# Checklist Mestre de Auditorias — Feiraê

Atualizado em 26/09/2026.

Este documento é a fonte oficial de acompanhamento das auditorias do Feiraê. A regra é executar **uma auditoria por vez**, concluir correções, testes, documentação e CI daquela rodada e só então iniciar a seguinte.

## Legenda de status

- `AGUARDANDO`: ainda não iniciada;
- `PRÓXIMA`: próxima auditoria autorizada;
- `EM ANDAMENTO`: auditoria aberta no Work;
- `BLOQUEADA`: não pode ser encerrada sem dependência externa ou decisão;
- `CONCLUÍDA`: auditoria fechada, validada e incorporada ao `main`;
- `CONTÍNUA`: acompanhamento transversal que acompanha todas as rodadas.

## Checklist oficial

| Nº  | Auditoria                                                                          | Status       | Última execução | Achados                                           | Corrigidos          | Bloqueios                                             | PR / CI                    |
| --- | ---------------------------------------------------------------------------------- | ------------ | --------------- | ------------------------------------------------- | ------------------- | ----------------------------------------------------- | -------------------------- |
| 1   | Fluxos ponta a ponta                                                               | CONCLUÍDA    | 26/09/2026      | 21 jornadas classificadas                         | 4 falhas corrigidas | Backend, admin, multi-stop, PSP/ledger, suporte real  | #20 · CI verde · 73/73     |
| 2   | Botões e ações                                                                     | PRÓXIMA      | —               | —                                                 | —                   | —                                                     | —                          |
| 3   | Formulários e campos                                                               | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 4   | Design e layout                                                                    | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 5   | UX/usabilidade                                                                     | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 6   | Mobile e responsividade                                                            | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 7   | Navegação                                                                          | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 8   | Cadastro e login                                                                   | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 9   | Onboarding                                                                         | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 10  | Papéis e permissões                                                                | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 11  | Aprovação e documentação                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 12  | Gestão/administração                                                               | EM ANDAMENTO | 26/09/2026      | RBAC, MFA, CRUD crítico, escala e observabilidade | Correções na branch | Supabase correto, deploy/staging e integração runtime | feat/management-console-v2 |
| 13  | Feiras                                                                             | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 14  | Bancas/lojas                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 15  | Produtos                                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 16  | Catálogo e busca                                                                   | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 17  | Carrinho                                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 18  | Checkout                                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 19  | Pagamentos                                                                         | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 20  | Taxas                                                                              | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 21  | Financeiro do feirante                                                             | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 22  | Financeiro do entregador                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 23  | Financeiro da plataforma                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 24  | Pedidos                                                                            | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 25  | Logística                                                                          | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 26  | Entregadores                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 27  | Distribuição de corridas                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 28  | Rastreamento                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 29  | Cancelamentos                                                                      | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 30  | Avaliações                                                                         | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 31  | Notificações                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 32  | WhatsApp                                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 33  | Geolocalização                                                                     | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 34  | Regras de negócio                                                                  | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 35  | Estados e status                                                                   | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 36  | Tratamento de erros                                                                | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 37  | Estados vazios                                                                     | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 38  | Dados fictícios/mockados                                                           | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 39  | Banco de dados                                                                     | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 40  | Segurança                                                                          | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 41  | Privacidade e LGPD                                                                 | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 42  | Código                                                                             | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 43  | Arquitetura                                                                        | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 44  | APIs e integrações                                                                 | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 45  | Performance                                                                        | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 46  | Acessibilidade                                                                     | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 47  | Testes                                                                             | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 48  | QA/regressão                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 49  | Documentação                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 50  | Sincronização projeto × documentação                                               | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 51  | Logs e histórico                                                                   | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 52  | Observabilidade                                                                    | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 53  | Configuração                                                                       | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 54  | Deploy/produção                                                                    | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 55  | Consistência geral                                                                 | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 56  | Produto                                                                            | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| 57  | Prontidão para produção                                                            | AGUARDANDO   | —               | —                                                 | —                   | —                                                     | —                          |
| MÃE | Rastreabilidade requisito → tela → ação → regra → banco → permissão → docs → teste | CONTÍNUA     | 26/09/2026      | Mantida durante todas as auditorias               | —                   | Depende dos resultados das auditorias 1–57            | Checklist Mestre           |

## Auditoria 12 — Gestão/administração em andamento

A auditoria específica da Gestão foi reaberta em 26/09/2026 por solicitação da usuária.

A branch `feat/management-console-v2` parte da `main` atual e corrige, entre outros:

- divergência do PR administrativo antigo;
- fallback inseguro de permissões;
- superadmin explícito;
- MFA/AAL2;
- ações críticas server-side;
- auditoria imutável;
- paginação e busca no banco;
- alertas persistentes;
- health checks;
- responsáveis/timestamps;
- visões 360°;
- campos técnicos substituídos por seletores;
- testes e documentação administrativa.

Não marcar como `CONCLUÍDA` antes de CI verde, merge em `main` e registro dos bloqueios externos que permanecerem.

## Auditoria 1 — registro fechado

**Escopo:** fluxos ponta a ponta.

**Resultado:** concluída em 26/09/2026 e incorporada ao `main` pelo PR #20.

Foram classificadas 21 jornadas. Quatro falhas internas foram corrigidas:

1. retirada multi-banca encerrando o pedido cedo demais;
2. corridas de demonstração aparecendo para contas reais;
3. conta real de feirante podendo herdar documentos seed aprovados;
4. entregador podendo ficar preso em lock local após cancelamento, conclusão ou reatribuição.

Validação final:

- lint: aprovado;
- testes: **73/73**;
- build: aprovado;
- sincronização código × documentação: aprovada;
- formatação: aprovada;
- deploy externo: não realizado.

Bloqueios de produção identificados e mantidos como pendência rastreável:

- backend compartilhado/Supabase;
- revisão administrativa real;
- aceite atômico de corrida;
- rota multi-banca com múltiplas paradas;
- PSP, ledger, estorno e conciliação;
- operação real de tickets de suporte.

## Próxima execução

A próxima auditoria é:

**2 — Botões e ações**

Ela deve ser executada isoladamente no Work. Não iniciar a Auditoria 3 durante a mesma execução.

## Protocolo obrigatório para cada auditoria no Work

Cada rodada deve seguir esta ordem:

1. partir da `main` atual;
2. auditar somente o item autorizado;
3. registrar evidência concreta no código, teste, migration ou interface;
4. classificar cada achado como OK, parcial, quebrado, dependente de integração ou não implementado;
5. corrigir o que não depende de integração externa;
6. criar ou atualizar testes de regressão;
7. atualizar toda documentação afetada;
8. verificar impactos cruzados sem ampliar desnecessariamente o escopo;
9. rodar lint, testes, build, sincronização e formatação;
10. criar PR específico;
11. só marcar como `CONCLUÍDA` quando o CI estiver verde e a alteração estiver no `main`;
12. atualizar este Checklist Mestre.

## Regra para achados de auditorias futuras

Se a Auditoria atual encontrar um problema que pertence principalmente a outra auditoria:

- registrar o achado neste Checklist Mestre ou no relatório específico;
- corrigir imediatamente apenas se ele impedir o fluxo que está sendo auditado;
- não transformar uma auditoria em várias ao mesmo tempo.

## Auditoria-mãe de rastreabilidade

Durante todas as 57 auditorias, cada funcionalidade relevante deve poder ser cruzada por:

```
requisito
→ tela
→ botão/campo
→ regra de negócio
→ persistência/banco
→ permissão
→ documentação
→ teste
```

Quando um elo não existir, o recurso não deve ser chamado de completo apenas porque sua interface existe.
