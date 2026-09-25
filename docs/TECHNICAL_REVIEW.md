# Revisão técnica formal — Feiraê

## Sumário executivo

O Feiraê tem uma proposta de produto clara, boa diferenciação entre cliente, feirante e entregador e uma demonstração navegável consistente. A principal dívida técnica estava na concentração de regras de domínio, persistência, roteamento e composição de telas em `src/App.tsx`, além do CSS global extenso. Esta rodada reduz o acoplamento sem alterar o fluxo demonstrativo: regras de marketplace e sessão agora possuem módulos próprios, com testes unitários dedicados, e tokens/base visuais foram separados do restante da folha de estilos.

## Achados priorizados

| Prioridade | Achado                                                        | Impacto                                                              | Direção recomendada                                                                 |
| ---------- | ------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P0         | Autenticação, estoque, pedidos e pagamentos são apenas locais | Risco funcional e de segurança se interpretados como operações reais | Conectar backend e validar tudo no servidor antes de produção                       |
| P1         | `App.tsx` ainda concentra composição de telas e estado global | Alto custo de manutenção e testes                                    | Próxima etapa: extrair `features/customer`, `features/vendor` e `features/delivery` |
| P1         | Dados de demonstração são importados diretamente pelas telas  | Dificulta trocar mock por API                                        | Criar interfaces de repositório/adapters e uma camada de query                      |
| P1         | Roteamento é hash-based e manual                              | Funciona para demo, mas cresce com risco de inconsistência           | Adotar roteador quando houver backend e rotas protegidas                            |
| P2         | CSS segue grande, embora tokens/base estejam separados        | Ainda há risco de colisão e regressão visual                         | Migrar por domínio para CSS Modules ou camadas de componente                        |
| P2         | Notificações usam `setTimeout` sem ciclo de vida              | Pode gerar atualização após desmontagem                              | Extrair `useToast` com limpeza de timers                                            |
| P2         | Testes cobrem fluxos essenciais, mas não todos os erros       | Regressões de UX podem escapar                                       | Adicionar testes de localização, estoque, filtros e falhas de checkout              |

## Mudanças realizadas nesta rodada

- Extração das regras de peso do carrinho, escolha de veículo, métricas de vendedor e resumos de bancas para `src/domain/marketplace.ts`.
- Extração da validação da sessão, normalização do nome e rota inicial por perfil para `src/domain/session.ts`.
- Adição de testes unitários para as regras de domínio extraídas.
- Separação dos tokens, reset e acessibilidade global em `src/styles/tokens.css`.
- Preservação do pipeline existente de lint, testes, build e Prettier.

## Revisão de código — comentários formais

### `src/App.tsx`

**Comentário P1:** o componente raiz ainda coordena estado de sessão, carrinho, favoritos, pedidos, localização, hash routing e renderização de todos os perfis. A extração desta rodada reduz regras puras, mas o próximo PR deve mover cada fluxo para uma feature independente e deixar `App` apenas como shell e composição.

**Comentário P1:** a operação de checkout continua sendo explicitamente demonstrativa. Nenhum preço, estoque, permissão ou pagamento deve ser considerado confiável no cliente quando o Supabase entrar.

**Comentário P2:** ações de localização e abertura de mapas precisam continuar sendo consentidas e tratadas como falíveis. O fallback regional atual é adequado para a demo.

### `src/styles.css`

**Comentário P2:** a separação de tokens/base é um primeiro passo reversível. A migração restante deve acontecer por domínio visual, mantendo classes públicas estáveis durante cada PR para reduzir risco.

### Testes

**Comentário P1:** os fluxos de login, carrinho, checkout, troca de perfil e operações de entrega têm valor alto e devem permanecer como testes de comportamento. As regras puras extraídas agora têm testes mais rápidos e isolados.

## Critérios para considerar o MVP pronto

O MVP só deve ser promovido quando houver autenticação real, autorização por papel, persistência server-side, estoque transacional, cálculo de preço no servidor, histórico de pedidos, tratamento de falhas e observabilidade mínima. A experiência atual deve continuar identificada como demo até esses critérios serem atendidos.

## Auditoria funcional do fluxo Feirante/Entregador — 25/09/2026

### P0 — financeiro sem fluxo de liquidação definido

A interface mostra valores a receber, mas ainda faltava definir como o dinheiro chega ao feirante e ao entregador. O modelo adotado está documentado em `MONEY_FLOW.md`: pagamento passa por provedor de marketplace, valores ficam pendentes até a conclusão aplicável do pedido/entrega, depois ficam disponíveis para repasse/saque. Frete grátis patrocinado pelo feirante é descontado do recebível do feirante; o entregador continua recebendo sua remuneração integral.

### P0 — pedido não pode ser apenas uma lista de status

O fluxo precisa de notificação de novo pedido, aceite/recusa do feirante, preparo por item, confirmação de peso quando variável, pronto para coleta, oferta da corrida, aceite do entregador, coleta, rota e entrega. O feirante não marca “saiu para entrega”; essa transição pertence ao entregador. Ver `ORDER_FULFILLMENT_FLOW.md`.

### P0 — cadastro de produtos insuficiente

O produto precisa permitir foto, edição real, categoria, unidade de venda, preço por unidade/kg/volume/comprimento, estoque e peso logístico. O botão de edição não pode alterar preço implicitamente. Ver `PRODUCT_MEASUREMENT_MATRIX.md`.

### P1 — banca ainda precisa de edição real

“Minha banca” deve permitir editar nome, logo, capa, feira, corredor/box, referência, categorias e visualizar o perfil como cliente. Hoje parte dessas ações ainda é demonstrativa.

### P1 — horários devem vir da feira correta

O horário padrão não pode ser hard-coded. Cada feira deve possuir fonte, verificação e agenda própria. A pesquisa oficial inicial está em `FAIR_HOURS.md`; horários não confirmados devem aparecer como “a confirmar”.

### P1 — promoções precisam incluir frete grátis patrocinado

A campanha do feirante deve poder definir “Frete grátis”, registrando que o feirante assume o custo da entrega. O repasse ao entregador não depende de transferência manual do feirante; sai da composição financeira do pedido.

### P0 — aprovação documental antes de operar

Criar conta não libera operação. Feirante e entregador devem passar por estados de documentação/revisão/aprovação. Requisitos e fontes oficiais estão em `ONBOARDING_AND_APPROVAL.md`. Um perfil não aprovado não pode publicar, receber pedido, ficar online, aceitar corrida ou receber repasse.
