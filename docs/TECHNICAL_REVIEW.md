# Revisão técnica formal — Feiraê

Atualizado em 26/09/2026.

## Sumário executivo

O Feiraê evoluiu de uma demonstração de telas para um **protótipo funcional com fluxos integrados**. Cliente, feirante e entregador compartilham o mesmo pedido local; catálogo, estoque, promoções, entrega, carteira e avaliações possuem bridges próprias; e os módulos de interface estão separados por domínio.

A principal dívida técnica agora não é mais “quebrar o App em telas”, e sim **substituir a infraestrutura local por backend real sem perder as regras validadas no protótipo**.

## Situação atual

### Concluído

- features separadas em `customer`, `vendor` e `delivery`;
- regras em `src/domain`;
- `useToast` e hooks dedicados;
- pedido unificado;
- catálogo compartilhado;
- estoque local transacional para o protótipo;
- autenticação local para teste;
- edição transacional de formulários;
- documentos locais;
- wallet/reembolso local;
- suporte e avaliações;
- CI completo;
- migrations Supabase `0001` e `0002`.

### Principal limitação

A fonte de verdade ainda é o navegador. Portanto, estado local não oferece garantias de concorrência, autorização, segurança, consistência multi-dispositivo ou durabilidade de produção.

## Achados prioritários atuais

| Prioridade | Achado | Impacto | Próxima ação |
| --- | --- | --- | --- |
| P0 | Auth local é apenas mecanismo de protótipo | segurança | migrar para Supabase Auth + RLS |
| P0 | Pedido/estoque/ledger ainda não são server-side | consistência e fraude | RPC/Edge Functions/transações |
| P0 | Pagamento não é real | financeiro | escolher provedor e implementar webhooks |
| P0 | Documentos ficam no navegador | privacidade/durabilidade | Storage privado + policies |
| P1 | Estados de frontend e enum SQL precisam de uma convenção única | integração | seguir `DATA_MODEL_AND_STATES.md` |
| P1 | Rotas usam serviço de protótipo | SLA/termos | provedor de produção |
| P1 | Não há painel administrativo implementado | operação | `ADMIN_MANAGEMENT_SPEC.md` |
| P1 | Não há observabilidade/telemetria de produção | operação | monitoramento + incidentes |
| P2 | Fixtures ainda convivem com dados locais em contas demo | clareza | separar seed/demo de dados reais |
| P2 | E2E atual é Testing Library, não browser E2E | regressão | Playwright/Cypress ou equivalente |

## Arquitetura alvo

A UX atual deve permanecer, mas bridges devem virar adapters.

```
UI
↓
features/hooks
↓
repositories/use-cases
↓
Supabase Auth / Postgres / Storage / Edge Functions
↓
provedores externos
```

Transições críticas não devem acontecer diretamente no cliente.

## Estados e integridade

A convenção oficial está em [DATA_MODEL_AND_STATES.md](DATA_MODEL_AND_STATES.md).

A aplicação deve ter máquinas distintas para:

- pedido global;
- participação da banca;
- pagamento;
- entrega;
- aprovação documental;
- repasse.

Não reutilizar um único enum para domínios diferentes no backend final.

## Testes

Referência atual no commit `33fd6b58`:

- 8 arquivos;
- 69 testes;
- lint aprovado;
- build aprovado;
- Prettier aprovado.

Ainda faltam:

- browser E2E;
- RLS tests;
- migrations em banco descartável;
- concorrência de estoque;
- idempotência de pagamentos;
- integração com provedores;
- acessibilidade automatizada/manual.

## Critérios para produção

Produção exige, no mínimo:

1. Auth real e autorização;
2. backend como fonte de verdade;
3. estoque transacional;
4. preços server-side;
5. máquina de estados validada;
6. Storage privado;
7. pagamentos/webhooks;
8. ledger/conciliação;
9. observabilidade;
10. LGPD;
11. backup/rollback;
12. testes E2E e segurança.
