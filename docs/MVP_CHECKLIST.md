# Checklist de MVP — Feiraê

## Fase 0 — Definição e fundação

- [ ] Confirmar escopo do MVP: cliente compra, feirante gerencia catálogo/estoque e entregador aceita uma entrega.
- [ ] Unificar o branding entre “Feiraê” e “Feirae” no produto, repositório e domínio.
- [ ] Definir métricas de sucesso: conversão para checkout, pedidos concluídos, tempo de preparação e taxa de entrega.
- [ ] Manter o modo demonstração claramente identificado em ambientes locais e de apresentação.

## Fase 1 — Identidade e dados

- [ ] Configurar Supabase por ambiente, sem credenciais no frontend.
- [ ] Criar tabelas de perfis, vendedores, feiras, produtos, inventário e endereços.
- [ ] Ativar RLS e políticas por papel.
- [ ] Substituir `src/data.ts` por adapters de repositório com estados de loading, vazio e erro.
- [ ] Validar payloads com schemas compartilhados antes de persistir.

## Fase 2 — Compra

- [ ] Persistir carrinho por usuário autenticado.
- [ ] Recalcular preço, disponibilidade, taxa e divisão por vendedor no servidor.
- [ ] Reservar/decrementar estoque de forma transacional.
- [ ] Implementar checkout idempotente e estados de pedido.
- [ ] Integrar pagamento somente após definir webhooks idempotentes e reconciliação.

## Fase 3 — Operações

- [ ] Exigir aprovação documental antes de liberar venda/entrega.
- [ ] Permitir ao feirante criar e editar banca de verdade.
- [ ] Permitir ao feirante cadastrar produto com foto, categoria, unidade, preço, estoque e peso logístico.
- [ ] Permitir editar produtos existentes sem atalhos implícitos de preço.
- [ ] Implementar aceite/recusa do pedido pelo feirante e preparo item a item.
- [ ] Notificar feirante sobre novo pedido e mudanças relevantes.
- [ ] Usar o horário da feira vinculada, com fonte/verificação própria.
- [ ] Implementar “Pronto para coleta” como última etapa controlada pelo feirante.
- [ ] Permitir ao entregador aceitar apenas entrega compatível com veículo/região/documentação.
- [ ] Entregador controla chegada, coleta, início de rota e entrega.
- [ ] Registrar eventos de auditoria para todas as mudanças críticas.
- [ ] Notificar cliente, feirante e entregador nas transições definidas em ORDER_FULFILLMENT_FLOW.md.
- [ ] Implementar saldo pendente/disponível e repasse conforme MONEY_FLOW.md.

## Fase 4 — Qualidade e operação

- [ ] Adicionar Error Boundary e tela de recuperação.
- [ ] Configurar monitoramento de erros e métricas de frontend.
- [ ] Cobrir filtros, localização negada, estoque esgotado, checkout inválido e navegação voltar/avançar.
- [ ] Executar testes de acessibilidade em teclado e leitor de tela.
- [ ] Adicionar testes end-to-end para compra feliz e falhas principais.
- [ ] Definir backup, retenção, privacidade e exclusão de conta.

## Critério de aceite

O MVP estará pronto quando uma pessoa autenticada puder comprar um item real, com estoque e preço verificados server-side, o feirante puder processar o pedido, o entregador puder aceitar e concluir a entrega e o cliente puder acompanhar o estado sem depender de `localStorage` ou dados mockados.
