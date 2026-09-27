# Experiência de abertura do Feiraê

## Objetivo

A abertura apresenta a proposta do Feiraê em poucos segundos: a banca ganha vida, os produtos aparecem, a entrega entra em movimento e a marca encerra a sequência com o slogan **“Da feira até você”**.

## Comportamento

- Primeira abertura do dia: animação completa, com duração aproximada de 3,1 s.
- Reaberturas no mesmo dia: versão rápida, com duração aproximada de 1,45 s.
- Dispositivos com `prefers-reduced-motion: reduce`: versão estática de 650 ms.
- O aplicativo é montado enquanto a splash está visível para evitar atraso adicional após a animação.

## Sequência visual

1. Fundo verde com brilho orgânico.
2. Contorno da banca é desenhado.
3. Produtos e a banca completa aparecem.
4. Moto cruza a cena acompanhada pela rota.
5. Pin de localização encerra o percurso.
6. A cena é substituída pela marca Feiraê.
7. Slogan final: **“Da feira até você”**.

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

