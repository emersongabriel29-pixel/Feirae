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

- [ ] Permitir ao feirante cadastrar, editar, pausar e reabastecer produtos.
- [ ] Permitir ao feirante aceitar e atualizar pedidos.
- [ ] Permitir ao entregador aceitar uma entrega compatível com veículo e região.
- [ ] Registrar eventos de auditoria para mudanças críticas.
- [ ] Notificar cliente sobre mudanças relevantes de status.

## Fase 4 — Qualidade e operação

- [ ] Adicionar Error Boundary e tela de recuperação.
- [ ] Configurar monitoramento de erros e métricas de frontend.
- [ ] Cobrir filtros, localização negada, estoque esgotado, checkout inválido e navegação voltar/avançar.
- [ ] Executar testes de acessibilidade em teclado e leitor de tela.
- [ ] Adicionar testes end-to-end para compra feliz e falhas principais.
- [ ] Definir backup, retenção, privacidade e exclusão de conta.

## Critério de aceite

O MVP estará pronto quando uma pessoa autenticada puder comprar um item real, com estoque e preço verificados server-side, o feirante puder processar o pedido, o entregador puder aceitar e concluir a entrega e o cliente puder acompanhar o estado sem depender de `localStorage` ou dados mockados.
