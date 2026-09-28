# Experiência de abertura do Feiraê

## Objetivo

A abertura apresenta a proposta do Feiraê em poucos segundos: a banca ganha vida, os produtos aparecem, a entrega entra em movimento e a marca encerra a sequência com a assinatura de abertura **“Da feira até você”**.

## Comportamento

- Primeira abertura do dia: animação completa, com duração aproximada de 3,3 s.
- Reaberturas no mesmo dia: versão rápida, com duração aproximada de 1,55 s.
- Dispositivos com `prefers-reduced-motion: reduce`: versão estática de 650 ms.
- O aplicativo é montado enquanto a splash está visível para evitar atraso adicional após a animação.

## Sequência visual

1. Fundo verde com brilho orgânico.
2. Contorno da banca é desenhado.
3. Produtos e a banca completa aparecem.
4. Moto cruza a cena acompanhada pela rota.
5. Pin de localização encerra o percurso.
6. A cena é substituída pela marca Feiraê.
7. Assinatura final da abertura: **“Da feira até você”**.

## Identidade sonora

A assinatura sonora do Feiraê é gerada pela Web Audio API e usa três notas ascendentes. Ela é curta, discreta e sincronizada com a entrada da marca.

A preferência global é armazenada em:

`feirae:sound-enabled`

Valor padrão: `true`.

A reprodução no carregamento é feita em modo best-effort. Navegadores móveis podem bloquear áudio automático antes da primeira interação do usuário. A animação nunca depende da reprodução do som para continuar.

## Acessibilidade e segurança de experiência

- A splash expõe um status acessível enquanto está ativa.
- A preferência do sistema para redução de movimento é respeitada.
- O som pode ser desativado nas configurações.
- Falha de áudio ou indisponibilidade da Web Audio API não bloqueia a entrada no app.
- Não há dependência de vídeo, imagem remota ou serviço externo.

## Arquivos

- `src/components/LaunchExperience.tsx` — controle da abertura e ilustração.
- `src/components/LaunchExperience.css` — animação e responsividade.
- `src/domain/feiraeSound.ts` — assinatura sonora.
- `src/components/LaunchExperience.test.tsx` — testes da abertura completa, rápida e reduzida.

## Manutenção

A chave `feirae:splash:last-full-day` registra a última data em que a animação completa foi exibida. Para testar manualmente a abertura completa novamente, remova essa chave do armazenamento local do navegador.

## Relação com a identidade verbal

- slogan institucional: **A feira do seu jeito**;
- mensagem da tela de entrada: **Da banca até você.**;
- assinatura desta splash: **Da feira até você**.

A splash não redefine o slogan institucional; usa uma assinatura específica para comunicar feira + entrega.

## Revisão premium após validação em vídeo — 27/09/2026

A gravação real em celular mostrou que a primeira implementação estava funcional, porém visualmente simplificada demais em relação ao conceito aprovado.

A cena foi refeita para preservar a promessa visual original:

- banca maior, com estrutura, toldo, madeira, caixas e profundidade;
- contorno da banca continua sendo desenhado antes do preenchimento;
- frutas, verduras e elementos orgânicos entram em camadas e tempos diferentes;
- fundo recebeu auroras, textura sutil, folhas e halo central;
- rota possui linha principal e brilho suave;
- entrega usa moto/entregador com caixa traseira, rodas girando e linhas de movimento;
- pin encerra a rota com bounce;
- cena sai com blur/scale antes da marca;
- marca entra em card luminoso com micro-bounce;
- full: ~3,3 s;
- quick: ~1,55 s.

A implementação continua vetorial/CSS, sem vídeo pesado ou dependência remota.

## Referência visual aprovada aplicada — 27/09/2026

Esta seção substitui a composição vetorial customizada descrita anteriormente para a splash.

A abertura passa a seguir diretamente os três quadros aprovados pela referência visual:

1. **Início** — fundo verde, banca em contorno luminoso, frutas/verduras e folhas flutuantes.
2. **Animação** — banca verde e branca completa, produtos, moto de entrega, rota e pin.
3. **Logo final** — fundo claro, marca Feiraê, assinatura **“Da feira até você”** e produtos na base.

A implementação usa três ilustrações SVG locais em `public/launch/` e CSS apenas para orquestrar a transição entre os quadros. O card quadrado de marca, a legenda extra e a cena alternativa anterior foram removidos da abertura.

Os tempos funcionais permanecem os mesmos: full ~3,3 s, quick ~1,55 s e reduced motion ~650 ms. O som continua desacoplado da renderização e não bloqueia a entrada no aplicativo.

## Correção de regressão — animação contínua

A implementação por três imagens estáticas (`start → market → logo`) foi removida porque não atendia ao conceito aprovado.

A abertura volta a ser uma única cena vetorial contínua, com elementos independentes realmente animados:

- contorno da banca sendo desenhado;
- banca preenchendo e ganhando profundidade;
- produtos surgindo em camadas;
- rota sendo traçada;
- moto/entregador atravessando a cena;
- rodas girando;
- pin aparecendo com bounce;
- cena saindo antes da entrada da marca.

Os SVGs estáticos de `public/launch/` foram removidos para evitar regressão futura.

## Manutenção de formatação — 27/09/2026

Durante a integração do mapa das feiras, o Prettier também normalizou a formatação de
`src/components/LaunchExperience.tsx`. Não houve mudança de comportamento, duração, assets,
áudio, fallback ou fluxo da experiência de abertura.

## Identidade canônica na abertura — 28/09/2026

O vídeo principal continua preservado. A mudança desta revisão afeta o **fallback de movimento reduzido**: ele passa a reutilizar `FeiraeBrand` e o lockup `/brand/feirae-logo-horizontal.svg`.

Isso garante que o ê, o toldo, as folhas e a assinatura visual não tenham uma versão paralela na abertura. A regra de frequência, duração e identidade sonora não foi alterada.
