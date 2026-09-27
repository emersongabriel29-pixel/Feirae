# Roteamento interno de feiras — Feiraê

Atualizado em 27/09/2026.

## Objetivo

Separar corretamente dois tipos de navegação:

1. **GPS externo:** localização atual do entregador → entrada de referência da feira e saída da feira → cliente;
2. **navegação interna:** entrada → bancas/boxes do pedido → saída, sem depender da precisão do GPS em distâncias de poucos metros.

## Localização do entregador

O entregador autoriza o GPS na área de Disponibilidade. O Feiraê registra latitude, longitude e exibe a precisão informada pelo navegador.

A posição atual é usada como origem do trecho externo até a feira. Quando a origem GPS muda, a rota pode ser recalculada com a nova origem.

## Cadastro interno da banca

Cada banca pode armazenar:

- feira;
- setor/pavilhão;
- corredor/ala;
- box;
- ponto de referência;
- posição X em metros a partir da entrada de referência;
- posição Y em metros a partir da entrada de referência.

`X=0, Y=0` representa a entrada de referência usada pelo mapa interno.

Essas coordenadas são coordenadas **internas da feira**, não latitude/longitude GPS.

## Otimização

`fairInternalRouting.ts` usa a entrada como origem e escolhe iterativamente a banca mapeada mais próxima da posição atual. Depois da última banca, soma o retorno à entrada/saída de referência.

O resultado inclui:

- sequência das bancas;
- distância interna por parada;
- distância interna total;
- estimativa de minutos a pé;
- quantidade de bancas mapeadas e não mapeadas;
- estratégia usada.

## Fallback

Se uma banca ainda não tiver X/Y, ela continua no pedido.

A ordem de fallback é:

`setor → corredor → número do box → nome da banca`

Quando apenas parte das bancas estiver mapeada, a estratégia é `mixed`: primeiro o trecho calculável no mapa interno e depois as bancas sem coordenadas, ordenadas pelos dados físicos cadastrados.

## Rota completa

A experiência operacional é:

`localização atual do entregador → entrada da feira → bancas otimizadas → saída → cliente`

O OSRM continua responsável pelos trechos externos dirigíveis. A distância interna é somada à distância/ETA da corrida.

Enquanto a feira não tiver entrada e saída distintas, o ponto geográfico cadastrado da feira funciona como referência para ambas.

## Confirmação por QR/código

Cada loja sincronizada recebe um código determinístico de coleta, no formato `FEIRAE-...`, e um payload `feirae://pickup/FEIRAE-...`.

No fluxo do entregador:

- a banca exibe o payload para impressão/geração do QR;
- o entregador pode fotografar/ler um QR quando o navegador suporta `BarcodeDetector`;
- também existe fallback para digitação do código impresso;
- quando a parada possui código, a coleta não é confirmada se o código não corresponder ao `storeId` esperado.

O código do protótipo serve para evitar confirmação acidental na banca errada. Em produção, QR antifraude deve migrar para token assinado, rotativo ou validado pelo backend.

## Limitações de produção

- o mapa interno ainda é cartesiano e não possui planta visual desenhada da feira;
- entrada/saída específicas por feira ainda não têm cadastro administrativo próprio;
- obstáculos, escadas, corredores bloqueados e acessibilidade não entram no grafo;
- `BarcodeDetector` não existe em todos os navegadores;
- a confirmação antifraude real precisa de backend e token não forjável;
- coordenadas internas cadastradas por feirante precisam de validação da gestão da feira antes de serem tratadas como oficiais.
