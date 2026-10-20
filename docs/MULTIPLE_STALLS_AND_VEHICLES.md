# Múltiplas bancas e veículos — Feiraê

Atualizado em 19/10/2026.

## Regras funcionais

### Um perfil de feirante, várias bancas

- O perfil vendor_profiles continua representando a pessoa/empresa, não uma banca física.
- Cada banca é um registro independente em vendor_stores.
- Cada registro de banca pode pertencer a uma feira diferente por meio de fair_id.
- Duas ou mais bancas do mesmo feirante podem estar na mesma feira; por isso a identidade operacional é o ID da banca, não apenas o ID do feirante.
- Produtos, estoque, preços, promoções, horário, disponibilidade e pedido mínimo devem ser vinculados ao store_id da banca.
- Localização física deve ser por banca: location geográfica e/ou coordenadas internas internal_x/internal_y, além de setor, corredor, box e ponto de referência.
- Aprovação, correção documental e suspensão são por banca. A aprovação do perfil do feirante não deve aprovar automaticamente novas bancas.
- A banca só pode aparecer publicamente quando estiver aprovada e a feira estiver ativa.
- Uma suspensão de banca não deve suspender automaticamente as outras bancas do mesmo perfil.

### Um perfil de entregador, vários veículos

- delivery_profiles representa o entregador; delivery_vehicles contém todos os veículos vinculados ao mesmo perfil.
- Cada veículo tem ID, tipo, capacidade, identificação, documentação e status próprios.
- É permitido cadastrar mais de um veículo do mesmo tipo.
- A disponibilidade para uma entrega deve considerar veículo ativo, aprovação, documentação exigida, capacidade e características da carga.
- O veículo selecionado deve ser gravado em deliveries.vehicle_id; o histórico não deve ser reescrito quando o entregador mudar seu veículo preferido.
- Aprovação e suspensão de um veículo não devem bloquear automaticamente os outros veículos ou a conta inteira, salvo decisão administrativa específica.

## Estado verificado no repositório em 19/10/2026

- O frontend já mantém uma lista de veículos por conta no estado persistido local feirae:delivery-vehicles:<email> e permite cadastrar, editar, ativar e pausar mais de um veículo.
- O frontend de feirante ainda usa um único perfil de banca persistido em feirae:vendor-bank:<email> e uma única lista de produtos por conta. A interface ainda precisa de seleção/gestão de múltiplas bancas e de isolamento de produtos, estoque, horários, promoções, documentos e pedidos por storeId.
- A migration 0001 já tem vendor_stores, products.store_id e fair_vendor_memberships; porém, a associação da feira e a localização por banca não estavam modeladas em vendor_stores.
- A migration 0002 já tem delivery_vehicles e deliveries.vehicle_id, mas ainda precisava de um estado próprio de aprovação/suspensão por veículo.
- O frontend permanece demonstrativo/local. A migration prepara o esquema SQL, mas não prova que Auth, RLS, políticas administrativas e fluxos reais de gravação estão integrados.

## Migração

A migration 0004_multiple_vendor_stalls_and_vehicle_governance.sql adiciona associação da banca à feira, coordenadas físicas/internas, status operacional e aprovação por banca; também adiciona status administrativo por veículo e índices para consultas de elegibilidade/histórico.

### Cuidados antes de produção

1. Aplicar a migration em ambiente de desenvolvimento e testar dados existentes.
2. Criar uma UI de gestão de bancas que selecione um storeId e isole todos os dados operacionais por banca.
3. Atualizar os bridges de catálogo/pedidos para identificar cada banca pelo storeId, sem colidir quando um feirante tem duas bancas na mesma feira.
4. Rever a política de delivery_vehicles: aprovação/suspensão deve ser alterada apenas por funções administrativas confiáveis. Não confiar em estado vindo do cliente.
5. Implementar e testar o uso de deliveries.vehicle_id no fluxo real de aceite/atribuição da entrega.
6. Executar testes SQL/RLS com usuário proprietário, outro usuário, visitante e gestor; executar a suíte frontend e o build.
7. Atualizar o painel Feirae-Gestao para aprovar/suspender cada banca e veículo individualmente, com trilha de auditoria.
