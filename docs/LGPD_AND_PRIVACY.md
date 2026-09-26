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
