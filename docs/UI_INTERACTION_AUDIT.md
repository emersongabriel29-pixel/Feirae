# Auditoria de botões, campos e edição — Feiraê

Atualizado em 26/09/2026.

## Objetivo

Evitar controles que parecem funcionais, mas não produzem efeito.

## Critério obrigatório

Todo botão, card clicável, seletor, toggle ou campo exibido deve:

1. executar ação correspondente;
2. validar entradas;
3. persistir no momento correto;
4. refletir em telas relacionadas;
5. oferecer estado disabled quando indisponível;
6. evitar “clique que não faz nada”;
7. não persistir rascunho antes de Salvar quando a interface promete Salvar/Cancelar.

## Achados corrigidos

### Autenticação

Corrigido:

- senha deixou de ser ignorada;
- login incorreto retorna erro;
- cadastro local registra credencial;
- troca de senha local funciona;
- e-mail/nome atualizam sessão;
- senha em texto de implementação antiga é removida.

Limite: mecanismo local é somente protótipo.

### Conta

Cliente, feirante e entregador:

- edição usa rascunho;
- Salvar aplica;
- Descartar cancela;
- e-mail/nome atualizam identidade local;
- nova senha não fica junto do perfil comum.

### Banca

- Editar abre rascunho;
- Salvar persiste;
- Cancelar descarta.

### Checkout

Opções indisponíveis ficam `disabled`:

- entrega;
- retirada;
- dinheiro na entrega;
- cartão na maquininha.

### Produto em banca fechada

Botão de adicionar fica desabilitado em vez de executar handler vazio.

### Preferências

- atualizações de pedido controlam badge/notificações;
- GPS governa solicitação de localização;
- ofertas governam notificações promocionais;
- cards compactos alteram layout;
- WhatsApp é levado ao pedido como consentimento/preferência.

### Ajuda do entregador

- campo “Detalhe do atendimento” usa o valor digitado;
- protocolo persiste;
- histórico é exibido.

### Documentos

- feirante;
- entregador;
- veículo.

O protótipo passa a armazenar o conteúdo do arquivo localmente, com limite, e não apenas o nome.

Produção ainda requer Storage privado.

## Cobertura

A rodada adicionou testes para:

- senha incorreta;
- alteração de nome/e-mail/senha;
- cards compactos;
- suporte do entregador;
- cancelamento de edição da banca;
- autenticação local.

A suite total de referência possui 69 testes.

## Regras para novos controles

### Botões

Não usar:

```tsx
onClick={() => undefined}
```

Se indisponível:

```tsx
disabled;
```

e explicar o motivo.

### Formulários

Se existe botão Salvar:

- usar draft;
- não persistir em cada tecla;
- permitir descartar quando risco de alteração acidental existir.

### Toggle

Não criar preferência que apenas salva boolean sem consumidor funcional. Toda configuração precisa ter efeito documentado.

### Upload

Upload precisa:

- validar;
- armazenar/enviar;
- refletir estado;
- permitir substituição;
- mostrar falha.

### Teste

Novo controle crítico deve ter teste de comportamento, não apenas teste de presença.
