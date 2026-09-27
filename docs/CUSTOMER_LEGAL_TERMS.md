# Termos do Cliente — Feiraê

Atualizado em 27/09/2026.

## Objetivo

O Cliente não envia documentos para criar conta, mas precisa receber informação jurídica clara antes do cadastro e confirmar separadamente:

1. **Termos de Uso do Cliente Feiraê**;
2. **Aviso de Privacidade do Cliente Feiraê**.

O cadastro não deve usar um único checkbox genérico de “aceito tudo”.

## Fluxo de criação da conta

Na opção **Criar conta → Cliente**:

- o Feiraê mostra um bloco **Antes de criar sua conta**;
- o Cliente pode abrir e ler integralmente os Termos de Uso;
- pode abrir e ler integralmente o Aviso de Privacidade;
- precisa marcar **Li e aceito os Termos de Uso do Cliente Feiraê**;
- precisa marcar **Li o Aviso de Privacidade e estou ciente de como meus dados são tratados**;
- a preferência **Quero receber ofertas e novidades do Feiraê** é opcional e inicia desmarcada;
- sem as duas confirmações obrigatórias, a conta não é criada.

## Termos de Uso do Cliente

O texto cobre, entre outros pontos:

- conta e veracidade das informações;
- papel do Feiraê no fluxo entre Cliente, Feirante e Entregador;
- oferta, preço, taxas e informação clara;
- pedido, pagamento, retirada e entrega;
- cancelamento, suporte e direito de arrependimento quando cabível;
- peso real, substituição e divergências;
- ética, respeito e avaliações verdadeiras;
- segurança e prevenção de fraude;
- alteração e versionamento dos Termos.

Os Termos não afastam direitos do consumidor nem tentam excluir responsabilidade legal irrenunciável.

### Base federal consultada

- Código de Defesa do Consumidor — Lei nº 8.078/1990;
- Decreto nº 7.962/2013 — contratação no comércio eletrônico;
- Marco Civil da Internet — Lei nº 12.965/2014.

## Aviso de Privacidade

O aviso explica:

- categorias de dados;
- finalidades;
- bases legais;
- compartilhamento necessário com Feirante, Entregador e provedores;
- localização;
- pagamentos;
- ofertas, marketing e WhatsApp;
- retenção;
- segurança;
- direitos do titular;
- atualização de versão.

A ciência do Aviso não equivale a consentimento genérico.

A LGPD permite diferentes bases legais, incluindo execução de contrato, obrigação legal, exercício regular de direitos, legítimo interesse e consentimento quando adequado.

## Registro do aceite no protótipo

Ao criar uma nova conta de Cliente, o protótipo registra em `localStorage`:

- termo;
- versão;
- papel `customer`;
- nome;
- e-mail;
- data/hora;
- fingerprint local do conteúdo;
- método `checkbox`.

Chave:

```
feirae:customer-legal-acceptances:<email>
```

A preferência de ofertas é gravada separadamente em:

```
feirae:offers:<email>
```

## Acesso posterior

Depois do login, o Cliente continua podendo consultar as versões atuais em:

**Perfil → Configurações → Termos e privacidade**

## Produção

O registro em `localStorage` é apenas para o protótipo.

Antes de produção, o aceite deve ser armazenado em backend auditável com:

- account ID autenticado;
- versão;
- hash do conteúdo;
- timestamp de servidor;
- histórico de versões;
- impossibilidade de alteração retroativa;
- evidência do método de aceite;
- política de retenção.

Também deve existir identidade completa do controlador, canal de privacidade e política de direitos do titular.

## Referências oficiais

- CDC: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Decreto nº 7.962/2013: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm
- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- ANPD: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes
