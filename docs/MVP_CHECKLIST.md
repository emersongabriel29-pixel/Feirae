# Checklist de MVP — Feiraê

Atualizado em 26/09/2026.

Legenda:

- [x] concluído no protótipo local;
- [ ] pendente para backend/produção;
- [~] parcialmente implementado.

## Protótipo funcional

- [x] três papéis: cliente, feirante e entregador;
- [x] login/cadastro local com validação de senha;
- [x] edição local de nome/e-mail/senha;
- [x] catálogo e banca compartilhados;
- [x] carrinho/checkout;
- [x] pedido unificado;
- [x] multi-banca;
- [x] estoque local reservado/liberado/consumido;
- [x] preparo e peso real;
- [x] retirada completa;
- [x] entrega completa;
- [x] veículos/capacidade/raio/região/disponibilidade;
- [x] promoções e cupons;
- [x] cancelamento/suporte;
- [x] reembolso/carteira local;
- [x] avaliações;
- [x] notificações baseadas em eventos;
- [x] repasses simulados;
- [x] documentos armazenados localmente no protótipo;
- [x] auditoria de botões e campos;
- [x] 69 testes passando no commit de referência `33fd6b58`.

## Banco e infraestrutura

- [x] migration core `0001_feirae_core.sql`;
- [x] migration operacional `0002_feirae_operations.sql`;
- [ ] aplicar migrations em ambientes reais;
- [ ] estratégia dev/staging/prod;
- [ ] backup/restore;
- [ ] observabilidade;
- [ ] Error Boundary e recuperação.

## Autenticação e segurança

- [~] autenticação local do protótipo;
- [ ] Supabase Auth;
- [ ] recuperação real de senha;
- [ ] RLS completa e testada por papel;
- [ ] rate limit;
- [ ] sessões/revogação;
- [ ] secrets somente server-side;
- [ ] pentest/revisão de segurança antes de produção.

## Catálogo e estoque real

- [x] comportamento local de produto/estoque;
- [ ] repository/adapters no Supabase;
- [ ] Storage para imagens;
- [ ] reserva de estoque transacional server-side;
- [ ] preço recalculado no servidor;
- [ ] soft delete/histórico;
- [ ] concorrência/idempotência testadas.

## Pedidos e entrega real

- [x] fluxo completo no protótipo;
- [ ] máquina de estados server-side;
- [ ] eventos imutáveis no banco;
- [ ] cálculo real de rota;
- [ ] rastreamento;
- [ ] comprovante de coleta/entrega;
- [ ] notifications server-side.

## Documentos e aprovação

- [x] formulário/upload local para validar UX;
- [ ] Storage privado;
- [ ] revisão administrativa;
- [ ] KYC/verificação;
- [ ] revalidação por vencimento;
- [ ] bloqueio server-side por aprovação.

## Pagamentos e financeiro

- [x] estados e experiência local;
- [x] modelo financeiro documentado;
- [ ] provedor Pix/cartão;
- [ ] tokenização;
- [ ] webhook idempotente;
- [ ] split/ledger;
- [ ] estorno real;
- [ ] saque/repasse;
- [ ] conciliação.

## Qualidade

- [x] TypeScript;
- [x] ESLint;
- [x] Prettier;
- [x] Vitest/Testing Library;
- [x] GitHub Actions;
- [x] cobertura de fluxos internos principais;
- [ ] E2E em navegador real;
- [ ] testes em dispositivos reais;
- [ ] acessibilidade formal;
- [ ] carga/performance;
- [ ] chaos/falhas de provedores.

## LGPD e operação

- [ ] política de privacidade final;
- [ ] base legal/finalidade por dado;
- [ ] retenção;
- [ ] exclusão de conta/dados;
- [ ] exportação/portabilidade quando aplicável;
- [ ] controle administrativo auditável;
- [ ] resposta a incidentes.

## Critério para MVP operacional

O MVP operacional só estará pronto quando um usuário autenticado em backend real puder concluir a compra com preço/estoque validados no servidor, a banca processar o pedido, o entregador concluir a entrega, o pagamento ser confirmado por provedor e os três papéis acompanharem o mesmo pedido sem depender de `localStorage`.
