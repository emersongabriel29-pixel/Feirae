# Rastreabilidade da implementação atual — Feiraê

Atualizado em 26/09/2026.

Este documento responde: “onde cada função realmente vive hoje?”.

## Cliente

| Função            | Arquivo atual                            | Persistência atual                 | Backend SQL relacionado                  | Situação |
| ----------------- | ---------------------------------------- | ---------------------------------- | ---------------------------------------- | -------- |
| sessão            | `useDemoSession.ts`                      | `feirae:session`                   | `profiles`/Auth                          | local    |
| credencial        | `localAuth.ts`                           | `feirae:local-auth:v1`             | Supabase Auth                            | local    |
| conta             | `CustomerScreens.tsx`                    | `feirae:account:<email>`           | `profiles`                               | local    |
| endereços         | `CustomerScreens.tsx`                    | `feirae:addresses:<email>`         | `addresses`                              | local    |
| cartões salvos    | `CustomerScreens.tsx`                    | `feirae:cards-v3:<email>`          | não deve salvar PAN/CVV; PSP futuro      | local    |
| favoritos produto | `App.tsx`                                | `feirae:favorites:<email>`         | tabela futura                            | local    |
| favoritos banca   | `App.tsx`                                | `feirae:vendor-favorites:<email>`  | tabela futura                            | local    |
| carrinho          | `useDemoCart.ts`/App                     | estado local                       | `carts`, `cart_items`                    | local    |
| checkout          | `CustomerScreens.tsx`                    | estado React + bridges             | `orders`, `payments`                     | local    |
| pedido            | `orderBridge.ts`                         | `feirae:unified-orders:v2`         | `orders`, `order_vendors`, `order_items` | local    |
| estoque           | `inventoryBridge.ts`                     | `feirae:inventory-reservations:v1` | não há reserva SQL                       | local    |
| carteira          | `walletBridge.ts`                        | `feirae:wallet-debits` + pedidos   | `wallet_entries`                         | local    |
| suporte           | `CustomerScreens.tsx` + `orderBridge.ts` | pedidos/chaves locais              | `support_tickets`                        | local    |
| avaliações        | `CustomerScreens.tsx` + `orderBridge.ts` | pedidos/localStorage               | `order_reviews`                          | local    |
| WhatsApp consent  | checkout/App                             | pedido unificado                   | campo ausente em `orders`                | local    |

## Feirante

| Função             | Arquivo             | Chave local                                  | SQL                                      |
| ------------------ | ------------------- | -------------------------------------------- | ---------------------------------------- |
| conta              | `VendorScreens.tsx` | `feirae:vendor-account:<email>`              | `vendor_profiles` incompleto             |
| banca              | `VendorScreens.tsx` | `feirae:vendor-bank:<email>`                 | `vendor_stores` + `minimum_order_amount` |
| produtos           | `VendorScreens.tsx` | `feirae:vendor-products:<email>`             | `products`                               |
| estoque/histórico  | `VendorScreens.tsx` | `feirae:vendor-stock-history:<email>`        | reserva/histórico ausentes               |
| promoções          | `VendorScreens.tsx` | `feirae:vendor-promotions:<email>`           | `promotions` incompleto                  |
| horários           | `VendorScreens.tsx` | `feirae:vendor-schedule:<email>`             | `vendor_stores.custom_opening_hours`     |
| usar horário feira | `VendorScreens.tsx` | `feirae:vendor-use-fair-hours:<email>`       | decisão futura                           |
| entrega/retirada   | `VendorScreens.tsx` | `feirae:vendor-delivery-settings:<email>`    | colunas em `vendor_stores`               |
| documentos         | `VendorScreens.tsx` | `feirae:vendor-documents:<email>`            | `onboarding_documents`                   |
| pedidos            | `VendorScreens.tsx` | `feirae:vendor-orders:<email>` + orderBridge | `order_vendors`                          |
| financeiro         | `VendorScreens.tsx` | `feirae:vendor-settlements:<email>`          | `payouts` + ledger faltante              |
| avaliações         | `VendorScreens.tsx` | `feirae:vendor-reviews:<email>`              | `order_reviews`                          |

## Entregador

| Função          | Arquivo               | Chave local                             | SQL                             |
| --------------- | --------------------- | --------------------------------------- | ------------------------------- |
| conta           | `DeliveryScreens.tsx` | `feirae:delivery-account:<email>`       | `delivery_profiles`             |
| disponibilidade | `DeliveryScreens.tsx` | `feirae:delivery-online:<email>`        | `delivery_preferences.online`   |
| preferências    | `DeliveryScreens.tsx` | `feirae:delivery-preferences:<email>`   | `delivery_preferences`          |
| veículos        | `DeliveryScreens.tsx` | `feirae:delivery-vehicles:<email>`      | `delivery_vehicles`             |
| documentos      | `DeliveryScreens.tsx` | `feirae:delivery-documents:<email>`     | `onboarding_documents`          |
| corrida ativa   | `DeliveryScreens.tsx` | `feirae:delivery-active:<email>`        | `deliveries`                    |
| etapa corrida   | `DeliveryScreens.tsx` | `feirae:delivery-stage:<email>`         | `deliveries`                    |
| cancelamentos   | `DeliveryScreens.tsx` | `feirae:delivery-cancellations:<email>` | `deliveries.cancel_reason`      |
| ajuda           | `DeliveryScreens.tsx` | `feirae:delivery-help:<email>`          | `support_tickets`               |
| ganhos          | `DeliveryScreens.tsx` | `feirae:delivery-ledger:<email>`        | `payouts`; ledger real faltante |

## Marketplace compartilhado

`marketplaceBridge.ts` usa:

- `feirae:marketplace:v2`;
- `feirae:static-stock-adjustments:v1`.

Ele publica para o cliente:

- nome da banca;
- feira;
- aprovação;
- aberta/fechada;
- entrega/retirada;
- pagamento na entrega;
- pedido mínimo da banca;
- promoções;
- produtos;
- foto do produto quando `photoDataUrl` foi cadastrada.

A foto do produto é publicada como `imageDataUrl` no objeto de catálogo e renderizada pelo Cliente quando existe.

Não é banco multiusuário; sincroniza apenas o navegador atual.

## Rotas

### Geocodificação

`routing.ts`:

- Nominatim Search: `https://nominatim.openstreetmap.org/search`.

`CustomerScreens.tsx`:

- Nominatim Reverse: `https://nominatim.openstreetmap.org/reverse`.

### Roteamento

`routing.ts`:

- OSRM público: `https://router.project-osrm.org/route/v1/driving/`.

### Abrir navegação

`App.tsx`:

- Google Maps Directions URL via `https://www.google.com/maps/dir/?api=1&destination=...`.

Não há SDK de mapas instalado.

## Frete atual

O checkout não usa a geometria da rota para formar o preço.

`CustomerScreens.tsx` + `multiVendor.ts` calculam:

1. pega as bancas do carrinho;
2. lê `vendorMetrics.deliveryFee`;
3. usa o maior valor como frete-base;
4. soma R$ 2,50 por banca adicional;
5. só libera esse valor quando existe endereço de entrega;
6. sem endereço, mostra **A calcular**;
7. aplica subsídio/promoção sobre o frete liberado.

Em cancelamento parcial, `orderBridge.ts::cancelVendorParticipation()` reduz o adicional conforme o número restante de bancas.

Portanto:

- rota e ETA existem para logística;
- preço-base ainda é fixture/métrica local;
- adicional multi-banca é constante MVP e deve migrar para configuração administrativa;
- peso define compatibilidade de veículo, mas ainda não altera o preço;
- retirada usa frete zero.

## Capacidades de veículo atuais

Fonte: `src/domain/vehicles.ts`.

| Tipo                         | Capacidade padrão |
| ---------------------------- | ----------------: |
| Bicicleta                    |             10 kg |
| Bicicleta cargueira/triciclo |             40 kg |
| Moto                         |             12 kg |
| Moto com baú                 |             20 kg |
| Carro                        |             80 kg |
| Utilitário/Pickup            |            250 kg |
| Van                          |            500 kg |
| Outro                        |             10 kg |

`Outro` atualmente não exige placa por `requiresPlate()`. Isso é comportamento atual, não decisão regulatória final.

## Aprovação do feirante

`VendorScreens.tsx` considera aprovado quando **todos os documentos marcados `required`** estão `approved`.

Documentos seed:

- documento oficial com foto;
- comprovante de residência;
- permissão/autorização da banca ou box;
- licença sanitária opcional.

Banca só é publicada como aprovada no marketplace local quando esse cálculo retorna `Aprovado`.

## Aprovação do entregador

Obrigatórios sempre:

- `identity`;
- `address`.

Se houver veículo motorizado ativo:

- `cnh`;
- `crlv`.

Se houver Moto/Moto com baú ativa:

- `motofrete`.

Só fica operacional quando todos os obrigatórios atuais estão `approved`.

O código não valida automaticamente:

- idade mínima;
- tempo de CNH;
- EAR;
- validade real no Detran;
- certidões;
- autenticidade do documento.

## Upload atual

`storedFile.ts`:

- lê o arquivo como Data URL;
- limite padrão: 1.500.000 bytes;
- salva nome, type declarado pelo navegador, tamanho, Data URL e data.

Não faz:

- magic bytes;
- antivírus;
- verificação de conteúdo;
- OCR;
- assinatura;
- upload remoto.

## Inicialização, splash e som

| Função | Arquivo | Persistência/estado | Situação |
| --- | --- | --- | --- |
| bootstrap visual | `src/main.tsx` + `src/components/LaunchExperience.tsx` | estado React | implementado |
| animação | `src/components/LaunchExperience.css` | CSS | implementado |
| última abertura completa | `feirae:splash:last-full-day` | localStorage | local |
| preferência sonora | `src/domain/feiraeSound.ts` | `feirae:sound-enabled` | local |
| fallback redução de movimento | `LaunchExperience.tsx` | `prefers-reduced-motion` | implementado |

Limite: navegadores móveis podem bloquear autoplay antes da primeira interação. Isso não bloqueia a entrada no aplicativo.

## Governança automática

- `scripts/check-change-sync.mjs`: lê o diff do PR;
- `scripts/change-sync-policy.mjs`: matriz semântica por domínio;
- `scripts/change-sync-policy.test.mjs`: 8 testes Node da própria política;
- `docs/CHANGE_GOVERNANCE.md`: contrato humano de impacto.

## Testes atuais

Contagem real:

- `App.test.tsx`: 58;
- `LaunchExperience.test.tsx`: 3;
- `orderBridge.test.ts`: 11;
- `feiraeNotifications.test.ts`: 6;
- `legalTerms.test.ts`: 8;
- `customerLegal.test.ts`: 4;
- `marketplaceBridge.test.ts`: 5;
- `multiVendor.test.ts`: 11;
- `fairInternalRouting.test.ts`: 4;
- `inventoryBridge.test.ts`: 4;
- `localAuth.test.ts`: 4;
- `marketplace.test.ts`: 4;
- `session.test.ts`: 3;
- `utils.test.ts`: 4.

Total Vitest: **129**.

Governança adicional: `scripts/change-sync-policy.test.mjs` possui **8 testes Node** para a política de sincronização.

## Navegação e UX do cliente — auditoria em vídeo de 26/09/2026

- `AppComponents.tsx::MobileNavigation`: cinco destinos, incluindo **Início** com ícone de casa;
- `App.tsx`: ferramentas de busca/localização aparecem somente em `home`, `fairs` e `products` quando `screen === "main"`;
- `auth.css` + `responsive.css`: busca em linha própria acima do contexto de feira/localização;
- `CartDrawer`: incremento desabilitado no limite do estoque e contador da sacola semântico por unidades;
- `DeliveryTracking`: pedido entregue deixa de exibir ETA zero e passa a mostrar horário de entrega + ajuda pós-entrega;
- `FairCard`: configuração ausente é apresentada ao cliente como indisponibilidade, sem instrução administrativa “a configurar”.

## Central operacional e notificações — 26/09/2026

- `VendorScreens.tsx`: pedidos novos/em andamento aparecem diretamente na Central; botão abre o pedido sem exigir navegação pelo card de módulo;
- `DeliveryScreens.tsx`: corridas compatíveis e corrida ativa aparecem diretamente na Central;
- `AppComponents.tsx::FeiraeNotificationCard`: card de permissão/estado com identidade Feiraê;
- `feiraeNotifications.ts`: permissão e disparo local/browser com título `Feiraê • ...`, ícone e `tag`;
- `main.tsx`: registra `public/feirae-sw.js`;
- `public/feirae-sw.js`: recebe `push`, chama `showNotification()` e trata clique;
- `App.test.tsx`: cobre pedidos do feirante e corridas do entregador no painel principal.

Limite: o repositório ainda não possui backend que persista `PushSubscription` e envie Web Push remoto. Logo, receber notificação com o app totalmente fechado ainda não é comprovado ponta a ponta.

## Polimento de autenticação e onboarding — 26/09/2026

- `AppComponents.tsx::LoginPage`: limpa erro ao mudar modo, papel ou editar campos e marca `auth-mode-signup` para layout mobile compacto;
- `localAuth.ts`: conflito de e-mail informa o papel já vinculado;
- `OperationalOnboardingCard`: componente compartilhado para pendências prioritárias;
- `VendorScreens.tsx`: mostra “Complete seu cadastro para vender” e remove o card redundante “Painel”;
- `DeliveryScreens.tsx`: mostra “Complete seu cadastro para entregar” e renomeia “Painel” para “Disponibilidade”;
- `responsive.css`: cadastro mobile reduz a área promocional;
- `App.test.tsx`: cobre limpeza de erro, onboarding prioritário e ausência/renomeação do card;
- `localAuth.test.ts`: cobre mensagem de acesso vinculado ao papel correto.

## Mensagem de marca na entrada — 26/09/2026

- `AppComponents.tsx::LoginPage`: mantém **A feira do seu jeito** como slogan e troca o título estrutural por **Da banca até você.**;
- texto de apoio passa a explicar as três frentes do produto: comprar, gerenciar banca e fazer entregas;
- `App.test.tsx`: valida slogan, novo título e mensagem de propósito;
- `DESIGN_SYSTEM.md` e `FUNCTIONAL_SPEC.md`: registram a mensagem oficial da entrada.

## Notificações por papel — 26/09/2026

- `feiraeNotifications.ts`: centraliza textos e filtros de eventos para Cliente, Feirante e Entregador;
- `App.tsx`: Cliente recebe notificações locais/browser de etapas do pedido e de promoções novas;
- `CustomerScreens.tsx`: Cliente pode ativar notificações do sistema e a central usa nomes amigáveis como **Pedido feito**, **Saiu para entrega**, **Pedido chegando** e **Pedido chegou**;
- `VendorScreens.tsx`: Feirante recebe eventos relevantes da própria banca e possui módulo **Notificações**;
- `DeliveryScreens.tsx`: Entregador recebe eventos de rota/entrega e ganhou a etapa **Avisar chegada**;
- `marketplaceBridge.ts` + `useMarketplaceRevision.ts`: alterações de promoções disparam revisão local para o Cliente;
- `feiraeNotifications.test.ts`: valida a matriz de mensagens por papel;
- `App.test.tsx`: cobre card do Cliente e a nova etapa de chegada.

Limite mantido: receber alertas quando o aplicativo está totalmente fechado em outro aparelho ainda depende do backend real enviar Web Push para a assinatura persistida.

## Termos jurídicos e assinatura dos parceiros — 26/09/2026

- `legalTerms.ts`: termos completos e versionados para Feirante e Entregador, além do Aviso de Privacidade/LGPD;
- `LegalTermSignatureCard`: leitura integral, referências oficiais, declarações individuais, nome digitado e prova do aceite;
- `VendorScreens.tsx`: termos aparecem em Documentos e passam a compor o status de aprovação do Feirante;
- `DeliveryScreens.tsx`: termos aparecem em Documentos e passam a compor o status de aprovação do Entregador;
- versão antiga não satisfaz a aprovação: o parceiro precisa aceitar a versão vigente;
- `legalTermFingerprint()`: gera impressão digital do conteúdo;
- contas demo recebem aceite seed para preservar cenários existentes; contas reais novas começam com **Termos pendentes**;
- `legalTerms.test.ts`: valida conteúdo mínimo jurídico, moto-frete, LGPD, versionamento, isolamento por papel e fingerprint;
- `App.test.tsx`: valida presença dos termos no Feirante e bloqueio por termos pendentes no Entregador;
- `PARTNER_LEGAL_TERMS.md`: consolida a base legal federal e os requisitos que ainda dependem do backend/assessoria jurídica.

Limite: o aceite persiste em `localStorage` no protótipo. Produção precisa de evidência server-side auditável e identificação jurídica completa do controlador/operador do Feiraê.

## Central premium de Documentos — 27/09/2026

- `PartnerDocumentsHero`: hero com logomarca, marca d’água, status, progresso e resumo de regularização;
- `DocumentStatusTimeline`: histórico visual por documento;
- `DocumentsGuidanceCard`: orientações de segurança, verdade, LGPD e aprovação;
- `LegalTermSignatureCard`: identidade Feiraê reforçada no termo e no comprovante;
- `VendorScreens.tsx`: filtros, progresso, preview e cards documentais do Feirante;
- `DeliveryScreens.tsx`: mesma arquitetura visual, respeitando documentos obrigatórios conforme veículo;
- `operations.css`: layout responsivo premium de Documentos;
- `App.test.tsx`: valida a nova hierarquia, identidade, filtros e textos críticos.

A mudança é visual/UX e preserva as regras jurídicas e de aprovação implementadas anteriormente.

## Termos do Cliente no cadastro — 27/09/2026

- `customerLegal.ts`: Termos de Uso e Aviso de Privacidade próprios do Cliente;
- `LoginPage`: impede cadastro sem aceite dos Termos e ciência do Aviso;
- ofertas/novidades ficam em checkbox separado, opcional e desmarcado;
- aceite bem-sucedido registra versões e fingerprint em `feirae:customer-legal-acceptances:<email>`;
- `SettingsPage`: mantém Termos e Aviso acessíveis após o cadastro;
- `customerLegal.test.ts`: valida separação de documentos, bases legais, proteção do consumidor e registro do aceite;
- `App.test.tsx`: valida bloqueio do cadastro sem confirmações e persistência do aceite.

Limite: a evidência ainda é local. Produção exige persistência server-side auditável.

## Multi-banca, mínimo e reembolsos — 27/09/2026

- `multiVendor.ts`: uma feira por sacola, até 4 bancas, mínimo de R$ 30,00 por banca e adicional de R$ 2,50 por coleta extra;
- `CartDrawer`: mostra subtotal/mínimo de cada banca e bloqueia avanço se alguma estiver abaixo do mínimo;
- `VendorStore`: informa o pedido mínimo ao abrir a banca;
- `CustomerScreens.tsx::Checkout`: revalida mínimo e discrimina frete-base/coletas adicionais;
- `orderBridge.ts`: `vendorFinancials`, `deliveryPricing`, `refunds`, cancelamento parcial e escolha do destino do reembolso;
- `inventoryBridge.ts`: libera somente os itens da banca cancelada;
- `DeliveryScreens.tsx`: remove banca cancelada de stops, itens e peso da corrida;
- `REFUND_CANCELLATION_POLICY.md`: política funcional, jurídica e lacunas de PSP/ledger.

### Casos de borda de reembolso — 27/09/2026

- cancelamentos sucessivos de bancas mantêm o pedido em `refund_pending` enquanto existir valor externo ainda aguardando destino/conclusão;
- participação já `collected` ou `delivered` não pode ser cancelada pelo fluxo automático de indisponibilidade da banca;
- esses casos são cobertos em `orderBridge.test.ts`.

## Roteamento interno de feira — 27/09/2026

- `VendorBankProfile`: setor, corredor, box e posição interna X/Y;
- `marketplaceBridge.ts`: publica posição interna e código de coleta da banca;
- `fairInternalRouting.ts`: otimização das bancas a partir da entrada, distância interna, ETA a pé e fallback por setor/corredor/box;
- `DeliveryScreens.tsx`: origem GPS do entregador → feira, percurso interno, saída → cliente;
- `orderBridge.ts`: `pickupStops` enriquecidos e métricas internas persistidas;
- coleta com código/QR: valida o `storeId` esperado antes da confirmação quando existe `pickupCode`;
- fallback de leitura: câmera/arquivo com `BarcodeDetector` ou digitação do código;
- documentação canônica: `INTERNAL_FAIR_ROUTING.md`.

Limites ainda reais: mapa cartesiano sem grafo de obstáculos, entrada/saída distintas ainda não cadastradas e token QR de produção ainda precisa de backend antifraude.

## Pedido mínimo configurável por banca — 27/09/2026

- `multiVendor.ts`: substitui a regra única por mínimo individual, com R$ 0,00 = sem mínimo, fallback legado de R$ 30,00 e teto atual de R$ 100,00;
- `marketplaceBridge.ts`: publica `minimumOrderAmount` e informa descontos promocionais por banca;
- `vendorModel.ts` + `VendorScreens.tsx`: Feirante escolhe sem mínimo ou valor próprio e vê a configuração na prévia pública;
- `AppComponents.tsx::CartDrawer`: pré-valida cada banca separadamente;
- `CustomerScreens.tsx::VendorStore`: informa o mínimo antes da compra;
- `CustomerScreens.tsx::Checkout`: revalida cada banca após promoções e explica quanto falta;
- `App.tsx::confirmOrder`: revalida a regra antes de reservar estoque/criar pedido;
- `0003_vendor_store_minimum_order.sql`: prepara `vendor_stores.minimum_order_amount` com constraint de R$ 0,00 a R$ 100,00;
- `multiVendor.test.ts`: cobre fallback, valores diferentes, ausência de mínimo, desconto e teto;
- `marketplaceBridge.test.ts`: cobre persistência do mínimo e desconto por banca;
- `App.test.tsx`: cobre configuração do Feirante e fluxo do Cliente.

O painel administrativo runtime continua ausente. O teto/fallback são políticas centrais do protótipo e devem migrar para configuração administrativa persistida antes da produção.
