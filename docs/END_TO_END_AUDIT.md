# Auditoria end-to-end — Feiraê

Atualizado em 26/09/2026.

Esta auditoria separa três níveis:

- **implementado**: código atual executa;
- **testado**: existe teste automatizado direto;
- **pendente de produção**: exige backend/provedor.

## Resultado da Auditoria 1 — fluxos ponta a ponta

Legenda desta rodada:

- ✅ **OK no protótipo** — o fluxo local inicia, progride e encerra de forma coerente;
- ⚠️ **Parcial** — há início e avanço, mas existe limite funcional relevante;
- ❌ **Quebrado** — havia quebra interna reproduzível; quando corrigida nesta rodada, a correção é indicada;
- 🔌 **Depende de integração** — precisa de serviço externo/backend transacional;
- 🚧 **Não implementado** — o fluxo exigido ainda não existe no app atual.

- **A1-01 — Cliente: criar conta → entrar → navegar → comprar — ⚠️ Parcial.** Funciona no mesmo navegador com `localAuth/localStorage`; não há Auth/backend compartilhado.
- **A1-02 — Cliente: checkout → retirada em uma banca → conclusão — ✅ OK no protótipo.** Há teste direto de checkout → feirante → retirada → `delivered`.
- **A1-03 — Cliente: retirada multi-banca — ✅ Corrigido.** Uma única banca não encerra mais o pedido global; `delivered` só ocorre após todas confirmarem.
- **A1-04 — Cliente: entrega → banca → entregador → conclusão — ⚠️ Parcial.** As etapas locais existem, mas não há backend entre dispositivos nem browser-E2E único cobrindo os três atores.
- **A1-05 — Cliente: cancelar antes da coleta — ⚠️ Parcial.** Libera estoque e registra reembolso local; PSP/estorno real não existe. O lock obsoleto do entregador deixou de bloquear novas ofertas.
- **A1-06 — Cliente: problema após a coleta → suporte — ⚠️ Parcial.** Abre ticket no pedido, porém não existe back-office operacional para assumir e resolver o ticket.
- **A1-07 — Feirante: criar conta → documentos → aprovação → vender — 🚧 Não fecha.** Upload chega a `under_review`, mas não existe revisor/admin funcional para concluir aprovação de conta real.
- **A1-08 — Feirante real sem documentos persistidos — ✅ Corrigido.** Conta real não recebe mais documentos seed aprovados; somente conta de demonstração pode usar seed aprovado.
- **A1-09 — Multi-banca: todas prontas → liberar logística — ✅ OK no protótipo.** `orderBridge` só libera `ready_for_pickup` quando todas as bancas necessárias estão prontas.
- **A1-10 — Multi-banca: uma banca rejeita — ⚠️ Parcial.** A política atual é tudo-ou-nada: uma rejeição cancela o pedido global; não existe cancelamento parcial por banca.
- **A1-11 — Entregador: criar conta → documentos → aprovação → ficar online — 🚧 Não fecha.** Documentação pode ser enviada, porém não existe revisão administrativa funcional para aprovar conta real.
- **A1-12 — Entregador: oferta → aceitar → coletar → entregar — ✅ OK no protótipo demo.** Sequência local existe e é testada; aceite atômico entre dispositivos ainda não existe.
- **A1-13 — Entregador real: lista de corridas — ✅ Corrigido.** Fixtures `FE-1024…FE-1027` deixaram de aparecer para contas reais/novas.
- **A1-14 — Cancelamento/reatribuição de corrida — ✅ Corrigido localmente.** Pedido cancelado, concluído ou reatribuído deixa de manter um lock obsoleto bloqueando novas ofertas.
- **A1-15 — Rota/ETA — 🔌 Depende de integração.** Nominatim/OSRM públicos calculam geocodificação/rota; sem rota, a oferta real não é liberada.
- **A1-16 — Rota de pedido multi-banca — 🚧 Não implementado.** Não existem múltiplos stops entre bancas; a rota continua resumida para uma origem → cliente.
- **A1-17 — Pix/cartão/estorno/conciliação — 🔌 Depende de integração.** Estados financeiros são simulados; não existe PSP, webhook ou conciliação.
- **A1-18 — Repasse feirante/entregador — 🔌 Depende de integração.** Estados locais existem, mas não movimentam dinheiro.
- **A1-19 — Avaliação ao final da jornada — ⚠️ Parcial.** Há avaliação entre papéis, porém caminhos de UI têm escopos diferentes; a auditoria nº 30 deverá uniformizar o contrato.
- **A1-20 — Gestão/Admin: revisão, suspensão, taxas e operação — 🚧 Não implementado.** Há especificação e papéis SQL, mas não há painel/admin funcional conectado ao app.
- **A1-21 — Operação em dispositivos diferentes — 🚧 Não implementado.** A fonte de verdade atual é `localStorage`; os três atores não compartilham estado real entre aparelhos.

### Correções aplicadas nesta auditoria

- `DeliveryScreens.tsx`: fixtures de corrida ficam exclusivas de conta demo;
- `DeliveryScreens.tsx`: o estado derivado deixa de considerar um lock local obsoleto quando o pedido foi cancelado, concluído ou reatribuído;
- `VendorScreens.tsx`: conta real nunca recebe aprovação documental seed por ausência de storage;
- `VendorScreens.tsx` + `orderBridge.ts`: retirada multi-banca só conclui o pedido após todas as bancas confirmarem;
- testes de regressão adicionados em `App.test.tsx` e `orderBridge.test.ts`.

### Conclusão da Auditoria 1

A jornada local do protótipo está encadeada para compra, preparo, logística, retirada/entrega e avaliação, mas **o Feiraê ainda não possui um fluxo ponta a ponta de produção**. Os bloqueadores centrais são backend compartilhado, revisão administrativa, aceite transacional de corrida, multi-stop, PSP/ledger e resolução operacional de suporte.

## Cliente

| Fluxo                     | Implementado | Teste direto                                    | Limite atual                               |
| ------------------------- | ------------ | ----------------------------------------------- | ------------------------------------------ |
| login com senha           | sim          | sim                                             | localAuth/localStorage                     |
| criar conta               | sim          | sim                                             | local                                      |
| editar nome/e-mail/senha  | sim          | sim                                             | local                                      |
| endereço manual           | sim          | sim parcial                                     | sem backend                                |
| GPS                       | sim          | não em browser real                             | Geolocation/Nominatim                      |
| catálogo/banca            | sim          | sim                                             | marketplace local                          |
| impedir mistura de feiras | sim          | sim                                             | local                                      |
| checkout                  | sim          | sim                                             | sem PSP                                    |
| pagamento agora           | simulação    | sim de UI                                       | não cobra                                  |
| pagamento na entrega      | simulação    | sim de UI                                       | sem conciliação                            |
| Pix                       | UI           | não como integração                             | sem QR real                                |
| cartão salvo              | sim local    | sim                                             | sem tokenização PSP                        |
| promoção percentual       | sim          | parcial                                         | local                                      |
| cupom                     | sim          | sim domínio                                     | SQL incompleto                             |
| Compre X Leve Y           | sim          | sim domínio                                     | SQL incompleto                             |
| promoção horário          | parcial      | não                                             | age como percentual                        |
| combo                     | parcial      | não                                             | age como percentual                        |
| carteira                  | sim local    | parcial                                         | sem ledger real                            |
| cancelamento              | sim          | motivos testados                                | reembolso ponta a ponta sem teste dedicado |
| retirada                  | sim          | sim                                             | local                                      |
| entrega                   | sim          | sim                                             | local                                      |
| avaliações                | sim          | sim                                             | local                                      |
| comprar novamente         | sim          | matriz de regressão, sem teste nominal dedicado | local                                      |
| WhatsApp consent          | sim          | UI testada                                      | persistência no pedido sem teste dedicado  |
| ofertas/notificações      | sim          | notificações testadas                           | toggle de ofertas sem teste dedicado       |

## Feirante

| Fluxo                        | Implementado | Teste direto                          | Limite                     |
| ---------------------------- | ------------ | ------------------------------------- | -------------------------- |
| conta                        | sim          | sim                                   | local                      |
| banca editar/salvar/cancelar | sim          | sim                                   | local                      |
| produto CRUD                 | sim          | sim parcial                           | foto única                 |
| estoque                      | sim          | sim                                   | sem reserva SQL            |
| horário oficial/custom       | sim          | sim                                   | fontes parciais            |
| virar meia-noite             | sim          | sim indiretamente no fluxo de horário | local                      |
| promoções                    | sim/parcial  | cupom/compre-leve no domínio          | combo/horário incompletos  |
| documentos                   | sim          | upload→análise testado                | arquivo Data URL           |
| aprovação                    | parcial      | bloqueio local testado                | conta real não tem revisor/admin |
| pedido                       | sim          | sim                                   | local                      |
| multi-banca                  | sim          | sim domínio                           | sem rota multi-stop        |
| peso real                    | sim          | sim domínio                           | sem ajuste financeiro real |
| recebível                    | simulação    | sim de UI                             | sem PSP/ledger             |

## Entregador

| Fluxo             | Implementado | Teste direto            | Limite                |
| ----------------- | ------------ | ----------------------- | --------------------- |
| conta             | sim          | sim                     | local                 |
| documentos        | sim          | bloqueio local testado  | conta real não tem revisor/admin |
| veículo           | sim          | sim                     | catálogo hard-coded   |
| capacidade        | sim          | sim                     | regra local           |
| disponibilidade   | sim          | parcial                 | local                 |
| agenda            | sim          | parcial                 | local                 |
| raio/região       | sim          | parcial                 | local                 |
| aceitar corrida   | sim          | sim no fluxo sequencial | sem concorrência real |
| coleta            | sim          | sim                     | local                 |
| iniciar rota      | sim          | sim                     | local                 |
| confirmar entrega | sim          | sim                     | local                 |
| suporte           | sim          | sim                     | local                 |
| repasse           | simulação    | sim de UI               | sem PSP               |

## Integridade comprovada por teste de domínio

### Multi-banca

`orderBridge.test.ts`:
“only releases a multi-vendor order after every vendor is ready”.

### Peso real

`orderBridge.test.ts`:
“propagates actual separated weight to logistics”.

### Estoque

`inventoryBridge.test.ts`:

- reserva/libera;
- não libera após consumo;
- rejeita excesso.

### Catálogo

`marketplaceBridge.test.ts`:

- produto dinâmico substitui fixture;
- banca não aprovada fica oculta.

## Limitações que impedem chamar de end-to-end de produção

### 1. Mesmo navegador

Cliente, feirante e entregador compartilham `localStorage`.

Não prova operação entre três dispositivos reais.

### 2. Multi-banca logística

A corrida pode juntar nomes de várias bancas, mas não existe lista/otimização de múltiplas paradas.

### 3. Frete

Preço não usa rota/peso.

### 4. Financeiro

Não há cobrança/ledger/repasse real.

### 5. Aprovação

Status é local, sem revisor/KYC real.

### 6. Backend

Migrations existem, mas app não está conectado.

## Critérios que o CI realmente garante hoje

O CI deve falhar quando um teste existente quebrar, incluindo:

- senha incorreta;
- edição de conta;
- retirada;
- etapas de entrega;
- multi-banca pronta;
- peso real;
- estoque;
- cupom;
- Compre X Leve Y;
- banca não aprovada;
- suporte do entregador.

## Critérios ainda sem teste dedicado

Não afirmar que o CI os garante até adicionar testes:

1. cancelamento pago → reembolso → carteira;
2. WhatsApp persistido no pedido;
3. toggle de ofertas;
4. conteúdo do arquivo após reload;
5. todos os disabled do checkout;
6. rota multi-stop;
7. promoções horário/ combo com semântica real.

Cobertura completa: [TESTING_QA.md](TESTING_QA.md).
