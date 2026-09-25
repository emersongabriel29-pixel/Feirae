# Registro de decisões do Feiraê

Este arquivo existe para impedir que decisões já tomadas sejam desfeitas por refatorações ou por agentes que avaliem o projeto sem contexto.

## D-001 — Três papéis públicos

**Decisão:** Cliente, Feirante e Entregador são os três acessos públicos principais.

**Consequência:** Admin não aparece como quarta opção no login público.

## D-002 — Criar conta antes do login

**Decisão:** os três papéis precisam de fluxo de criação de conta.

**Consequência:** uma tela somente de login é incompleta.

## D-003 — Navegação sem menu lateral fixo

**Decisão:** evitar menu vertical permanente à esquerda como padrão das telas principais.

**Consequência:** usar cards, cabeçalho e navegação adequada ao contexto/mobile.

## D-004 — Abrir áreas, não empilhar conteúdo

**Decisão:** ao clicar em uma função principal, entrar em uma área/tela clara em vez de simplesmente renderizar o conteúdo abaixo da página atual.

## D-005 — Feiras antes de destaques

**Decisão:** Feiras é a entrada principal de descoberta. Conteúdo em destaque não deve esconder a navegação para feiras.

## D-006 — Feiras e lojas são conceitos distintos

**Decisão:** uma feira contém múltiplas lojas/feirantes.

**Consequência:** não apresentar uma única loja como se representasse toda a feira.

## D-007 — Localização opcional

**Decisão:** GPS melhora a experiência, mas nunca é obrigatório.

**Consequência:** sempre oferecer entrada manual de região/endereço.

## D-008 — Expansão além do DF

**Decisão:** o produto não deve ser tecnicamente fixado ao Distrito Federal.

**Consequência:** enquanto a operação for local, comunicar “no momento apenas DF”, mantendo estrutura pronta para outros estados.

## D-009 — Peso influencia entrega

**Decisão:** carrinho deve acompanhar peso e a entrega deve considerar capacidade do veículo.

**Consequência:** veículo incompatível não deve ser elegível.

## D-010 — Pagamentos previstos

**Decisão:** checkout real deve suportar Pix e cartões conforme capacidade do provedor.

**Consequência:** dados de cartão devem ser tokenizados por provedor seguro.

## D-011 — Consentimento de WhatsApp

**Decisão:** checkout deve permitir autorização explícita para mensagens por WhatsApp.

**Consequência:** não marcar autorização automaticamente.

## D-012 — Avaliações bidirecionais

**Decisão:** participantes podem avaliar a contraparte conforme a relação ocorrida na compra/entrega.

**Consequência:** média e avaliações individuais devem ser distinguíveis.

## D-013 — Comprar novamente

**Decisão:** histórico de Sacolas/Pedidos deve oferecer recompra.

## D-014 — Feirante administra sua operação

**Decisão:** feirante cadastra banca/box, horários, produtos, valores, estoque e fotos, além de acompanhar financeiro.

## D-015 — Entregador administra veículos

**Decisão:** entregador cadastra veículos e capacidade; corridas são filtradas por compatibilidade.

## D-016 — Cancelamentos possuem motivo

**Decisão:** cancelamentos de entrega/pedido devem solicitar motivo e gerar histórico.

## D-017 — Refatoração não muda produto

**Decisão:** refatoração técnica deve preservar layout, fluxo e funcionalidades.

**Consequência:** redesign, remoção ou simplificação de regra deve ser discutida separadamente.

## D-018 — Integrações depois da base

**Decisão:** documentação, domínio, testes, arquitetura e UX que não dependem de serviços externos podem avançar antes das integrações.

**Consequência:** Supabase, pagamentos, WhatsApp, mapas e demais provedores entram por fronteiras claras e não devem contaminar o domínio.
