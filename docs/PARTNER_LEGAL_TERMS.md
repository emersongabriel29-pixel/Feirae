# Termos jurídicos de parceiros — Feiraê

Atualizado em 28/09/2026.

> Documento de implementação e governança jurídica do produto. Os textos completos exibidos ao usuário ficam em `src/domain/legalTerms.ts`. Antes de produção com pessoas e documentos reais, a identidade jurídica do operador do Feiraê, o modelo financeiro, a jurisdição de operação e as regras locais precisam ser revisados por assessoria jurídica brasileira.

## 1. Documentos obrigatórios

### Feirante

Para ficar aprovado, o Feirante precisa ter a versão vigente de:

1. **Termo de Adesão, Conduta e Responsabilidade do Feirante**;
2. **Aviso de Privacidade e Proteção de Dados — Parceiros Feiraê**;
3. documentos cadastrais/licenças obrigatórios aprovados conforme a atividade.

O termo não é uma declaração genérica. Ele trata de:

- identidade, veracidade e fraude documental;
- responsabilidade pela banca e pelos produtos;
- Código de Defesa do Consumidor e comércio eletrônico;
- estoque, peso, quantidade e substituição;
- alimentos, higiene, conservação, validade e segurança sanitária;
- origem lícita e produtos proibidos/restritos;
- tributos, autorizações e regularidade;
- taxas, repasses, estornos e fraude financeira;
- ética, não discriminação, assédio, violência e manipulação de avaliações;
- proteção dos dados do cliente;
- segurança da conta;
- evidências e auditoria;
- suspensão, contestação e proporcionalidade;
- responsabilidade civil;
- propriedade intelectual;
- encerramento da relação e solução de conflitos;
- autonomia da atividade sem tentativa de afastar norma trabalhista imperativa.

### Entregador

Para ficar aprovado, o Entregador precisa ter a versão vigente de:

1. **Termo de Adesão, Segurança e Conduta do Entregador Parceiro**;
2. **Aviso de Privacidade e Proteção de Dados — Parceiros Feiraê**;
3. documentos exigíveis para a pessoa e para o veículo ativo.

O termo cobre:

- identidade, habilitação, veículo e documentos verdadeiros;
- autonomia, possibilidade de ficar online/offline, ausência de exclusividade e recusa de oferta antes do aceite;
- inexistência de quantidade mínima de corridas;
- diferença entre autonomia contratual e eventual reconhecimento jurídico baseado nos fatos;
- informações da corrida antes do aceite;
- coleta e entrega verdadeiras;
- segurança viária e proibição de incentivo à infração;
- regras específicas de moto-frete;
- capacidade e regularidade do veículo;
- transporte seguro de alimentos/mercadorias;
- ética e respeito a cliente, feirante e suporte;
- fraude, GPS falso, conta compartilhada e entrega simulada;
- ganhos, despesas e tributos;
- acidentes, emergência e seguro;
- cancelamento e suporte;
- geolocalização e dados do cliente;
- suspensão, recurso e responsabilidade.

## 2. Vínculo empregatício

Os termos não usam a frase “não há vínculo” como blindagem absoluta.

O produto precisa ser coerente com a autonomia descrita:

- entregador pode ficar online/offline;
- não há exclusividade;
- pode rejeitar oferta antes do aceite;
- não existe quantidade mínima de corridas;
- segurança e requisitos legais não podem ser transformados em controle disfarçado de jornada;
- punição automática por recusa legítima não faz parte do modelo definido.

A CLT, especialmente os arts. 2º, 3º e 9º, continua aplicável quando os fatos preencherem os requisitos legais, independentemente do nome dado ao contrato.

Fonte oficial:

- https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm

## 3. Moto-frete

Para motocicleta/motoneta em entrega remunerada, o Feiraê deve aplicar os requisitos federais vigentes e também regras estaduais/municipais da área de operação.

O termo registra, entre outros pontos:

- idade mínima de 21 anos;
- habilitação por pelo menos dois anos na categoria exigida;
- curso especializado;
- colete de segurança com dispositivos retrorrefletivos;
- requisitos do veículo previstos na Lei nº 12.009/2009/CTB;
- especialização e procedimentos conforme regulamentação atual do Contran.

Fontes oficiais:

- Lei nº 12.009/2009: https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12009.htm
- Resolução Contran nº 1.020/2025: https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao10202025.pdf

A configuração do Feiraê deve bloquear operação real quando requisito obrigatório do veículo/condutor não estiver válido.

## 4. Consumidor e comércio eletrônico

O Feirante continua responsável pela veracidade e adequação da oferta e pelos deveres que a legislação atribuir ao fornecedor.

Fontes:

- Lei nº 8.078/1990 — CDC: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Decreto nº 7.962/2013 — comércio eletrônico: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm

O produto não deve permitir cláusula que:

- elimine direito legal do consumidor;
- transfira toda responsabilidade ao consumidor ou entregador de forma genérica;
- autorize propaganda enganosa;
- dispense informação de preço, quantidade, característica essencial ou condição de entrega;
- elimine canais de atendimento/cancelamento exigíveis.

## 5. Segurança sanitária e alimentos

Para atividades abrangidas, o termo exige boas práticas e licenças aplicáveis.

Fontes federais utilizadas:

- RDC Anvisa nº 216/2004: https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2004/res0216_15_09_2004.html
- RDC Anvisa nº 727/2022 e consolidação de rotulagem: https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/regulacao-de-alimentos-consolidacao-de-atos-normativos
- RDC Anvisa nº 429/2020 + IN nº 75/2020: https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem/rotulagem-nutricional
- Lei nº 6.437/1977: https://www.planalto.gov.br/ccivil_03/leis/l6437compilado.htm

Estados, DF e municípios podem possuir licenças e regras adicionais. A área de gestão futura precisa permitir configurar requisitos locais por região/categoria.

## 6. LGPD — ciência não é “consentimento geral”

O Aviso de Privacidade separa:

- **ciência do aviso**;
- **base legal do tratamento**;
- **consentimento opcional**, quando realmente utilizado.

Tratamentos necessários ao contrato, obrigação legal, exercício de direitos ou legítimo interesse não são apresentados como se dependessem de um checkbox genérico de consentimento.

Bases consideradas no aviso:

- execução de contrato/procedimentos preliminares — LGPD art. 7º, V;
- obrigação legal/regulatória — art. 7º, II;
- exercício regular de direitos — art. 7º, VI;
- legítimo interesse, com avaliação e salvaguardas — art. 7º, IX;
- consentimento — utilizado apenas quando apropriado e revogável.

Fontes:

- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- Direitos do titular — ANPD: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados
- Guia de legítimo interesse — ANPD: https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/documentos-de-publicacoes/guia_legitimo_interesse.pdf

Marketing, ofertas promocionais e WhatsApp comercial devem permanecer separados de comunicações necessárias à execução do pedido.

## 7. Geolocalização

O Entregador pode ter geolocalização tratada para:

- compatibilidade de corridas;
- rota e ETA;
- segurança;
- suporte;
- execução da entrega;
- prevenção de fraude.

A coleta deve respeitar necessidade e finalidade. O Feiraê não deve manter rastreamento contínuo sem justificativa depois de encerrada a finalidade operacional.

## 8. Incidentes de dados

A produção deve possuir fluxo real de incidente.

A Resolução CD/ANPD nº 15/2024 disciplina a comunicação de incidente com risco ou dano relevante, incluindo prazo regulamentar de três dias úteis nas hipóteses aplicáveis e manutenção dos registros pelo período exigido.

Fonte:

- https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis

## 9. Transferência internacional

Se serviços de nuvem, KYC, pagamento, analytics, comunicação ou suporte tratarem dados fora do Brasil, aplicar os mecanismos previstos na LGPD e na Resolução CD/ANPD nº 19/2024.

Fonte:

- https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024

## 10. Assinatura eletrônica

A interface registra no protótipo:

- ID do termo;
- versão;
- papel do signatário;
- nome digitado;
- e-mail;
- data/hora;
- impressão digital do conteúdo;
- método de aceite.

A MP nº 2.200-2/2001 reconhece documentos eletrônicos e não impede outros meios de comprovação de autoria e integridade quando admitidos pelas partes.

Fonte:

- https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm

### Produção

O registro atual em `localStorage` **não é suficiente como trilha probatória robusta** porque o próprio usuário pode alterar dados no navegador.

Antes de produção, assinatura/aceite deve ser gravado no backend em trilha imutável ou auditável, incluindo:

- ID interno da conta;
- termo + versão;
- hash do documento;
- timestamp de servidor;
- evento de autenticação;
- IP quando justificado e informado;
- user-agent/dispositivo quando necessário;
- versão da política de privacidade;
- histórico de nova aceitação;
- impossibilidade de editar silenciosamente o documento já assinado.

O backend pode adicionar OTP, autenticação reforçada ou provedor de assinatura quando o risco jurídico justificar.

## 11. Versionamento

Termos são versionados.

Regra:

```
versão assinada === versão vigente
```

Se a versão mudar:

- o status volta a **Termos pendentes**;
- o parceiro lê a nova versão;
- confirma novamente as declarações;
- assina novamente;
- a versão antiga continua preservada na auditoria de produção.

## 12. Relação com aprovação

### Feirante

```
termos vigentes assinados
AND documentos obrigatórios aprovados
AND cadastro operacional válido
→ pode operar
```

### Entregador

```
termos vigentes assinados
AND documentos obrigatórios do perfil/veículo aprovados
AND veículo elegível
AND demais regras de disponibilidade
→ pode receber/aceitar corrida
```

## 13. Regras locais e revisão jurídica

As fontes acima formam a base federal usada nesta versão.

Antes de produção em cada Estado/DF e município, revisar pelo menos:

- regras da feira e permissões de uso;
- vigilância sanitária local;
- licenciamento de atividade;
- transporte/moto-frete local;
- exigências fiscais;
- condições de pagamento e repasse;
- identidade jurídica do operador do Feiraê;
- tratamento de dados por fornecedores contratados.

A revisão jurídica não é apenas editorial: se o modelo operacional mudar, os termos, a interface, as regras de aprovação e o comportamento real também precisam mudar juntos.


## Identidade visual e versionamento jurídico — 28/09/2026

A apresentação destes termos no aplicativo passou a usar a identidade oficial definida em `BRAND_IDENTITY.md`:

- símbolo canônico Feiraê;
- Verde Feira, Verde Folha, Amarelo Feiraê, Creme Natural e Marrom Terra;
- mesma hierarquia visual da Central de Documentos e demais superfícies do produto.

Esta atualização é **somente de apresentação/branding**. O conteúdo jurídico, a versão lógica dos termos e seus fingerprints **não foram alterados** por esta revisão. Portanto, a padronização visual não deve, por si só, exigir uma nova assinatura. Qualquer mudança futura no texto jurídico material deve criar nova versão, novo fingerprint e seguir a regra de reaceite quando aplicável.
