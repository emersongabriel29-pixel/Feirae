# Registro de decisões de produto — Feiraê

Este arquivo evita que futuras refatorações ou agentes de IA revertam decisões já tomadas.

## D-001 — Três perfis públicos
Cliente, Feirante e Entregador são os três acessos públicos. Admin terá acesso próprio e não será quarta opção no login público.

## D-002 — Cadastro para todos os perfis
Cada perfil precisa de fluxo de criação de conta. Feirante e Entregador possuem validação/documentação adicional.

## D-003 — Feiras antes de destaques
“Feiras” é a área principal. “Feiras em destaque” pertence a essa experiência.

## D-004 — Feira não é loja
Uma feira contém múltiplas lojas/feirantes. “Minhas feiras” e “Lojas” não são sinônimos.

## D-005 — Localização
Localização automática pode encontrar a feira mais próxima, mas GPS é opcional e deve existir fallback manual.

## D-006 — Expansão geográfica
O produto pode começar operacionalmente pelo DF, mas interface e modelo não devem ficar rigidamente codificados para um único estado.

## D-007 — Navegação sem menu lateral fixo
Não usar menu vertical fixo à esquerda como padrão do produto. Áreas relevantes são acessadas por cards/telas próprias.

## D-008 — Conteúdo em nova tela
Ao entrar em uma função substancial, abrir a área correspondente em vez de expandir conteúdo abaixo do card original.

## D-009 — Carrinho consciente de peso
Carrinho mostra quantidade, valor e peso. Capacidade do veículo entra na regra de entrega.

## D-010 — Entrega por rota/peso
A taxa de entrega deve ser preparada para considerar rota e peso. Fórmula e valores ainda são decisão comercial pendente.

## D-011 — Absorção da entrega
O feirante pode ter opção de absorver a taxa de entrega conforme regras comerciais futuras.

## D-012 — Pagamentos previstos
Preparar Pix, crédito e débito. Integração com provedor ocorre em fase posterior e não deve ser simulada como pagamento real.

## D-013 — Status visual da entrega
Cliente deve distinguir claramente pedido “em rota” de “entregue”. A linguagem visual da motinha pode ser compartilhada com a experiência do entregador.

## D-014 — Avaliações relacionais
Avaliação não é bloco genérico:
- cliente → produto/compra e entrega;
- feirante → entregador e cliente quando aplicável;
- demais relações dependem de participação real na operação.

## D-015 — Média + avaliações
Mostrar nota média de forma resumida e permitir consultar avaliações individuais.

## D-016 — Comprar novamente
Sacolas/Pedidos devem oferecer “comprar novamente” quando os itens ainda forem elegíveis.

## D-017 — WhatsApp por consentimento
Checkout deve ter opção explícita de autorização para receber mensagens via WhatsApp.

## D-018 — Refatoração não muda produto
Mudanças técnicas preservam comportamento e visual. Alterações de UX, fluxo ou regra entram em etapa separada.

## D-019 — Supabase depois da base de produto
O frontend pode evoluir e ser refatorado sem exigir integração imediata. Quando Supabase entrar, regras críticas migram para validação server-side.

## Pendências deliberadas

Ainda não há decisão final para:
- percentuais de comissão;
- valor da taxa administrativa;
- fórmula definitiva do frete;
- prazo de repasse;
- provedor de pagamento;
- política detalhada de cancelamento/reembolso.

Esses itens não devem ser inventados por implementação ou agente de IA.
