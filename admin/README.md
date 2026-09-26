# Feiraê Gestão

Painel administrativo web independente do aplicativo principal.

## Objetivo

Permitir que a operação altere cadastros, regras comerciais e parâmetros do Feiraê sem editar código nem fazer deploy para mudanças rotineiras.

O painel usa:

- HTML/CSS/JavaScript próprios em `/admin`;
- Supabase Auth para login;
- chave `anon/public` no navegador;
- Row Level Security para exigir `profiles.role = 'admin'`;
- tabelas de configuração criadas pela migration `0003_management_console.sql`;
- trilha de auditoria para mudanças administrativas.

**Nunca coloque a service role, chaves privadas de pagamento, tokens do WhatsApp, Maps ou outros segredos no navegador.**

## Como abrir

Sirva a pasta `admin` em um servidor HTTP estático. Na primeira abertura o painel pede:

1. Project URL do Supabase;
2. chave anon/public;
3. login de uma conta existente com papel `admin`.

A conexão fica salva apenas no navegador utilizado.

## Bootstrap do primeiro administrador

Depois de criar a conta no Supabase Auth e o registro correspondente em `public.profiles`, defina o papel como `admin` uma única vez pelo ambiente seguro do Supabase.

Depois disso, a gestão de papéis pode ser feita pelo próprio painel, com auditoria.

## Módulos

- Visão geral e indicadores;
- Pedidos;
- Entregas;
- Suporte;
- Aprovação documental com abertura segura do arquivo;
- Estados e cobertura por UF;
- Feiras;
- Usuários;
- Feirantes;
- Entregadores;
- Suspensões, banimentos e bloqueios;
- Produtos;
- Categorias;
- Regiões de atendimento;
- Catálogo global de veículos permitidos, status e peso máximo;
- Regras de frete;
- Taxas da plataforma;
- Meios de pagamento;
- Motivos de cancelamento;
- Documentos exigidos no onboarding;
- Promoções;
- Repasses;
- Moderação de avaliações;
- Conteúdo;
- Avisos;
- Templates de mensagens;
- Feature flags;
- Configurações gerais;
- Registro/status de integrações;
- LGPD;
- Permissões administrativas granulares;
- Auditoria.

## Repositório

A pasta `admin` não depende do bundle React do app. Ela já pode ser publicada como site separado.

Na fase de produção é recomendável mover a pasta para um repositório próprio, por exemplo `Feirae-Gestao`, mantendo o mesmo Supabase. Isso separa deploy e permissões sem duplicar o banco ou as regras.
