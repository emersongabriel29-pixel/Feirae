# Documentação do Feiraê

## Produto e arquitetura

- [Arquitetura](ARCHITECTURE.md) — camadas, responsabilidades e fronteiras de integração.
- [Regras de negócio](BUSINESS_RULES.md) — regras funcionais que refatorações devem preservar.
- [Fluxos de usuário](USER_FLOWS.md) — Cliente, Feirante e Entregador.
- [Registro de decisões](DECISIONS.md) — decisões já tomadas e suas consequências.

## Domínios

- [Banco de dados](DATABASE.md) — blueprint de entidades, relacionamentos, RLS e transações.
- [Pagamentos e taxas](PAYMENTS_AND_FEES.md) — lógica financeira independente de provedor.
- [Entregas](DELIVERY.md) — veículos, capacidade, estados, cancelamentos e rastreio.
- [Sistema de design](DESIGN_SYSTEM.md) — regras visuais, navegação, responsividade e acessibilidade.

## Planejamento e qualidade

- [Checklist do MVP](MVP_CHECKLIST.md)
- [Roadmap](ROADMAP.md)
- [Revisão técnica](TECHNICAL_REVIEW.md)

## Regra de uso

Documentos de produto e domínio são contratos de intenção. Refatorações não devem alterar essas decisões silenciosamente.

Quando implementação e documentação divergirem:
1. confirmar se houve decisão explícita de produto;
2. atualizar testes;
3. atualizar a documentação no mesmo PR da mudança;
4. evitar usar a implementação atual, por si só, como justificativa para apagar uma regra documentada.
