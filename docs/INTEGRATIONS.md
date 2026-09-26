# Integrações — Feiraê

Atualizado em 26/09/2026 com os serviços realmente usados pelo código.

## 1. Supabase

### O que existe no repositório

- `.env.example` com:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- migrations:
  - `0001_feirae_core.sql`
  - `0002_feirae_operations.sql`

### O que não existe ainda

- `@supabase/supabase-js` em `package.json`;
- cliente Supabase;
- `supabase/config.toml`;
- Edge Functions;
- Storage configurado;
- Auth conectado.

Conclusão: Supabase ainda não é integração ativa.

## 2. Geolocalização do navegador

`App.tsx` usa:

```
navigator.geolocation.getCurrentPosition()
```

Configuração atual:

- `enableHighAccuracy: false`;
- timeout: 8000 ms;
- `maximumAge: 300000`.

Usos:

- proximidade de feiras;
- coordenadas do cliente.

## 3. Nominatim Search

Arquivo: `src/domain/routing.ts`.

Endpoint atual:

```
https://nominatim.openstreetmap.org/search
```

Parâmetros usados:

- `format=jsonv2`;
- `limit=1`;
- `countrycodes=br`;
- `q=<endereço>`.

Header:

```
Accept-Language: pt-BR,pt
```

Se a chamada falha, retorna `null`.

## 4. Nominatim Reverse

Arquivo: `src/features/customer/CustomerScreens.tsx`.

Endpoint:

```
https://nominatim.openstreetmap.org/reverse
```

Usado para tentar preencher endereço a partir de latitude/longitude.

Produção deve revisar política de uso, identificação da aplicação, limites e cache antes de manter Nominatim público.

## 5. OSRM público

Arquivo: `src/domain/routing.ts`.

Endpoint:

```
https://router.project-osrm.org/route/v1/driving/<lng,lat;lng,lat>
```

Parâmetros:

- `overview=false`;
- `steps=false`.

Retorna ao app:

- distância em km;
- duração em minutos.

O código arredonda:

- distância para uma casa decimal;
- duração para minuto inteiro, mínimo 1.

Produção não deve depender do servidor público sem SLA.

## 6. Google Maps

Arquivo: `src/App.tsx`.

Não há SDK.

O botão abre URL externa:

```
https://www.google.com/maps/dir/?api=1&destination=<destino>
```

em nova aba com `noopener,noreferrer`.

## 7. Preço de frete x rota

Importante: OSRM/Nominatim **não calculam hoje o preço do frete**.

O checkout usa `vendorMetrics.deliveryFee` e escolhe o maior valor entre as bancas do carrinho.

Rota/ETA são usados para logística.

## 8. Pagamento

Não existe PSP/gateway integrado.

Não há:

- SDK de cartão;
- Pix real;
- webhook;
- split;
- estorno de provedor;
- payout.

A UI simula estados.

Requisitos do provedor futuro:

- Pix;
- cartão;
- tokenização;
- webhook assinado;
- idempotência;
- marketplace/recebedores;
- estorno;
- conciliação;
- sandbox.

## 9. WhatsApp

Não existe API WhatsApp integrada.

Existe somente:

- consentimento/preferência no checkout;
- registro no pedido local.

Não há envio de mensagem.

## 10. Push

Não há:

- Firebase Cloud Messaging;
- APNs;
- OneSignal;
- outro provedor.

Notificações atuais são internas ao app/localStorage.

## 11. KYC

Não existe serviço de KYC.

Aprovação atual é calculada por status local de documentos.

Não há consulta automática de:

- CPF;
- CNH;
- Detran;
- documento;
- biometria;
- selfie.

## 12. Storage de documentos

Não existe integração Storage.

`storedFile.ts` guarda arquivo como Data URL em `localStorage`, com limite de 1.500.000 bytes.

## 13. Observabilidade

Integração atual: nenhuma.

Existe CI no GitHub Actions, mas não existem SDKs de:

- Sentry;
- Datadog;
- OpenTelemetry;
- Logtail;
- equivalente.

## 14. Contratos necessários antes de substituir protótipos

Criar adapters específicos:

- `AuthRepository`;
- `OrderRepository`;
- `InventoryRepository`;
- `PaymentGateway`;
- `RoutingProvider`;
- `GeocodingProvider`;
- `DocumentStorage`;
- `NotificationProvider`.

O adapter deve preservar a interface de domínio e esconder o SDK externo.

## 15. Secrets

Frontend poderá conter apenas valores publicáveis previstos pelo provedor.

Nunca colocar no bundle:

- Supabase `service_role`;
- segredo PSP;
- segredo de webhook;
- token privado KYC;
- credencial BSP WhatsApp.

## 16. Falha de provedor

Para cada integração real definir:

- timeout;
- retry;
- idempotência;
- resposta a 429;
- fila/reprocessamento;
- logging;
- fallback seguro.

A UI não deve interpretar “falha de rede” como “pagamento aprovado” ou “entrega concluída”.
