# Identidade oficial Feiraê

Atualizado em 28/09/2026.

Este documento é a **fonte de verdade visual da marca Feiraê** no produto. UI/UX Pro Max v2.15.0 continua sendo usado como apoio de qualidade, mas não pode criar variações da marca.

## 1. Marca mestre

Arquivos canônicos:

- `public/brand/feirae-logo-horizontal.svg` — lockup oficial para app, gestão e comunicação;
- `public/brand/feirae-symbol.svg` — símbolo reduzido;
- `public/feirae-mark.svg` — alias compatível do símbolo oficial para referências antigas.

### Regra obrigatória

Não reconstruir “Feiraê” com texto solto, emoji, um “ê” isolado, outro toldo ou outra combinação de folhas.

O **ê é sempre Laranja Destaque** e faz parte do lockup oficial. O restante do nome usa Verde Principal.

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

## 11. Sincronização com o styleboard aprovado — 28/09/2026

A aplicação foi realinhada ao styleboard aprovado: palavra **Feira** em verde principal, **ê** em laranja destaque, folhas verdes e assinatura **Da feira até você**. O símbolo reduzido usa o **ê laranja + folhas**, sem o antigo quadrado/toldo como marca principal.

As notificações devem usar o mesmo símbolo canônico do app. Nenhuma superfície deve manter uma versão paralela da marca.
