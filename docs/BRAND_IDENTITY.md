# Identidade oficial Feiraê

Atualizado em 28/09/2026.

Este documento é a **fonte de verdade visual da marca Feiraê** no produto. UI/UX Pro Max v2.15.0 continua sendo usado como apoio de qualidade, mas não pode criar variações da marca.

## 1. Marca mestre

A arte aprovada pelo projeto é a **única fonte de verdade da logomarca**: duas folhas verdes no topo, toldo verde + creme, palavra **Feira** em verde, **ê** em laranja e traço verde inferior.

Arquivos canônicos:

- `public/brand/feirae-logo-approved.webp` — arte mestre aprovada, preservando visualmente o arquivo fornecido;
- `public/brand/feirae-logo-horizontal.svg` — wrapper compatível para componentes existentes, apontando para a arte mestre;
- `public/brand/feirae-symbol.svg` — ícone quadrado que reutiliza a mesma arte mestre, sem redesenhar a marca;
- `public/feirae-mark.svg` — alias compatível para referências antigas, também reutilizando a mesma arte.

### Regra obrigatória

Não reconstruir “Feiraê” com texto solto, emoji, um “ê” isolado, outro toldo, outras folhas ou outra tipografia. Não substituir a arte mestre por uma versão simplificada.

O fundo institucional recomendado para a marca é creme claro próximo de `#FBF8EF`. Em superfícies verdes ou escuras, a marca deve aparecer sobre cartão/superfície creme para preservar contraste e fidelidade.

## 2. Assinatura verbal

- marca: **Feiraê**;
- assinatura de marca: **Da feira até você**;
- slogan institucional: **A feira do seu jeito**;
- propósito da entrada: **Da banca até você.**

Essas frases têm papéis diferentes e não devem ser misturadas.

## 3. Paleta oficial

| Token            | Cor       | Uso                                         |
| ---------------- | --------- | ------------------------------------------- |
| Verde Principal  | `#0B5E3A` | marca, CTAs, confiança                      |
| Verde Secundário | `#22C55E` | frescor, estados positivos, destaques       |
| Laranja Destaque | `#FF8A00` | ê, energia e destaque da marca              |
| Amarelo Apoio    | `#FFC107` | rota e microdestaques                       |
| Fundo Creme      | `#FFF8EB` | fundos institucionais e superfícies quentes |
| Marrom Terra     | `#8B5E34` | madeira, tradição, apoio visual             |

Cores semânticas de erro/informação podem existir, mas não substituem a paleta de marca em superfícies institucionais.

## 4. Elementos proprietários

O universo visual usa, com moderação:

- toldo verde + creme;
- duas folhas;
- banca e caixas de madeira;
- produtos frescos;
- pin de localização;
- rota amarela;
- entrega por moto;
- fundos claros e quentes.

Folhas e brilhos são elementos de apoio. Não cobrir conteúdo funcional nem transformar telas em peças publicitárias.

## 5. Tipografia

UI funcional:

- Inter/system para textos, tabelas e formulários;
- títulos fortes, arredondados visualmente pelo peso e espaçamento;
- nunca usar uma fonte decorativa para dados operacionais.

A aparência especial do nome Feiraê fica contida no **asset da marca**, não em uma fonte global.

## 6. Aplicação no app

Toda superfície deve reutilizar os tokens de `src/styles/tokens.css`.

O componente `src/components/FeiraeBrand.tsx` é o ponto padrão para exibir o lockup em React.

Proibido:

- `ê` sozinho como marca;
- “Feiraê.” com ponto laranja improvisado;
- criar novo wordmark em CSS;
- alterar cor do ê;
- trocar o toldo;
- inserir emoji como símbolo institucional.

## 7. Gestão

A página `/gestao/` usa a mesma identidade. O shell visual não comprova backend administrativo: ações reais continuam condicionadas a RBAC, auditoria, migrations e APIs descritas em `ADMIN_MANAGEMENT_SPEC.md`.

## 8. UI/UX Pro Max

A ordem de decisão é:

1. identidade oficial Feiraê;
2. regras de produto e fluxos já aprovados;
3. design system do Feiraê;
4. UI/UX Pro Max como inteligência complementar.

Uma recomendação genérica do UI/UX Pro Max não pode substituir o lockup, paleta ou linguagem oficial.

## 9. Checklist para novas telas

Antes de aprovar uma tela:

- usa lockup/símbolo canônico?
- usa tokens oficiais?
- ê não foi recriado?
- mobile funciona a partir de 320 px?
- foco/contraste/alvos de toque estão adequados?
- loading/erro/sucesso/disabled foram considerados?
- a hierarquia parece produto Feiraê, e não template genérico?

## 10. Status de adoção

Esta identidade é a referência obrigatória para app, splash, gestão e novas peças digitais.

## 11. Sincronização com a arte aprovada — 28/09/2026

A identidade foi travada na arte aprovada enviada ao projeto: **folhas verdes + toldo verde/creme + Feira verde + ê laranja + traço verde inferior**.

A aplicação no app foi ajustada para respeitar a proporção mais vertical dessa marca, sem esticar o arquivo para simular uma logo horizontal. Cabeçalhos, login e gestão usam fundo creme e dimensões próprias para manter legibilidade.

As notificações, favicon e referências legadas continuam apontando para os aliases canônicos, que agora reutilizam a mesma arte aprovada. Nenhuma superfície deve manter a versão simplificada anterior.


## 12. Correção de renderização no preview — 28/09/2026

O componente React `FeiraeBrand` passa a carregar a arte aprovada diretamente de `/brand/feirae-logo-approved.webp`. A tentativa anterior de colocar o WebP dentro de um SVG por meio de `<image href=...>` foi removida da aplicação principal porque alguns ambientes de preview tratam SVG carregado por `<img>` como recurso isolado e não carregam a imagem externa, deixando apenas um bloco vazio.

A apresentação visual também volta a ser limpa: a marca não recebe cartão creme, borda ou sombra por padrão no cabeçalho. Os SVGs de símbolo/alias permanecem autocontidos como fallback vetorial para favicon, ilustrações e superfícies que não devem depender de imagem externa.
