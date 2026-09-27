import type { LegalAcceptance, LegalTerm } from "./legalTerms";

export const customerTermsOfUse: LegalTerm = {
  id: "customer-terms-of-use",
  version: "2026-09-27.1",
  role: "customer",
  title: "Termos de Uso do Cliente Feiraê",
  summary:
    "Regras para conta, compras, ofertas, pagamentos, entregas, avaliações, segurança e uso responsável.",
  sections: [
    {
      title: "1. Conta e veracidade",
      paragraphs: [
        "O Cliente deve fornecer informações verdadeiras e manter seus dados atualizados. A conta é pessoal e não pode ser usada para fraude, falsa identidade, manipulação de pedidos, avaliações ou promoções.",
        "O Cliente deve proteger sua senha e comunicar uso não autorizado assim que perceber o problema.",
      ],
    },
    {
      title: "2. Como o Feiraê funciona",
      paragraphs: [
        "O Feiraê organiza a experiência digital entre clientes, feirantes e entregadores, incluindo catálogo, carrinho, pedidos, retirada, entrega, pagamentos quando habilitados, suporte, avaliações e notificações.",
        "A responsabilidade jurídica de cada participante depende do papel efetivamente exercido e da legislação aplicável. Estes Termos não eliminam direitos do consumidor nem afastam responsabilidade que a lei atribua ao Feiraê, ao feirante, ao entregador ou a outro fornecedor.",
      ],
    },
    {
      title: "3. Oferta, preço e informação",
      bullets: [
        "Antes da compra, devem estar disponíveis as informações essenciais conhecidas sobre produto, preço, unidade, peso ou quantidade, taxas, entrega ou retirada, pagamento e restrições da oferta.",
        "O valor total e as despesas adicionais devem ser apresentados antes da confirmação quando calculáveis.",
        "Promoções e descontos seguem as condições apresentadas na própria oferta e não reduzem direitos assegurados por lei.",
      ],
      paragraphs: [
        "O Código de Defesa do Consumidor assegura acesso prévio e compreensível ao conteúdo contratual e veda cláusulas abusivas que retirem direitos protegidos.",
      ],
    },
    {
      title: "4. Pedido, pagamento, retirada e entrega",
      bullets: [
        "O Cliente deve conferir feira, banca, itens, quantidades, endereço, forma de atendimento, pagamento, taxas e total antes de confirmar.",
        "Endereço, referência, telefone e instruções de entrega devem ser verdadeiros e suficientes para a execução do pedido.",
        "Pagamento, estorno e reembolso seguem a forma escolhida, o provedor utilizado quando houver e os direitos previstos na legislação.",
      ],
    },
    {
      title: "5. Cancelamento, arrependimento e suporte",
      paragraphs: [
        "O Feiraê deve oferecer canais adequados para informação, correção, cancelamento, suporte e exercício dos direitos do consumidor.",
        "O direito de arrependimento e outras garantias legais serão aplicados quando cabíveis conforme a legislação e a contratação. Estes Termos não criam renúncia antecipada a direitos do consumidor.",
      ],
    },
    {
      title: "6. Peso, substituição e divergências",
      bullets: [
        "Produtos vendidos por peso podem ter diferença entre estimativa e peso real quando isso for informado de modo claro.",
        "Substituição de item deve respeitar a preferência ou autorização do Cliente quando exigida pelo fluxo.",
        "Item faltante, divergente, avariado, impróprio ou entregue em desacordo deve poder ser reportado pelo suporte.",
      ],
    },
    {
      title: "7. Conduta e avaliações",
      bullets: [
        "Avaliações devem refletir experiência real e não podem ser compradas, trocadas ou manipuladas.",
        "São proibidos assédio, ameaça, discriminação, fraude, extorsão, falsa denúncia e tentativa de obter vantagem indevida.",
        "Cliente, feirante, entregador e suporte devem ser tratados com respeito.",
      ],
    },
    {
      title: "8. Segurança e prevenção de fraude",
      paragraphs: [
        "O Feiraê pode aplicar controles proporcionais de segurança, prevenção de fraude e proteção da conta, preservando direitos legais e oferecendo contestação quando cabível.",
      ],
    },
    {
      title: "9. Alterações e versão aceita",
      paragraphs: [
        "Mudança material destes Termos gera nova versão. Quando a alteração exigir nova manifestação do Cliente, o Feiraê deve solicitar novo aceite de forma destacada.",
        "Em produção, versão, data/hora e evidência técnica do aceite devem ser preservadas para auditoria e defesa de direitos.",
      ],
    },
  ],
  declarations: ["Li e aceito os Termos de Uso do Cliente Feiraê."],
  references: [
    {
      label: "Lei nº 8.078/1990 — Código de Defesa do Consumidor",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    },
    {
      label: "Decreto nº 7.962/2013 — contratação no comércio eletrônico",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm",
    },
    {
      label: "Lei nº 12.965/2014 — Marco Civil da Internet",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm",
    },
  ],
};

export const customerPrivacyNotice: LegalTerm = {
  id: "customer-privacy-notice",
  version: "2026-09-27.1",
  role: "customer",
  title: "Aviso de Privacidade do Cliente Feiraê",
  summary:
    "Como dados da conta, endereços, localização, pedidos, pagamentos, suporte e preferências são tratados.",
  sections: [
    {
      title: "1. Dados tratados",
      bullets: [
        "Conta e contato: nome, e-mail, telefone, CPF e data de nascimento quando necessários ao fluxo.",
        "Endereço e localização: endereços cadastrados, coordenadas e localização solicitada pelo usuário.",
        "Compra: feira, banca, itens, valores, promoções, pagamento, pedidos, cancelamentos, suporte e avaliações.",
        "Segurança: identificadores de conta, autenticação, dispositivo e eventos antifraude quando implementados.",
        "Preferências: notificações, ofertas, GPS, WhatsApp e configurações escolhidas pelo Cliente.",
      ],
    },
    {
      title: "2. Finalidades e bases legais",
      bullets: [
        "Execução do contrato e procedimentos preliminares: criar conta, montar pedido, entregar, retirar, pagar e prestar suporte — LGPD art. 7º, V.",
        "Cumprimento de obrigação legal ou regulatória — art. 7º, II.",
        "Exercício regular de direitos — art. 7º, VI.",
        "Legítimo interesse para segurança, prevenção de fraude e melhoria operacional, quando houver necessidade, balanceamento e salvaguardas — art. 7º, IX.",
        "Consentimento somente para finalidades em que ele seja a base adequada, de forma específica, destacada e revogável.",
      ],
      paragraphs: [
        "A ciência deste Aviso não transforma todo tratamento em consentimento. A LGPD prevê diferentes bases legais e não admite autorizações genéricas de consentimento.",
      ],
    },
    {
      title: "3. Compartilhamentos",
      bullets: [
        "Feirantes recebem apenas os dados necessários para preparar e resolver o pedido.",
        "Entregadores recebem os dados necessários para coleta, rota, contato operacional e entrega.",
        "Prestadores de pagamento, hospedagem, autenticação, comunicação, antifraude e suporte podem tratar dados conforme a função contratada e a legislação.",
        "Dados podem ser fornecidos a autoridades quando houver obrigação legal, ordem válida ou exercício regular de direitos.",
      ],
    },
    {
      title: "4. Localização e pagamentos",
      paragraphs: [
        "A localização deve ser solicitada somente quando necessária à experiência escolhida, como proximidade, rota ou entrega, e limitada à finalidade, precisão e período necessários.",
        "Em produção, dados completos de cartão devem ser tratados por provedor adequado e tokenizados quando possível, reduzindo ao mínimo o dado financeiro armazenado pelo Feiraê.",
      ],
    },
    {
      title: "5. Ofertas, marketing e WhatsApp",
      paragraphs: [
        "Comunicação operacional de pedido, segurança ou suporte é diferente de marketing. Ofertas, novidades e WhatsApp comercial devem ter preferência própria quando dependerem de escolha do Cliente.",
        "Opções promocionais não devem vir pré-marcadas e a recusa não pode impedir o uso das funções essenciais.",
      ],
    },
    {
      title: "6. Retenção, segurança e direitos",
      paragraphs: [
        "Dados devem ser mantidos pelo período necessário à finalidade, obrigação legal, prevenção de fraude ou exercício de direitos e depois eliminados ou anonimizados quando cabível.",
      ],
      bullets: [
        "Confirmação e acesso aos dados.",
        "Correção de dados incompletos ou inexatos.",
        "Informação sobre compartilhamentos.",
        "Anonimização, bloqueio ou eliminação quando cabíveis.",
        "Revogação de consentimento e oposição nas hipóteses legais.",
      ],
    },
    {
      title: "7. Atualizações",
      paragraphs: [
        "Mudança material gera nova versão. Quando a base legal exigir consentimento, uma nova manifestação deverá ser solicitada.",
      ],
    },
  ],
  declarations: [
    "Li o Aviso de Privacidade do Cliente Feiraê e estou ciente das finalidades, bases legais, compartilhamentos e direitos descritos.",
    "Entendi que a ciência deste aviso não equivale a consentimento genérico para todas as formas de tratamento.",
  ],
  references: [
    {
      label: "Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm",
    },
    {
      label: "ANPD — perguntas frequentes sobre bases legais",
      url: "https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes",
    },
  ],
};

export const customerRequiredTerms = [customerTermsOfUse, customerPrivacyNotice];

function fingerprint(term: LegalTerm) {
  const text = JSON.stringify(term);
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function customerLegalStorageKey(email: string) {
  return `feirae:customer-legal-acceptances:${email.trim().toLocaleLowerCase("pt-BR")}`;
}

export function saveCustomerLegalAcceptances(name: string, email: string) {
  if (typeof window === "undefined") return;
  const signedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date());

  const acceptances: LegalAcceptance[] = customerRequiredTerms.map((term) => ({
    termId: term.id,
    version: term.version,
    role: "customer",
    signerName: name,
    signerEmail: email,
    signedAt,
    fingerprint: fingerprint(term),
    method: "checkbox",
  }));

  window.localStorage.setItem(customerLegalStorageKey(email), JSON.stringify(acceptances));
}
