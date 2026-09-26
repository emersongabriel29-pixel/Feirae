# Integrações — Feiraê

Atualizado em 26/09/2026.

## Princípio

Toda integração deve ficar atrás de adapter/repository. A UI não deve conhecer detalhes do provedor.

## Matriz

| Integração | Protótipo atual | Produção |
| --- | --- | --- |
| Auth | autenticação local | Supabase Auth ou equivalente |
| Banco | localStorage + migrations no repo | Supabase Postgres |
| Arquivos | data URL/localStorage | Supabase Storage privado |
| Geocodificação | serviço público de protótipo | provedor com SLA/termos adequados |
| Rotas | OSRM público/protótipo | provedor de produção |
| Mapas | abertura de mapa | provedor definido |
| Pix/cartão | simulação de estados | PSP/gateway marketplace |
| KYC | status local | serviço/revisão real |
| Push | não integrado | FCM/APNs/serviço |
| WhatsApp | consentimento local | BSP/API oficial |
| Observabilidade | CI apenas | erros/logs/métricas/traces |

## Pagamentos

Requisitos mínimos do provedor:

- Pix;
- cartão;
- tokenização;
- webhooks;
- idempotência;
- estorno;
- recebedores/split ou modelo compatível;
- conciliação;
- ambiente sandbox;
- referência por transação.

Nunca guardar CVV.

## Rotas

Entradas:

- entregador → banca;
- banca → cliente;
- múltiplas paradas quando evoluir;
- peso/veículo/região.

Saídas:

- distância;
- duração;
- rota;
- restrições quando suportadas.

Frete não deve depender de número hard-coded no cliente.

## Geocodificação

Precisa suportar:

- endereço → coordenadas;
- coordenadas → endereço;
- limites de uso;
- cache;
- política de privacidade.

## Documentos/KYC

Upload vai para Storage privado.

Processamento pode ter:

- validação automática;
- extração;
- verificação de identidade;
- revisão humana.

Não expor documento em URL pública.

## WhatsApp

Só enviar quando:

- canal estiver habilitado;
- houver consentimento/base legal aplicável;
- template/regra do provedor estiver atendida;
- usuário puder ajustar preferência quando necessário.

Consentimento no checkout deve ser versionado/auditável na produção.

## Push

Eventos importantes:

- novo pedido;
- mudança de preparo;
- corrida;
- coleta;
- rota;
- entrega;
- ocorrência;
- financeiro.

Backend deve evitar duplicidade.

## Contrato de adapter

Cada integração deve expor interface própria e traduzir erro do provedor para erro de domínio.

Nunca espalhar SDK do provedor por múltiplas telas.

## Segredos

- chaves públicas/publishable podem existir no cliente quando o provedor assim define;
- service keys, secrets e tokens privilegiados ficam somente no servidor/secret manager;
- variáveis devem ser separadas por ambiente.

## Resiliência

Definir:

- timeout;
- retry com backoff quando seguro;
- idempotência;
- circuit breaker quando aplicável;
- fallback;
- fila de reprocessamento;
- observabilidade.
