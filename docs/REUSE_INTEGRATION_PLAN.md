# Plano de reaproveitamento técnico de repositórios — Feiraê

Atualizado em 18/10/2026.

## Objetivo

Aproveitar soluções e caminhos técnicos de outros repositórios no código existente do Feiraê. Não clonar aplicativos para substituir o produto, não importar funcionalidades sem entender suas dependências e não copiar identidade visual de terceiros.

O repositório oficial continua sendo `emersongabriel29-pixel/Feirae`; seu código, suas migrations e suas regras de negócio são a fonte de verdade.

## Método por funcionalidade

1. Identificar a lacuna real e os arquivos existentes envolvidos.
2. Inspecionar a implementação de referência, testes, dependências, manutenção e licença.
3. Comparar contratos, estados, modelo de dados, permissões e requisitos de segurança.
4. Adaptar o padrão ao domínio do Feiraê; não substituir módulos inteiros sem necessidade.
5. Registrar origem e decisão de licença quando houver reutilização de código.
6. Implementar em branch isolada, sincronizando testes e documentação.
7. Executar lint, testes, build, política de sincronização e formatação.
8. Não fazer merge, deploy, pagamentos ou ações externas sem autorização exigida.

## Matriz inicial de oportunidades

| Área | Referência técnica identificada | Incorporação proposta | Pré-condição |
|---|---|---|---|
| Pedidos multi-banca | Código atual do Feiraê e padrões de marketplace multi-vendedor | Preservar o domínio existente e alinhar estado global, estado por banca e alocação financeira | Contratos e testes de transição |
| Estoque | Padrões de reserva transacional/RPC em aplicações de supermercado | Reserva, expiração, liberação e consumo atômicos | Migration, serviço server-side, RLS e testes concorrentes |
| Pagamentos e recebíveis | Padrões de backend com validação autoritativa | Lançamentos por banca/recebedor e entregador; nunca confiar em valores enviados pelo cliente | Provedor autorizado, idempotência, ledger e revisão de segurança |
| Mapas e despacho | OSRM/Valhalla e código atual `src/domain/routing.ts` | Rota externa e ordenação de coletas; coordenadas de cada box tratadas separadamente | Coordenadas confiáveis e modo de transporte correto |
| Persistência e acesso | Supabase/Postgres e políticas RLS | Migrar gradualmente de estado local para dados compartilhados | Matriz de permissões e testes em banco descartável |
| Catálogo e imagens | Padrões de storefront/PWA | Adaptar upload, apresentação e cache ao catálogo de cada banca | Licença compatível, Storage e autorização |
| Gestão | Padrões de painel operacional | Configurações de taxas, veículos, regiões, cadastros e auditoria no app separado Feirae-Gestao | Confirmar repositório e contratos administrativos |

## Salvaguardas aprendidas na comparação

- Não importar um fluxo de pagamento que reporte sucesso sem validar o provedor.
- Não expor consultas amplas de pedidos nem permitir acesso cruzado entre clientes, bancas e entregadores.
- Não considerar estoque seguro sem tratar concorrência por transação.
- Confirmar licença e dependências antes de copiar código.
- Roteamento por ruas não equivale a otimização de corredores entre bancas dentro de uma feira.

## Sequência recomendada

1. Concluir a validação de CI da correção de desconto do PR #67.
2. Definir estados do pedido global versus participação por banca.
3. Implementar reserva transacional de estoque e validação server-side do mínimo por banca.
4. Revisar RLS e autenticação antes de conectar dados reais.
5. Modelar ledger/recebedores e integrar pagamentos somente com provedor autorizado.
6. Validar coordenadas dos boxes e despacho cliente-entregador.
7. Incorporar referências adicionais um módulo por vez, com licença e testes.

## Estado

Este documento é um plano de incorporação técnica, não uma declaração de que as áreas acima estão concluídas. Nenhum código externo é copiado por este documento. Cada implementação depende de inspeção da referência, licença e contratos internos do Feiraê.
