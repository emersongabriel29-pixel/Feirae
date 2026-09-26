# Cadastro, documentos e aprovação — Feiraê

Atualizado em 26/09/2026.

## Estado de implementação

O protótipo já permite:

- cadastro por papel;
- preenchimento de dados;
- upload local de documentos;
- estados localmente simulados de revisão/aprovação;
- bloqueios de operação baseados em aprovação no fluxo local.

Produção ainda exige:

- Auth real;
- Storage privado;
- validação de arquivo;
- revisão administrativa;
- KYC quando escolhido;
- revalidação;
- bloqueio server-side;
- trilha de auditoria.

Os requisitos regulatórios e documentos variam conforme atividade, veículo, feira e regras vigentes. Antes de produção, fontes oficiais devem ser revalidadas e os requisitos devem ser configuráveis, não codificados como verdade universal.

## Regra principal

Criar a conta não significa estar autorizado a vender ou entregar.

Estados de cadastro:

```
account_created
→ documents_pending
→ under_review
→ approved
```

Alternativas:

- correction_required;
- rejected;
- suspended;
- expired_revalidation.

Enquanto não estiver `approved`:

### Feirante

- pode completar perfil;
- pode cadastrar rascunho de banca/produtos;
- não pode publicar/vender;
- não recebe pedidos reais;
- não recebe repasses.

### Entregador

- pode completar perfil/veículos;
- não fica online;
- não aceita corrida;
- não recebe repasses.

## Feirante — documentos do Feiraê

### Identidade básica

Solicitar:

- documento oficial com foto;
- CPF;
- selfie/verificação de identidade na fase KYC real;
- data de nascimento;
- comprovante de endereço;
- telefone e e-mail verificados.

### Direito de operar na feira

Campo obrigatório para feira pública:

- feira;
- box/banca;
- número/localização;
- categoria de feirante;
- número/data do instrumento;
- upload do **Termo de Permissão de Uso**, cessão/autorização válida ou documento equivalente emitido pelo órgão competente.

A Lei distrital nº 6.956/2021 estabelece que só pode comercializar em feira pública quem tiver permissão do órgão competente.

### Pessoa física

O cadastro pode ser PF quando admitido pela regra da feira.

Coletar:

- CPF;
- identidade;
- comprovante de residência;
- instrumento de permissão/autorização;
- dados de recebimento compatíveis.

### Pessoa jurídica

Além dos itens do responsável:

- CNPJ;
- razão social/nome fantasia;
- CF/DF quando aplicável;
- documento do representante;
- prova de representação;
- dados de recebimento da PJ.

### Evidências usadas em editais oficiais de feiras do DF

Editais/projetos oficiais recentes listam, entre outros:

- ficha de inscrição;
- foto recente;
- documento oficial com foto;
- CPF para PF;
- CF/DF para PJ;
- Certidão Negativa de Débitos com a Fazenda do DF;
- Certidão Negativa de Débitos com a Fazenda Federal;
- comprovante/declaração de residência;
- CNDT para PJ;
- declarações exigidas pelo edital.

No Feiraê, esses documentos devem ser separados em:

1. **obrigatórios para ativação na plataforma**;
2. **documentos oficiais da permissão/licitação**, que podem variar por feira/editais.

Não exigir uma certidão só porque apareceu em um edital antigo sem conferir se ela se aplica ao caso atual.

### Atividade alimentícia

Quando a atividade exigir, pedir os documentos/licenças sanitárias aplicáveis ao produto/atividade.

O sistema deve ter campos para:

- licença/registro sanitário quando aplicável;
- validade;
- órgão emissor;
- documentos de origem/inspeção para categorias reguladas.

A legislação das feiras exige respeito às normas sanitárias e manutenção de registro da procedência dos produtos.

## Entregador — documentação básica

Para qualquer entregador:

- documento oficial com foto;
- CPF;
- selfie/KYC na fase real;
- data de nascimento;
- telefone/e-mail verificados;
- comprovante de residência;
- chave Pix/conta de recebimento;
- aceite de termos;
- checagens antifraude.

## Bicicleta / bicicleta cargueira / triciclo não motorizado

Não exigir CNH.

Cadastrar:

- tipo;
- foto do veículo;
- capacidade declarada;
- identificação interna;
- região de atuação.

Pode haver regras municipais/distritais futuras específicas; manter configuração separada.

## Carro, utilitário ou van

Exigir para operação remunerada:

- CNH compatível e válida;
- observação EAR quando aplicável à atividade remunerada;
- CRLV-e vigente;
- placa;
- marca/modelo;
- titularidade/vínculo com veículo;
- capacidade cadastrada.

O Detran-DF informa que a avaliação psicológica/EAR se aplica quando a pessoa pretende trabalhar profissionalmente com transporte de passageiros ou cargas.

## Moto/motoneta — motofrete

Tratar como categoria mais restritiva.

O Detran-DF informa para motofrete, entre os requisitos/documentos:

- idade mínima de 21 anos;
- CNH categoria A há pelo menos 2 anos;
- curso especializado de motofrete;
- CNH com homologação do curso;
- veículo regularizado para motofrete/categoria aplicável;
- CRLV-e vigente;
- comprovante de residência no DF;
- checagens/certidões previstas no processo de vistoria/autorização.

A Lei federal nº 12.009/2009 e regulamentação de trânsito estabelecem requisitos específicos ao motociclista profissional.

O Feiraê não deve liberar corridas de moto apenas porque o usuário enviou uma CNH A.

## Fluxo de revisão

### 1. Envio

Usuário envia documentos.

### 2. Validação automática

Quando houver integração:

- documento legível;
- validade;
- CPF/CNPJ;
- correspondência de nome;
- duplicidade;
- fraude básica.

### 3. Revisão

Admin vê:

- dados;
- documentos;
- status por item;
- motivo de pendência.

### 4. Correção

Estado:
`correction_required`

Usuário recebe exatamente:

- qual documento;
- qual problema;
- como corrigir;
- prazo quando aplicável.

### 5. Aprovação

Estado:
`approved`

Só então:

- Feirante pode publicar e aceitar pedidos.
- Entregador pode ficar online e aceitar corridas.

## Revalidação

Documentos com validade precisam de:

- `issued_at`;
- `expires_at`;
- alerta antes do vencimento;
- suspensão automática/configurável quando documento crítico expirar.

Exemplos:

- CNH;
- CRLV;
- licença/autorizações específicas;
- documentos sanitários aplicáveis.

## Suspensão

Motivos possíveis:

- documento expirado;
- permissão da feira suspensa/cassada;
- fraude;
- risco de segurança;
- ordem administrativa;
- sanção da plataforma.

Toda suspensão deve ter:

- motivo;
- autor;
- timestamp;
- prazo/condição para retorno;
- trilha de auditoria.

## Fontes oficiais consultadas

- Lei nº 6.956/2021 — feiras públicas do DF:
  https://www.sinj.df.gov.br/sinj/Norma/410afc4ea07d467a89a433d0fda0e5a1/Lei_6956_2021
- Projeto/Edital de feira do DF com documentação de habilitação:
  https://segov.df.gov.br/documents/d/segov/projeto-basico-pdf
- Edital/Projeto Paranoá — documentação de habilitação:
  https://segov.df.gov.br/documents/d/segov/xiii-paranoa
- Detran-DF — curso de formação para motofrete:
  https://www.detran.df.gov.br/wp-content/uploads/2018/11/EDUCA%C3%87%C3%83O-PDF..pdf
- Detran-DF — vistoria/autorização de motofrete:
  https://sisman.maestro.detran.df.gov.br/visualizar-carta/pdf/?area=28&layout=true
- DNIT — requisitos legais de motofrete/mototáxi:
  https://www.gov.br/dnit/pt-br/assuntos/noticias/motofretista-e-mototaxista-o-que-diz-a-lei
