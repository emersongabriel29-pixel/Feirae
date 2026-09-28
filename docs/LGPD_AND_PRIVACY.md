# LGPD e privacidade — Feiraê

Atualizado em 26/09/2026 com inventário baseado nas chaves e campos atuais do protótipo.

Este documento descreve os dados realmente mantidos pelo app atual. A política pública final exige revisão jurídica antes de produção.

## 1. Onde os dados ficam hoje

O protótipo usa `localStorage` do navegador.

Não existe backend conectado nem Storage remoto.

Consequências:

- dados ficam no dispositivo/perfil do navegador;
- podem persistir entre sessões;
- podem ser removidos ao limpar dados do site;
- não há política central de retenção;
- não há exclusão remota multi-dispositivo.

## 2. Chaves de cliente

Entre as chaves atuais:

- `feirae:session`;
- `feirae:local-auth:v1`;
- `feirae:account:<email>`;
- `feirae:addresses:<email>`;
- `feirae:cards-v3:<email>`;
- `feirae:favorites:<email>`;
- `feirae:vendor-favorites:<email>`;
- `feirae:customer-reviews:<email>`;
- `feirae:support-general:<email>`;
- `feirae:support-messages:<email>`;
- `feirae:whatsapp:<email>`;
- `feirae:gps:<email>`;
- `feirae:offers:<email>`;
- `feirae:order-updates:<email>`.

## 3. Dados de conta do cliente

Campos disponíveis na conta:

- nome;
- CPF;
- data de nascimento;
- e-mail;
- telefone;
- CEP;
- endereço;
- número;
- complemento;
- cidade;
- UF.

CPF e data de nascimento são coletáveis no protótipo, embora ainda não tenham validação/necessidade jurídica final definida.

## 4. Endereços e localização

Endereços podem conter:

- destinatário;
- CEP;
- logradouro;
- número;
- complemento;
- bairro;
- cidade;
- UF;
- latitude;
- longitude;
- endereço principal.

GPS é solicitado apenas quando o usuário aciona a função correspondente/preferência permite.

Produção precisa definir:

- finalidade;
- precisão necessária;
- tempo de retenção;
- acesso do entregador;
- quando parar de rastrear.

## 5. Cartões no protótipo

Ao salvar cartão, ficam persistidos:

- titular;
- últimos 4 dígitos;
- validade;
- tipo crédito/débito;
- bandeira.

Não ficam persistidos no cartão salvo:

- número completo;
- CVV.

Durante preenchimento, número e CVV existem temporariamente no estado React até salvar/cancelar.

Produção deve usar tokenização do PSP e minimizar também a persistência de validade/titular quando desnecessária.

## 6. Pedido

`orderBridge.ts` pode conter:

- identificador do cliente;
- nome do cliente;
- feira;
- itens;
- bancas;
- preços;
- pesos;
- endereço/cidade;
- coordenadas;
- pagamento;
- troco;
- consentimento WhatsApp;
- eventos;
- motorista;
- veículo/placa mascarada;
- suporte;
- avaliações;
- reembolso.

## 7. Feirante

Chaves atuais incluem:

- conta;
- banca;
- produtos;
- estoque/histórico;
- horários;
- promoções;
- documentos;
- pedidos;
- avaliações;
- recebimento;
- configurações de entrega.

Dados podem incluir:

- CPF/CNPJ;
- data de nascimento;
- telefone/e-mail;
- Pix;
- banco/agência/conta;
- box/banca;
- documentos enviados.

## 8. Entregador

Chaves atuais incluem:

- conta;
- documentos;
- veículos;
- disponibilidade;
- preferências;
- corrida;
- cancelamentos;
- suporte;
- ganhos.

Dados podem incluir:

- CPF;
- data de nascimento;
- telefone/e-mail;
- Pix/banco;
- CNH;
- categoria CNH;
- cidade/UF;
- placa;
- marca/modelo;
- documentos;
- região/raio;
- localização base;
- histórico de corrida.

## 9. Arquivos de documentos

`storedFile.ts` armazena:

- nome;
- MIME declarado;
- tamanho;
- Data URL com o conteúdo completo;
- data de salvamento.

Limite padrão: 1.500.000 bytes por arquivo.

Isso significa que documento real sensível pode ficar serializado dentro do `localStorage`.

O protótipo **não deve ser usado para documentos reais em produção**.

## 10. Retenção atual

Não há TTL.

Na prática, dados permanecem até:

- usuário excluir pelo fluxo específico, quando existe;
- código sobrescrever;
- limpeza do localStorage/dados do site;
- remoção do navegador/app.

Produção precisa definir retenção por classe de dado.

## 11. Classes que exigem retenção própria

Definir separadamente:

- conta;
- endereço;
- pedido;
- documento;
- localização;
- suporte;
- avaliação;
- marketing;
- logs;
- financeiro;
- auditoria.

## 12. WhatsApp e ofertas

Hoje existem preferências locais separadas:

- consentimento WhatsApp no checkout;
- ofertas/novidades;
- atualizações de pedido.

Produção deve separar comunicação operacional de marketing e registrar:

- finalidade;
- canal;
- momento;
- versão do texto;
- revogação.

## 13. Direitos do titular

Backend de produção precisa de processo real para:

- acesso;
- correção;
- exportação quando aplicável;
- exclusão/anonimização quando cabível;
- revogação de consentimento;
- oposição quando cabível;
- confirmação de tratamento.

Hoje não existe serviço central capaz de cumprir isso porque os dados estão no navegador.

## 14. Exclusão de conta

Ainda não existe fluxo completo de exclusão.

Produção precisa distinguir:

- dados apagáveis;
- dados que devem ser retidos por obrigação/disputa/fraude;
- dados a anonimizar;
- documentos;
- dados financeiros.

## 15. Acesso administrativo

Painel ainda não existe.

Quando existir, acesso deve ser limitado por função:

- suporte;
- operações;
- documentos;
- financeiro.

Toda visualização/alteração sensível deve gerar auditoria quando apropriado.

## 16. Incidente

Antes de produção, definir procedimento específico para:

- vazamento de documentos;
- exposição de localização;
- acesso indevido a conta;
- segredo de provedor;
- vazamento financeiro.

## 17. Checklist antes de dados reais

- [ ] Auth real;
- [ ] Storage privado;
- [ ] inventário de dados revisado;
- [ ] base legal/finalidade por dado;
- [ ] política de retenção;
- [ ] exclusão de conta;
- [ ] processo de direitos;
- [ ] consentimentos versionados quando aplicáveis;
- [ ] contrato com operadores;
- [ ] resposta a incidente;
- [ ] revisão jurídica.

## 18. Termos, ciência do aviso e assinatura

Feirante e Entregador possuem um **Aviso de Privacidade e Proteção de Dados** versionado dentro da área Documentos.

A assinatura deste aviso registra **ciência e recebimento da informação**. Ela não converte toda operação de tratamento em consentimento.

O produto distingue bases como:

- execução de contrato e procedimentos preliminares;
- obrigação legal/regulatória;
- exercício regular de direitos;
- legítimo interesse com avaliação e salvaguardas;
- consentimento apenas quando efetivamente necessário.

Marketing, ofertas e WhatsApp comercial permanecem separados e opcionais quando a base adotada exigir escolha do titular.

O protótipo registra termo, versão, nome, e-mail, data/hora e fingerprint do conteúdo em `localStorage`. Isso não é uma trilha probatória suficiente para produção.

Antes de documentos reais:

- identificar razão social/CNPJ/endereço do controlador;
- publicar contato de privacidade/encarregado aplicável;
- guardar aceite no backend com timestamp de servidor e auditoria;
- impedir edição retroativa do documento assinado;
- manter histórico de versões;
- aplicar política real de retenção;
- configurar Storage privado e controle de acesso.

A Resolução CD/ANPD nº 15/2024 deve orientar o processo de incidentes e a Resolução CD/ANPD nº 19/2024 deve ser considerada quando houver transferência internacional.

Detalhamento: [PARTNER_LEGAL_TERMS.md](PARTNER_LEGAL_TERMS.md).

## 19. Cliente — ciência do aviso no cadastro

Ao criar uma conta de Cliente, o Feiraê apresenta dois documentos separados:

- **Termos de Uso do Cliente Feiraê**;
- **Aviso de Privacidade do Cliente Feiraê**.

O Cliente precisa aceitar os Termos de Uso e confirmar que leu o Aviso de Privacidade.

Essa ciência não é tratada como consentimento genérico para todos os dados.

A preferência **Quero receber ofertas e novidades do Feiraê**:

- é opcional;
- inicia desmarcada;
- é armazenada separadamente;
- não bloqueia a criação da conta.

A comunicação operacional necessária a conta, pedido, entrega, segurança ou suporte continua separada de marketing.

O protótipo registra localmente termo, versão, nome, e-mail, data/hora, fingerprint e método de aceite. Produção deve substituir isso por registro server-side auditável.

Detalhamento: [CUSTOMER_LEGAL_TERMS.md](CUSTOMER_LEGAL_TERMS.md).

## Localização no mapa de feiras

O mapa principal de feiras é renderizado localmente pelo Feiraê e não carrega um `iframe` de terceiros.

- O GPS só é solicitado quando o Cliente aciona o recurso de localização já existente.
- A latitude/longitude obtida é usada localmente para mostrar a posição do Cliente e estimar a feira mais próxima.
- O código do mapa nativo não envia essas coordenadas ao Google My Maps.
- O link opcional **Mapa público de referência** não contém coordenadas, nome, e-mail, telefone, endereço, pedido ou identificador de conta.
- Feiras sem coordenada própria usam centro aproximado de região; isso não adiciona dado pessoal.
- Se no futuro houver geocodificação, tiles personalizados, telemetria cartográfica ou envio de localização a terceiro, a avaliação de transparência, minimização, retenção, transferência e base legal deverá ser refeita antes da liberação.

Coordenadas de localização continuam sendo dado pessoal quando associadas ou associáveis a uma pessoa e devem permanecer limitadas à finalidade informada.

## Localização do entregador durante a corrida

O mapa de acompanhamento pode exibir a posição do Entregador enquanto há uma corrida ativa.

Princípios aplicados no protótipo:

- o recurso depende de localização previamente ativada pelo Entregador na configuração de entrega;
- a finalidade é operacional: chegada à feira, coleta e entrega ao Cliente;
- Cliente e Feirante veem apenas o estado necessário ao pedido em andamento;
- o mapa informa quando a moto é apenas uma estimativa por etapa e quando existe GPS compartilhado;
- o snapshot contém coordenadas, precisão e horário de atualização;
- o Google My Maps não recebe esses dados;
- o ícone **Casa do cliente** representa o endereço de entrega já informado no pedido e não cria nova coleta de dado.

Produção deve definir retenção curta para localização de Entregador, acesso por papel/pedido, registro da transparência apresentada, descarte ou anonimização após a finalidade e avaliação específica de segurança do canal realtime.


## Recuperação de senha — impacto de privacidade — 28/09/2026

A recuperação adicionada ao protótipo não envia e-mail nem compartilha dados com terceiros. E-mail, papel da conta e digest da nova senha permanecem no armazenamento local já usado pela autenticação demonstrativa.

Para produção, o envio de link/código de recuperação passa a envolver o e-mail cadastrado como dado pessoal necessário à segurança e execução da conta. O desenho de produção deve documentar:

- finalidade específica de recuperação e segurança da conta;
- provedor responsável pelo envio;
- retenção de eventos de recuperação e tentativas;
- proteção contra enumeração de usuários;
- canal para contestação de redefinição não reconhecida;
- descarte de tokens/OTPs após uso ou expiração;
- ausência de senha, token ou OTP em analytics, logs de aplicação e ferramentas de suporte.
