# Feiraê

**A feira do seu jeito.**

Marketplace das feiras do Distrito Federal, com alimentos, artesanato, moda, plantas, utilidades e outros produtos.

## Estado atual

O frontend funciona como uma demonstração navegável e responsiva. A entrada oferece três acessos — cliente, feirante e entregador — e abre uma experiência específica para o perfil escolhido. A troca de perfil só acontece depois de sair. Carrinho, favoritos, endereços, preferências, sessão demonstrativa e pedidos são salvos no navegador com `localStorage`. As telas possuem URLs compartilháveis com hash e respeitam a navegação voltar/avançar do navegador.

O Supabase ficou deliberadamente para a próxima fase. Portanto, autenticação, permissões, estoque, pedidos, pagamentos e dados administrativos ainda não devem ser tratados como operações reais.

## GPS e localização

- “Usar minha localização” via Geolocation API.
- GPS opcional: se o cliente negar, pode informar endereço/região manualmente.
- Feiras ordenadas por proximidade.
- Distância cliente → feira.
- Botão para abrir rota no mapa.
- Latitude/longitude para feiras e pontos de venda.
- Endereço de entrega como destino.
- Arquitetura preparada para rastreamento de entregador em tempo real.
- Geolocalização tratada como dado privado e usada com consentimento.

## Produto

- múltiplas feiras do DF;
- múltiplos feirantes por feira;
- loja digital de cada feirante;
- alimentos e produtos não alimentícios;
- entrega e retirada;
- carrinho “Minha Feira”;
- pedidos e acompanhamento;
- compra de vários feirantes em um checkout, com divisão interna por vendedor;
- avaliações, favoritos e notificações;
- experiências separadas para cliente, feirante e entregador;
- operações demonstrativas de estoque, produtos, loja, promoções e pedidos do feirante;
- fluxo demonstrativo de aceite, coleta, rota e conclusão da entrega;
- painel administrativo futuro, com acesso próprio;
- futuro painel de gestão da feira.

## Arquitetura de dados

Prever latitude/longitude em feiras, pontos de venda e endereços. Para consultas por distância/raio, usar PostGIS no Supabase.

Tabelas previstas:
profiles, vendor_profiles, delivery_profiles, fairs, fair_vendor_memberships, vendor_stores, categories, products, product_images, inventory, addresses, carts, cart_items, orders, order_items, order_vendors, payments, deliveries, reviews, favorites, notifications, promotions, audit_logs.

## Segurança

- RLS no Supabase.
- Nunca confiar em preço enviado pelo cliente.
- Validar estoque e propriedade do vendedor no servidor.
- Mutações financeiras server-side.
- Webhooks idempotentes.
- Logs de auditoria.
- Localização somente com consentimento.

## Qualidade

- TypeScript em modo estrito.
- ESLint e Prettier.
- Testes com Vitest e Testing Library.
- Build e testes automáticos no GitHub Actions.
- Navegação acessível por teclado e suporte a redução de movimento.

## Organização do código

O componente raiz coordena a demonstração e a composição das telas, enquanto as regras puras do marketplace ficam em `src/domain/marketplace.ts` e a validação de sessão fica em `src/domain/session.ts`. Os tokens e estilos base vivem em `src/styles/tokens.css`; a folha principal mantém os estilos específicos das telas durante a migração gradual para módulos por domínio. Essa separação permite testar regras sem renderizar a aplicação e prepara a troca de `src/data.ts` por adapters de backend.

Para a revisão formal, os riscos conhecidos e os comentários de PR estão em [docs/TECHNICAL_REVIEW.md](docs/TECHNICAL_REVIEW.md). O plano de transformação do protótipo em MVP está em [docs/MVP_CHECKLIST.md](docs/MVP_CHECKLIST.md).

## Desenvolvimento

```bash
npm ci
npm run dev
```

Validação completa:

```bash
npm run check
npm run format:check
```

Consulte [docs/ROADMAP.md](docs/ROADMAP.md) para a ordem das próximas fases.

O Feiraê permanece separado das regras de negócio do Velvet-VIP.
