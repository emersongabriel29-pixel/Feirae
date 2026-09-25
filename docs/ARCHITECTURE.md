# Arquitetura do Feiraê

## Objetivo

O Feiraê é um marketplace local que conecta três perfis principais:

- **Cliente**: encontra feiras, lojas e produtos, compra, acompanha pedidos e avalia a experiência.
- **Feirante**: administra banca/box, catálogo, estoque, horários, pedidos, custos, receitas e avaliações.
- **Entregador**: administra perfil, veículos e disponibilidade, aceita entregas, acompanha rota e registra conclusão.

O painel administrativo é separado e não aparece como quarto perfil no login público.

## Estado atual

A aplicação é um frontend React + TypeScript + Vite com dados demonstrativos e persistência local. O App.tsx ainda concentra parte relevante da orquestração, embora regras puras já tenham começado a migrar para módulos de domínio.

Enquanto o backend real não estiver conectado, autenticação, estoque, pagamentos, permissões e pedidos devem ser tratados como demonstrativos.

## Arquitetura alvo

~~~text
src/
  app/
    AppShell.tsx
    routes.ts
  components/
    ui/
    feedback/
    navigation/
  features/
    customer/
      pages/
      components/
      hooks/
      services/
    vendor/
      pages/
      components/
      hooks/
      services/
    delivery/
      pages/
      components/
      hooks/
      services/
  domain/
    marketplace.ts
    session.ts
    pricing.ts
    delivery.ts
    orders.ts
  repositories/
    interfaces/
    local/
    supabase/
  styles/
    tokens.css
    base.css
  test/
~~~

## Responsabilidades

### App/Shell
Responsável apenas por composição global, sessão, roteamento de alto nível e providers.

### Features
Cada perfil mantém suas telas e fluxos sem conhecer detalhes internos das outras features.

### Domain
Regras puras e testáveis: peso, elegibilidade de veículo, estados de pedido, cálculo de subtotais, regras de avaliação e validações.

### Repositories
Isolam a origem dos dados. A UI deve consumir interfaces estáveis, permitindo trocar dados locais por Supabase sem reescrever telas.

### Integrações
Pagamentos, mapas, notificações externas e serviços de autenticação devem ficar atrás de adapters próprios.

## Fluxo de dados

UI → hook/use case → domínio → repository → backend/adapters.

Regras críticas nunca devem depender apenas do navegador. Preço, estoque, permissões, repasses e mudança de status financeiro devem ser validados no servidor.

## Princípios

1. Não misturar regra de negócio com apresentação.
2. Não duplicar a mesma regra entre Cliente, Feirante e Entregador.
3. Não permitir dependência direta de Supabase dentro de componentes visuais.
4. Toda ação crítica deve ter estado de loading, sucesso e erro.
5. Mudanças de arquitetura não devem alterar UX sem uma decisão de produto separada.
6. A aplicação deve continuar funcional durante a migração gradual do modo demo para o modo real.

## Observabilidade e segurança

Para produção, prever:
- RLS por papel;
- logs de auditoria;
- erros centralizados;
- idempotência em checkout e pagamentos;
- rastreio de alterações críticas;
- monitoramento de falhas;
- validação server-side de preço, estoque e propriedade do recurso.
