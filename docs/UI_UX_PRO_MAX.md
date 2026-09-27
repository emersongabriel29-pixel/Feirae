# UI UX Pro Max no Feiraê

## Status

Instalado no repositório para uso com **GitHub Copilot**.

- Origem: `nextlevelbuilder/ui-ux-pro-max-skill`
- Versão fixada: **v2.15.0**
- Prompt principal: `.github/prompts/ui-ux-pro-max.prompt.md`
- Base local: `.github/prompts/ui-ux-pro-max/data/`
- Motor de busca: `.github/prompts/ui-ux-pro-max/scripts/search.py`

## Skills incluídas

A instalação acompanha o comportamento do instalador oficial para Copilot e inclui:

- `ui-ux-pro-max`
- `banner-design`
- `brand`
- `design-system`
- `design`
- `slides`
- `ui-styling`

Os arquivos auxiliares ficam como skills irmãs em `.github/prompts/`.

## Uso no GitHub Copilot

No Copilot Chat, use o prompt **ui-ux-pro-max** para tarefas de UI/UX. O prompt orienta o agente a consultar a base local antes de propor estilos, cores, tipografia, acessibilidade, componentes e implementação por stack.

Para consultas manuais, com Python 3 disponível:

```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py "marketplace feira delivery mobile" --design-system -p "Feiraê"
python3 .github/prompts/ui-ux-pro-max/scripts/search.py "mobile marketplace responsive cards" --stack react
python3 .github/prompts/ui-ux-pro-max/scripts/search.py "checkout accessibility touch targets" --domain ux
```

## Integração com o Feiraê

O Feiraê usa React + Vite + Tailwind. Para trabalho de interface:

1. consultar o design system existente em `docs/DESIGN_SYSTEM.md`;
2. usar UI UX Pro Max como inteligência complementar;
3. preservar a identidade verde/branco e a linguagem visual já aprovada;
4. não substituir decisões de produto por sugestões genéricas da skill;
5. validar acessibilidade, responsividade e testes antes de merge.

## Arquivos vendorizados

Os arquivos em `.github/prompts/` são conteúdo de terceiros copiado da versão fixada. Eles ficam fora do ESLint e do Prettier do aplicativo para evitar alterações automáticas no conteúdo upstream.

A licença upstream está preservada em:

`.github/prompts/ui-ux-pro-max/UPSTREAM-LICENSE.txt`

## Atualização

Não atualizar os arquivos manualmente de forma parcial. Quando houver nova versão, comparar com a versão fixada e atualizar o conjunto completo para evitar incompatibilidade entre prompt, dados e scripts.
