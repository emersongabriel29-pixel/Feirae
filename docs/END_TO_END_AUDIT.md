# Auditoria end-to-end — Feiraê

Atualizado em 26/09/2026.

Esta auditoria separa três níveis:

- **implementado**: código atual executa;
- **testado**: existe teste automatizado direto;
- **pendente de produção**: exige backend/provedor.

## Cliente

| Fluxo | Implementado | Teste direto | Limite atual |
| --- | --- | --- | --- |
| login com senha | sim | sim | localAuth/localStorage |
| criar conta | sim | sim | local |
| editar nome/e-mail/senha | sim | sim | local |
| endereço manual | sim | sim parcial | sem backend |
| GPS | sim | não em browser real | Geolocation/Nominatim |
| catálogo/banca | sim | sim | marketplace local |
| impedir mistura de feiras | sim | sim | local |
| checkout | sim | sim | sem PSP |
| pagamento agora | simulação | sim de UI | não cobra |
| pagamento na entrega | simulação | sim de UI | sem conciliação |
| Pix | UI | não como integração | sem QR real |
| cartão salvo | sim local | sim | sem tokenização PSP |
| promoção percentual | sim | parcial | local |
| cupom | sim | sim domínio | SQL incompleto |
| Compre X Leve Y | sim | sim domínio | SQL incompleto |
| promoção horário | parcial | não | age como percentual |
| combo | parcial | não | age como percentual |
| carteira | sim local | parcial | sem ledger real |
| cancelamento | sim | motivos testados | reembolso ponta a ponta sem teste dedicado |
| retirada | sim | sim | local |
| entrega | sim | sim | local |
| avaliações | sim | sim | local |
| comprar novamente | sim | matriz de regressão, sem teste nominal dedicado | local |
| WhatsApp consent | sim | UI testada | persistência no pedido sem teste dedicado |
| ofertas/notificações | sim | notificações testadas | toggle de ofertas sem teste dedicado |

## Feirante

| Fluxo | Implementado | Teste direto | Limite |
| --- | --- | --- | --- |
| conta | sim | sim | local |
| banca editar/salvar/cancelar | sim | sim | local |
| produto CRUD | sim | sim parcial | foto única |
| estoque | sim | sim | sem reserva SQL |
| horário oficial/custom | sim | sim | fontes parciais |
| virar meia-noite | sim | sim indiretamente no fluxo de horário | local |
| promoções | sim/parcial | cupom/compre-leve no domínio | combo/horário incompletos |
| documentos | sim | upload→análise testado | arquivo Data URL |
| aprovação | sim local | sim indiretamente | sem KYC/admin |
| pedido | sim | sim | local |
| multi-banca | sim | sim domínio | sem rota multi-stop |
| peso real | sim | sim domínio | sem ajuste financeiro real |
| recebível | simulação | sim de UI | sem PSP/ledger |

## Entregador

| Fluxo | Implementado | Teste direto | Limite |
| --- | --- | --- | --- |
| conta | sim | sim | local |
| documentos | sim | aprovação testada | sem verificação real |
| veículo | sim | sim | catálogo hard-coded |
| capacidade | sim | sim | regra local |
| disponibilidade | sim | parcial | local |
| agenda | sim | parcial | local |
| raio/região | sim | parcial | local |
| aceitar corrida | sim | sim no fluxo sequencial | sem concorrência real |
| coleta | sim | sim | local |
| iniciar rota | sim | sim | local |
| confirmar entrega | sim | sim | local |
| suporte | sim | sim | local |
| repasse | simulação | sim de UI | sem PSP |

## Integridade comprovada por teste de domínio

### Multi-banca

`orderBridge.test.ts`:
“only releases a multi-vendor order after every vendor is ready”.

### Peso real

`orderBridge.test.ts`:
“propagates actual separated weight to logistics”.

### Estoque

`inventoryBridge.test.ts`:

- reserva/libera;
- não libera após consumo;
- rejeita excesso.

### Catálogo

`marketplaceBridge.test.ts`:

- produto dinâmico substitui fixture;
- banca não aprovada fica oculta.

## Limitações que impedem chamar de end-to-end de produção

### 1. Mesmo navegador

Cliente, feirante e entregador compartilham `localStorage`.

Não prova operação entre três dispositivos reais.

### 2. Multi-banca logística

A corrida pode juntar nomes de várias bancas, mas não existe lista/otimização de múltiplas paradas.

### 3. Frete

Preço não usa rota/peso.

### 4. Financeiro

Não há cobrança/ledger/repasse real.

### 5. Aprovação

Status é local, sem revisor/KYC real.

### 6. Backend

Migrations existem, mas app não está conectado.

## Critérios que o CI realmente garante hoje

O CI deve falhar quando um teste existente quebrar, incluindo:

- senha incorreta;
- edição de conta;
- retirada;
- etapas de entrega;
- multi-banca pronta;
- peso real;
- estoque;
- cupom;
- Compre X Leve Y;
- banca não aprovada;
- suporte do entregador.

## Critérios ainda sem teste dedicado

Não afirmar que o CI os garante até adicionar testes:

1. cancelamento pago → reembolso → carteira;
2. WhatsApp persistido no pedido;
3. toggle de ofertas;
4. conteúdo do arquivo após reload;
5. todos os disabled do checkout;
6. rota multi-stop;
7. promoções horário/ combo com semântica real.

Cobertura completa: [TESTING_QA.md](TESTING_QA.md).
