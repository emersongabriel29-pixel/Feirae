# LGPD e privacidade — Feiraê

Atualizado em 26/09/2026.

Este documento é uma especificação técnica/operacional. A versão pública final deve passar por revisão jurídica antes da produção.

## Dados tratados pelo produto

### Cliente

- nome;
- e-mail;
- telefone;
- CPF quando necessário;
- data de nascimento quando necessário;
- endereços;
- localização/GPS quando autorizado;
- pedidos;
- pagamentos por identificadores/tokens;
- avaliações;
- suporte;
- preferências de comunicação.

### Feirante

Além dos dados de conta:

- CPF/CNPJ;
- banca/box;
- documentos;
- permissões/licenças;
- dados de recebimento;
- produtos;
- pedidos;
- avaliações.

### Entregador

Além dos dados de conta:

- CPF;
- CNH quando aplicável;
- CRLV/veículo;
- capacidade;
- regiões;
- localização durante operação;
- corridas;
- dados de recebimento;
- ocorrências.

## Princípios

Coletar somente o necessário para finalidade definida.

Cada dado precisa ter:

- finalidade;
- base legal aplicável;
- acesso;
- retenção;
- forma de exclusão/anonimização quando cabível.

## GPS

Localização deve ser:

- opcional quando não indispensável;
- solicitada no contexto da função;
- usada para finalidade declarada;
- protegida contra exposição indevida.

Para entregador em corrida, a política deve explicar o rastreamento operacional.

## Documentos

Documentos de identidade e veículo são dados de alto risco operacional.

Produção exige:

- Storage privado;
- acesso restrito;
- URLs assinadas temporárias;
- logs de acesso;
- retenção definida;
- exclusão conforme política;
- não replicar arquivo em logs.

O armazenamento em `localStorage` atual é apenas de protótipo e não é apropriado para documentos reais.

## Pagamentos

Preferir token/ID do provedor.

Não armazenar:

- CVV;
- dados completos de cartão quando não necessários;
- secrets do PSP.

## WhatsApp e marketing

Separar:

- mensagem operacional necessária ao pedido;
- marketing/ofertas.

A preferência “Ofertas e novidades” deve governar comunicação promocional.

Consentimento de WhatsApp deve ser registrável/auditável na produção quando for a base escolhida.

## Direitos do titular

O produto deve prever processo para:

- confirmação/acesso;
- correção;
- exclusão quando cabível;
- informação sobre tratamento;
- revogação de consentimento quando essa for a base;
- revisão de dados incorretos.

## Retenção

A política final deve definir períodos diferentes para:

- conta;
- pedidos/notas/obrigações;
- documentos de onboarding;
- localização;
- logs;
- suporte;
- marketing.

Não usar “guardar para sempre” como padrão.

## Exclusão de conta

A exclusão não pode apagar registros que precisem ser preservados por obrigação legal, fraude, auditoria ou disputa. Nesses casos, restringir/anonimizar conforme política aplicável.

## Acesso interno

Princípio do menor privilégio.

Perfis administrativos distintos podem existir para:

- suporte;
- documentos;
- financeiro;
- operações.

## Incidentes

Definir:

1. identificação;
2. contenção;
3. preservação de evidência;
4. avaliação de impacto;
5. comunicação interna;
6. obrigações de comunicação;
7. correção;
8. pós-incidente.

## Produção

Antes do lançamento:

- [ ] política de privacidade;
- [ ] termos de uso;
- [ ] inventário de dados;
- [ ] bases/finalidades validadas;
- [ ] retenção;
- [ ] processo de direitos;
- [ ] DPA/contratos com operadores;
- [ ] plano de incidente;
- [ ] revisão jurídica.
