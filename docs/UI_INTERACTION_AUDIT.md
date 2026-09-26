# Auditoria de botões, campos e edição — Feiraê

Atualizado em 26/09/2026.

## Correções já aplicadas

### Login

- senha é verificada;
- senha errada mostra erro;
- criar conta cria credencial local;
- trocar e-mail/senha atualiza login local.

Teste direto:

- `rejects an incorrect password instead of ignoring it`;
- testes de `localAuth.test.ts`.

### Conta do cliente

- usa rascunho;
- Salvar persiste;
- Descartar reverte;
- nome/e-mail/senha atualizam identidade.

Teste direto:

`applies customer name email and password only when the account form is saved`.

### Banca

- editar usa draft;
- Salvar persiste;
- Cancelar descarta.

Testes:

- `can discard bank edits...`;
- `opens real bank editing...`.

### Checkout

Opções incompatíveis usam `disabled`:

- entrega;
- retirada;
- dinheiro na entrega;
- cartão na entrega.

Há cobertura de modalidades em testes, mas não há um teste nominal separado para cada estado disabled.

### Produto de banca fechada

Botão de adicionar recebe `disabled`.

### Cards compactos

Preferência altera classe:

```
html.compact-product-cards
```

Teste direto existente.

### Suporte do entregador

Detalhe digitado é usado no ticket local.

Protocolos persistem em:

`feirae:delivery-help:<email>`.

Teste direto existente.

### Documentos

Upload de:

- feirante;
- entregador;
- veículo.

usa `readFileForLocalStorage()`.

O arquivo não é só nome: Data URL é persistido.

## Upload — validação real atual

`storedFile.ts` faz:

- limite 1.500.000 bytes;
- FileReader;
- nome;
- `file.type`;
- tamanho;
- Data URL.

Não faz:

- magic bytes;
- validação do conteúdo;
- antivírus;
- PDF parsing.

O atributo `accept=".pdf,image/*"` da UI não é controle de segurança.

## Preferências com efeito

### Cards compactos

Efeito comprovado.

### Atualizações de pedido

Usado para badge/notificações.

### Ofertas

Afeta notificações promocionais locais.

Não há teste dedicado do toggle de ofertas.

### GPS

Controla solicitação/uso de localização no fluxo do cliente.

### WhatsApp

Consentimento é mostrado no checkout e enviado ao `confirmOrder()`.

Não há teste dedicado verificando o valor dentro de `UnifiedOrder`.

## Regras para novos controles

### Botão indisponível

Usar:

```tsx
disabled={condicao}
```

Não:

```tsx
onClick={() => undefined}
```

### Formulário com Salvar

Obrigatório:

- estado draft;
- Salvar copia draft para persistido;
- Cancelar/Descartar restaura persistido.

### Upload

Só considerar “upload concluído” em produção quando o backend devolver referência válida.

Selecionar arquivo local não significa aprovação.

## Gaps de teste da auditoria

Ainda adicionar:

1. todos os métodos indisponíveis do checkout;
2. ofertas toggle;
3. WhatsApp dentro do pedido;
4. arquivo Data URL persistido após reload;
5. limite >1,5 MB;
6. erro de upload;
7. substituição de documento;
8. reembolso/carteira completo.

## Critério

Um controle só é “funcional” quando:

- ação executa;
- estado resultante é visível;
- persistência é a esperada;
- outra tela dependente recebe a alteração;
- teste existe para ação crítica.
