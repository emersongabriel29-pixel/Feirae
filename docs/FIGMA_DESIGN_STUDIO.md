# Feiraê — Figma Design Studio

Arquivo oficial de design:

https://www.figma.com/design/PEwFNTJNDSveGcDwY2oaON

Repositório de código:

https://github.com/emersongabriel29-pixel/Feirae

## Fonte de verdade

- Código funcional, regras de negócio, testes e integração: GitHub `main`.
- Design aprovado, exploração visual e revisão de layout: **Feiraê — Design Studio** no Figma.
- O Figma não substitui a `main` e não pode alterar produção automaticamente.
- Mudanças visuais aprovadas no Figma devem virar alteração de código revisada no GitHub.

## Estado inicial da integração

Base usada para montar o Design Studio:

- branch: `main`;
- commit de referência: `5d4b81019bee40aebd1b9e5d8ff051e9bfb2507d`;
- framework: React + TypeScript + Vite;
- design system de código: `src/styles/*`;
- identidade: `public/brand/*` e `src/components/FeiraeBrand.tsx`.

## Fluxo oficial

1. GitHub `main` representa a versão executável oficial.
2. O Figma é atualizado a partir da `main` quando necessário.
3. Ajustes visuais são feitos e aprovados no Figma.
4. Somente o design aprovado é implementado no código.
5. A implementação entra por branch/PR.
6. CI precisa passar antes do merge.
7. Depois do merge, o Figma pode ser sincronizado novamente para refletir a nova versão.

## Proteção contra regressão

Ao implementar uma mudança vinda do Figma:

- não alterar regra de negócio sem requisito explícito;
- preservar carrinho, pedido mínimo, autenticação, mapa, GPS, pagamentos, pedidos e fluxos por papel;
- comparar visualmente a tela afetada antes/depois;
- atualizar testes quando o comportamento visual/funcional for coberto;
- cumprir `docs/CHANGE_GOVERNANCE.md`.

## Code Connect

A conta Figma atualmente usada pelo projeto está em plano Starter com assento View. O mapeamento oficial Figma Code Connect não está disponível nesse plano.

Até que haja um plano/assento compatível, a ligação GitHub ↔ Figma é feita por:

- referência bidirecional entre repo e arquivo de design;
- rastreabilidade de commit da `main`;
- sincronização assistida das telas;
- implementação via PR revisado, nunca por sobrescrita automática da `main`.

Quando o Code Connect estiver disponível, os componentes publicados no Figma poderão ser ligados diretamente aos componentes React equivalentes.
