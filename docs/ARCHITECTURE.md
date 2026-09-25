# Arquitetura do Feiraê

## Objetivo

Este documento descreve a arquitetura desejada do Feiraê e separa claramente o que já existe no frontend demonstrativo do que depende de integrações futuras.

O princípio central é manter regras de negócio independentes da interface e de provedores externos.

## Estado atual

O projeto usa React, TypeScript, Vite e Vitest.

Hoje:
- a aplicação possui fluxos separados para Cliente, Feirante e Entregador;
- os dados principais ainda são demonstrativos;
- parte do estado é persistida em `localStorage`;
- regras puras já começaram a ser extraídas para `src/domain`;
- `App.tsx` ainda concentra composição, navegação e bastante estado;
- a refatoração planejada deve dividir a aplicação por feature sem alterar comportamento.

## Estrutura alvo

```text
src/
  app/
    App.tsx
    routes/
    providers/
  components/
    ui/
    layout/
    feedback/
  domain/
    marketplace/
    orders/
    delivery/
    payments/
    ratings/
  features/
    customer/
      pages/
      components/
      hooks/
    vendor/
      pages/
      components/
      hooks/
    delivery/
      pages/
      components/
      hooks/
  services/
    repositories/
    geolocation/
    maps/
  styles/
    tokens.css
    base.css
  types/
```

## Responsabilidades

### app
Coordena sessão, navegação, providers e composição geral. Não deve conter regras de negócio detalhadas.

### domain
Contém regras puras, testáveis e sem dependência de React, DOM, Supabase ou gateways externos.

### features
Agrupa telas e comportamento por perfil:
- customer: descoberta, feira, loja, carrinho, checkout, pedidos e avaliações;
- vendor: banca, produtos, estoque, pedidos, financeiro, horários e avaliações;
- delivery: disponibilidade, veículos, corridas, rota, ganhos, cancelamento e avaliações.

### components
Componentes reutilizáveis e sem regra de negócio específica.

### services
Fronteira entre a aplicação e integrações externas. O domínio não deve importar SDKs de Supabase, mapas, pagamento ou mensageria.

## Camadas

```text
UI
↓
Features / hooks
↓
Domain
↓
Repository interfaces / services
↓
Integrações externas
```

A troca de dados mockados por backend deve ocorrer na última camada, evitando reescrever a interface.

## Estado

Enquanto o backend real não estiver ativo:
- estado demonstrativo pode permanecer local;
- regras de negócio devem ser extraídas gradualmente;
- nenhuma operação local deve ser tratada como confirmação real de estoque, pagamento, identidade ou entrega.

No MVP real:
- dados de conta, pedidos, estoque, pagamentos e entregas devem ser persistidos no servidor;
- estado de UI pode permanecer local;
- cálculos críticos devem ser validados server-side.

## Navegação

A navegação atual pode continuar enquanto a aplicação é demonstrativa.

Ao entrar autenticação real e rotas protegidas, a aplicação deve migrar para uma estratégia explícita de roteamento com:
- rotas por perfil;
- proteção de acesso;
- deep links;
- recuperação de sessão;
- estados de loading e erro.

## Segurança arquitetural

Regras obrigatórias:
- nunca confiar em preço, estoque, comissão ou taxa enviados pelo cliente;
- nunca autorizar ações apenas escondendo botões;
- validar papel e propriedade no servidor;
- operações financeiras e de estoque devem ser transacionais;
- localização deve ser opcional e consentida;
- logs de auditoria para ações críticas;
- integrações devem ficar atrás de interfaces, permitindo troca de provedor.

## Estratégia de refatoração

A refatoração deve ser incremental:
1. Cliente;
2. Feirante;
3. Entregador;
4. componentes compartilhados;
5. hooks e estado;
6. estilos;
7. redução final do `App.tsx`.

Cada etapa deve preservar o comportamento atual e passar em lint, TypeScript, testes e build antes da próxima.

## Fronteira de integração

Este documento não define provedor específico de:
- autenticação;
- banco;
- pagamento;
- mapas;
- WhatsApp;
- notificações.

Essas escolhas podem mudar sem alterar as regras centrais do produto.
