# Cadastro, documentos e aprovação — Feiraê

Atualizado em 26/09/2026 com as regras que o código realmente aplica.

## 1. Conta x aprovação

Criar conta não significa estar aprovado.

No protótipo, aprovação é calculada a partir dos documentos locais.

Não existe KYC externo nem revisor admin real.

## 2. Feirante — documentos atuais do seed

`initialVendorDocuments`:

### Obrigatórios

1. `identity`
   - Documento oficial com foto.
2. `address`
   - Comprovante de residência.
3. `permit`
   - Permissão/autorização da banca ou box.

### Opcional no seed

4. `sanitary`
   - Licença/registro sanitário.

O código considera o feirante **Aprovado** quando todos os documentos com `required = true` estão `approved`.

### Regra de seed para contas reais

Somente contas explícitas de demonstração (`@feirae.test`) podem iniciar com documentos seed aprovados. Qualquer conta real/local sem documentação persistida inicia os documentos obrigatórios como `pending`.

A ausência da chave local de documentos nunca pode transformar falta de documentação em aprovação implícita.

## 3. Efeito da aprovação do feirante

`effectiveStoreOpen` exige:

```
approvalStatus === "Aprovado"
AND storeOpen
AND currentScheduleStatus.open
```

`syncVendorMarketplace()` recebe:

```
approved: approvalStatus === "Aprovado"
```

Produto publicado no catálogo dinâmico só fica ativo quando:

```
input.approved
AND product.active
AND product.stock > 0
```

Existe teste que verifica que banca não aprovada não aparece com produtos ativos.

## 4. Upload do feirante

Ao selecionar arquivo:

- `readFileForLocalStorage()`;
- limite 1,5 MB;
- arquivo vira Data URL;
- status muda para `under_review`.

Upload não aprova documento.

## 5. Entregador — documentos atuais

Lista:

- `identity`;
- `address`;
- `cnh`;
- `crlv`;
- `motofrete`.

## 6. Regra dinâmica do entregador

### Sempre obrigatórios

```
identity
address
```

### Se existe veículo motorizado ativo

```
cnh
crlv
```

### Se existe Moto ou Moto com baú ativa

```
motofrete
```

Código:

`requiredDocumentIds` em `DeliveryScreens.tsx`.

## 7. Aprovação do entregador

Aprovado quando todo ID em `requiredDocumentIds` possui status `approved`.

Se algum obrigatório:

- `correction_required` → Correção necessária;
- `under_review` → Em análise;
- caso contrário → Documentação pendente.

## 8. Efeito operacional

```
availableNow =
online
AND scheduleAllowsNow
AND approvalStatus === "Aprovado"
```

Sem aprovação, botão de aceitar corrida fica desabilitado por `availableNow = false`.

## 9. Documento do veículo

Para tipos que `requiresPlate()` considera motorizados:

- placa precisa validar;
- documento do veículo precisa estar `approved`.

Atenção: `Outro` atualmente é isento de placa pelo código. Isso deve ser corrigido por configuração de tipo de veículo antes de produção.

## 10. O que NÃO é validado hoje

O código não verifica automaticamente:

- idade mínima;
- CPF em base oficial;
- autenticidade de RG/CNH;
- CNH vencida;
- tempo de CNH;
- EAR;
- curso de motofrete em base oficial;
- CRLV no Detran;
- antecedentes/certidões;
- selfie/biometria;
- titularidade do veículo.

O documento regulatório pode exigir itens, mas o protótipo hoje só gerencia upload/status.

## 11. Status de documento no frontend

Feirante/veículo:

```
pending
under_review
approved
correction_required
```

SQL `onboarding_documents` também permite:

```
rejected
```

O frontend ainda precisa representar rejeição completa.

## 12. Vencimento

Campos de UI/modelo possuem `expiresAt`, mas não há rotina server-side que:

- verifica vencimento diário;
- muda status;
- suspende automaticamente.

Isso é pendente.

## 13. Requisitos regulatórios de motofrete

A documentação de produto deve manter requisitos de motofrete como **regra regulatória a validar**, não como funcionalidade já executada.

Antes de habilitar moto em produção:

- validar requisitos vigentes no Detran-DF/legislação;
- modelar campos;
- verificar documentos;
- criar revalidação.

## 14. Feirante PF/PJ

A tela já coleta vários dados de conta, mas `vendor_profiles` SQL possui hoje apenas:

- id;
- business_name;
- description;
- approved;
- created_at.

Faltam no schema dados usados pela UI, como:

- CPF/CNPJ;
- data nascimento;
- telefone;
- dados bancários;
- responsável;
- tipo PF/PJ.

## 15. Revisão administrativa

Ainda não existe painel/admin real.

A migration `onboarding_documents` possui:

- `reviewed_by`;
- `reviewed_at`;

mas não há policy administrativa completa nas migrations atuais.

## 16. Produção

Para sair do protótipo:

1. Storage privado;
2. validação real de arquivo;
3. Auth;
4. admin/revisor;
5. policies;
6. KYC/verificações escolhidas;
7. vencimento/revalidação;
8. suspensão auditável.

Fontes oficiais existentes no documento devem ser revalidadas no momento da implementação regulatória.

## 17. Fontes oficiais de referência

As regras abaixo são referência regulatória e precisam ser revalidadas quando o backend de aprovação for implementado.

- Lei nº 6.956/2021 — feiras públicas do DF:
  https://www.sinj.df.gov.br/sinj/Norma/410afc4ea07d467a89a433d0fda0e5a1/Lei_6956_2021
- Detran-DF — vistoria/autorização de motofrete:
  https://sisman.maestro.detran.df.gov.br/visualizar-carta/pdf/?area=28&layout=true
- DNIT — requisitos de motofrete/mototáxi:
  https://www.gov.br/dnit/pt-br/assuntos/noticias/motofretista-e-mototaxista-o-que-diz-a-lei

O código atual não consulta automaticamente nenhuma dessas fontes.
