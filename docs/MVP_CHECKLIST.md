# Checklist de MVP — Feiraê

Atualizado em 26/09/2026 após auditoria contra o código e schema.

Legenda:

- [x] implementado no protótipo local;
- [~] parcialmente implementado;
- [ ] não implementado.

## Cliente

- [x] login/cadastro local com senha;
- [x] edição de nome/e-mail/senha;
- [x] feiras e bancas;
- [x] catálogo;
- [x] carrinho;
- [x] impedir mistura de feiras;
- [x] endereço manual;
- [x] GPS/reverse geocoding de protótipo;
- [x] checkout;
- [x] pagar agora como estado local;
- [x] pagar na entrega;
- [x] dinheiro/troco;
- [x] cartões locais com últimos 4;
- [x] favoritos;
- [x] pedidos;
- [x] retirada;
- [x] entrega;
- [x] cancelamento/suporte;
- [x] avaliações;
- [x] comprar novamente;
- [x] carteira local;
- [x] WhatsApp consent local;
- [~] Pix — UI/estado, sem cobrança/QR real;
- [~] rastreamento — estados/ETA, sem GPS em tempo real.

## Feirante

- [x] conta;
- [x] editar banca;
- [x] salvar/cancelar rascunho;
- [x] produtos;
- [x] estoque local;
- [x] peso real;
- [x] horários;
- [x] entrega/retirada;
- [x] pagamento na entrega;
- [x] documentos locais;
- [x] aprovação local;
- [x] pedido sequencial;
- [x] multi-banca no pedido;
- [x] avaliações;
- [x] recebível/repasse simulado;
- [x] percentual;
- [x] valor fixo;
- [x] produto/categoria;
- [x] frete grátis;
- [x] cupom no frontend;
- [x] Compre X Leve Y no frontend;
- [~] promoção por horário — sem regra temporal específica;
- [~] combo — sem composição própria;
- [~] fotos — somente uma foto Data URL, não galeria/Storage.

## Entregador

- [x] conta;
- [x] documentos locais;
- [x] aprovação local dinâmica;
- [x] veículos;
- [x] capacidade editável;
- [x] placa;
- [x] disponibilidade;
- [x] agenda;
- [x] raio;
- [x] regiões;
- [x] aceitar corrida;
- [x] coleta;
- [x] iniciar entrega;
- [x] concluir entrega;
- [x] cancelar corrida;
- [x] suporte;
- [x] avaliações;
- [x] recebível/repasse simulado;
- [~] validação documental — status local, sem Detran/KYC;
- [~] rota multi-banca — nomes agregados, sem múltiplas paradas.

## Promoções e schema

- [~] promoções completas no banco;
- [ ] adicionar `coupon_code` em `promotions`;
- [ ] adicionar `pay_quantity`;
- [ ] adicionar `take_quantity`;
- [ ] implementar semântica própria de `horario`;
- [ ] implementar semântica própria de `combo`.

## Supabase/schema

- [x] migration 0001;
- [x] migration 0002;
- [ ] instalar/conectar cliente Supabase;
- [ ] criar config Supabase;
- [ ] aplicar migrations em banco de desenvolvimento;
- [ ] normalizar `cancelled/canceled`;
- [ ] criar enum próprio de `order_vendors.status`;
- [ ] separar pagamento de `order_status`;
- [ ] snapshots faltantes;
- [ ] resolver `reviews` x `order_reviews`;
- [ ] reserva de estoque no banco;
- [ ] ledger multi-banca;
- [ ] imagens de produto;
- [ ] notificações persistentes.

## RLS

- [ ] RLS/policies para `vendor_stores`;
- [ ] `categories`;
- [ ] `order_vendors`;
- [ ] `order_items`;
- [ ] `carts`;
- [ ] `deliveries`;
- [ ] `payments`;
- [ ] `reviews`;
- [ ] completar policies de `vendor_profiles`;
- [ ] `promotion_usages`;
- [ ] `support_tickets`;
- [ ] `order_reviews`;
- [ ] CRUD seguro de produtos do feirante;
- [ ] mutações de pedido server-side;
- [ ] revisão administrativa de documentos.

## Sistema de gestão

- [ ] UI administrativa;
- [ ] ativar/desativar UF;
- [ ] ativar/desativar feira;
- [ ] catálogo global de tipo de veículo;
- [ ] ativar/desativar tipo de veículo;
- [ ] definir capacidade padrão/máxima por tipo;
- [ ] suspender/banir cliente;
- [ ] suspender/banir feirante;
- [ ] suspender/banir entregador;
- [ ] aprovar/corrigir documentos;
- [ ] regras versionadas de taxas;
- [ ] permissões administrativas;
- [ ] audit log;
- [ ] financeiro/admin;
- [ ] suporte/admin.

## Integrações

- [x] Geolocation API do browser;
- [x] Nominatim Search;
- [x] Nominatim Reverse;
- [x] OSRM público;
- [x] abrir Google Maps por URL;
- [ ] provedor de rotas com SLA;
- [ ] PSP Pix/cartão;
- [ ] webhooks;
- [ ] split;
- [ ] KYC;
- [ ] Storage;
- [ ] push;
- [ ] WhatsApp API;
- [ ] observabilidade.

## Qualidade

- [x] 69 testes;
- [x] ESLint;
- [x] TypeScript build;
- [x] Prettier;
- [x] GitHub Actions;
- [ ] teste dedicado reembolso→carteira;
- [ ] WhatsApp persistido no pedido;
- [ ] toggle de ofertas;
- [ ] conteúdo de documento após reload;
- [ ] todos os disabled do checkout;
- [ ] browser E2E;
- [ ] migration tests;
- [ ] RLS tests;
- [ ] concorrência;
- [ ] acessibilidade formal.

## Deploy

- [x] workflow de qualidade;
- [ ] workflow de deploy;
- [ ] hosting configurado no repo;
- [ ] staging;
- [ ] produção;
- [ ] rollback;
- [ ] smoke pós-deploy.

## Critério de MVP operacional

Não considerar MVP operacional até:

- Auth real;
- banco como fonte de verdade;
- estoque transacional;
- pedidos multi-dispositivo;
- documentos em Storage;
- RLS;
- pagamento real;
- entrega compartilhada;
- ledger/repasses;
- admin mínimo;
- E2E em browser.
