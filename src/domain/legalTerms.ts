export type LegalPartyRole = "customer" | "feirante" | "delivery" | "all";

export type LegalReference = {
  label: string;
  url: string;
};

export type LegalTermSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalTerm = {
  id: string;
  version: string;
  role: LegalPartyRole;
  title: string;
  summary: string;
  sections: LegalTermSection[];
  declarations: string[];
  references: LegalReference[];
};

export type LegalAcceptance = {
  termId: string;
  version: string;
  role: Exclude<LegalPartyRole, "all">;
  signerName: string;
  signerEmail: string;
  signedAt: string;
  fingerprint: string;
  method: "typed-name" | "checkbox" | "seed-demo";
};

const commonReferences: LegalReference[] = [
  {
    label: "Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm",
  },
  {
    label: "Lei nº 12.965/2014 — Marco Civil da Internet",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm",
  },
  {
    label: "MP nº 2.200-2/2001 — documentos e assinaturas eletrônicas",
    url: "https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm",
  },
  {
    label: "ANPD — direitos do titular de dados",
    url: "https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados",
  },
  {
    label: "Resolução CD/ANPD nº 15/2024 — comunicação de incidentes de segurança",
    url: "https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis",
  },
  {
    label: "Resolução CD/ANPD nº 19/2024 — transferência internacional de dados",
    url: "https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024",
  },
];

export const vendorPartnerTerm: LegalTerm = {
  id: "vendor-partner-terms",
  version: "2026-09-26.1",
  role: "feirante",
  title: "Termo de Adesão, Conduta e Responsabilidade do Feirante",
  summary:
    "Regras obrigatórias de veracidade, responsabilidade sobre produtos, defesa do consumidor, segurança sanitária, ética, dados, repasses e uso da plataforma.",
  sections: [
    {
      title: "1. Objeto e papel do Feiraê",
      paragraphs: [
        "Este termo disciplina a participação do Feirante no Feiraê, plataforma digital destinada à exposição de bancas, oferta de produtos, formação e acompanhamento de pedidos, pagamentos quando habilitados, retirada, integração com entrega, avaliações, suporte e demais recursos operacionais.",
        "O Feiraê organiza a infraestrutura tecnológica e as regras de uso da plataforma. O Feirante continua responsável pela sua atividade econômica, pelos produtos que anuncia e comercializa, pelos documentos e licenças da banca e pelo cumprimento das obrigações legais que incidam sobre a sua operação.",
        "Nenhuma cláusula deste termo exclui direitos do consumidor, deveres sanitários, deveres de proteção de dados ou outras responsabilidades que a lei considere indisponíveis.",
      ],
    },
    {
      title: "2. Verdade, identidade e documentos",
      bullets: [
        "O Feirante deve fornecer nome, CPF ou CNPJ quando aplicável, contato, dados da banca, autorizações, dados bancários, licenças e demais documentos verdadeiros, atuais, legíveis e pertencentes ao titular ou ao estabelecimento informado.",
        "É proibido utilizar documento falso, adulterado, vencido quando a validade for requisito, documento de terceiro sem autorização, conta bancária de origem incompatível, identidade fictícia ou informação destinada a burlar análise, limite, suspensão ou bloqueio.",
        "Qualquer alteração relevante em responsável, CNPJ, banca, endereço, licença, autorização, dados bancários ou condição sanitária deve ser atualizada sem demora.",
        "O Feirante autoriza a verificação de consistência dos dados e documentos para prevenção de fraude, segurança, cumprimento contratual e obrigação legal, respeitada a LGPD.",
      ],
      paragraphs: [
        "Informação falsa, omissão deliberada ou documento adulterado pode justificar bloqueio preventivo, suspensão, encerramento da conta, retenção cautelar de valores apenas quando juridicamente justificável e comunicação às autoridades competentes quando houver dever legal ou indício relevante de ilícito.",
      ],
    },
    {
      title: "3. Natureza independente da atividade",
      paragraphs: [
        "O Feirante atua em nome próprio e com autonomia empresarial ou profissional sobre sua banca, seus produtos, formação de preços, estoque, horários de funcionamento e organização interna, observadas as regras da feira, a legislação e as regras indispensáveis de segurança e integridade da plataforma.",
        "A adesão ao Feiraê, por si só, não cria sociedade, franquia, representação exclusiva, mandato geral ou vínculo de emprego. A realidade concreta da relação prevalece sobre a denominação contratual, e nenhuma cláusula pretende afastar norma trabalhista imperativa quando os requisitos legais de uma relação de emprego estiverem efetivamente presentes.",
        "Não há exclusividade: o Feirante pode utilizar outros canais de venda e plataformas, salvo restrições específicas decorrentes de direitos de terceiros ou obrigações assumidas em campanha determinada e claramente identificada.",
      ],
    },
    {
      title: "4. Produtos, ofertas e dever de informação ao consumidor",
      bullets: [
        "Preço, unidade de venda, peso ou quantidade, descrição, fotos, origem quando relevante, disponibilidade, prazo, condições de retirada/entrega, restrições e características essenciais devem corresponder ao produto realmente ofertado.",
        "É proibido preço fictício, estoque inexistente deliberadamente, fotografia enganosa, alegação de qualidade ou origem sem comprovação, falsa promoção, desconto artificial, avaliação manipulada ou descrição capaz de induzir o consumidor a erro.",
        "A oferta publicada vincula o fornecedor nos limites previstos na legislação de consumo; indisponibilidade, substituição, cancelamento ou divergência devem ser tratados de forma transparente e registrável.",
        "O Feirante deve colaborar com atendimento, cancelamento, reembolso, arrependimento e solução de vícios ou divergências quando aplicáveis, sem criar barreiras incompatíveis com o Código de Defesa do Consumidor.",
      ],
      paragraphs: [
        "Aplicam-se, entre outras normas, a Lei nº 8.078/1990 e o Decreto nº 7.962/2013, especialmente quanto a informação clara, cumprimento da oferta, atendimento facilitado e direitos do consumidor em contratação eletrônica.",
      ],
    },
    {
      title: "5. Estoque, separação, peso, substituição e preparo",
      bullets: [
        "O estoque informado deve refletir quantidade razoavelmente disponível para venda.",
        "Itens vendidos por peso devem ter o peso real informado quando o fluxo exigir conferência; manipulação proposital de peso ou quantidade para alterar cobrança é falta grave.",
        "Substituição de produto deve respeitar a autorização do cliente ou a regra expressamente aceita no pedido; não é permitido substituir silenciosamente por item inferior ou diferente.",
        "O pedido deve ser separado, embalado e identificado de forma a reduzir troca, perda, vazamento, contaminação e dano durante retirada ou transporte.",
      ],
    },
    {
      title: "6. Alimentos, higiene, conservação e segurança sanitária",
      bullets: [
        "Quando comercializar alimento preparado ou manipulado abrangido pela regulamentação sanitária, o Feirante deve observar boas práticas de manipulação, preparação, fracionamento, armazenamento, transporte, exposição à venda e entrega.",
        "Temperatura, refrigeração, congelamento, validade, higiene, proteção contra contaminação, integridade da embalagem e cadeia de conservação devem ser mantidas conforme o produto e a norma aplicável.",
        "Quando aplicável ao estabelecimento, devem existir Manual de Boas Práticas e Procedimentos Operacionais Padronizados exigidos pela RDC Anvisa nº 216/2004, além das exigências locais.",
        "Alimentos embalados devem observar as regras de rotulagem aplicáveis, inclusive RDC Anvisa nº 727/2022 e, quando pertinente, RDC nº 429/2020 e IN nº 75/2020 sobre rotulagem nutricional.",
        "Alergênicos, lactose, conservação, validade, ingredientes e demais advertências obrigatórias não podem ser omitidos quando legalmente exigidos.",
        "O Feirante deve possuir licença, registro ou autorização sanitária quando a atividade, produto ou autoridade local exigir.",
      ],
      paragraphs: [
        "O Feiraê pode suspender preventivamente produto ou banca diante de risco plausível à saúde até que haja esclarecimento, correção ou comprovação documental. A medida preventiva não substitui atuação da vigilância sanitária.",
      ],
    },
    {
      title: "7. Origem lícita e produtos proibidos ou restritos",
      bullets: [
        "Somente podem ser ofertados produtos de origem lícita e cuja comercialização seja permitida.",
        "É proibida a venda de produto falsificado, adulterado, furtado, contrabandeado, com origem sabidamente ilícita, impróprio para consumo ou cuja venda exija autorização que o Feirante não possua.",
        "Produtos sujeitos a regime especial, idade mínima, receita, autorização sanitária, controle ambiental ou outra restrição somente poderão ser aceitos se o Feiraê tiver fluxo específico e juridicamente habilitado para essa categoria.",
      ],
    },
    {
      title: "8. Tributos, registros e regularidade da atividade",
      paragraphs: [
        "O Feirante é responsável por verificar seu enquadramento fiscal, emissão de documento fiscal quando exigida, recolhimento de tributos, inscrições, licenças, autorizações e obrigações próprias da sua atividade.",
        "O Feiraê poderá fornecer relatórios operacionais, mas não substitui contador, autoridade fiscal ou orientação profissional individual.",
      ],
    },
    {
      title: "9. Taxas, repasses, estornos e conciliação",
      bullets: [
        "Taxas, comissão, frete absorvido, subsídios, prazo de repasse, descontos e demais valores devem ser mostrados antes da incidência ou definidos em política/campanha identificável.",
        "O Feirante deve conferir o extrato e comunicar divergência pelos canais do Feiraê dentro do prazo operacional informado, sem perda de direitos legais.",
        "Estorno, chargeback, cancelamento, fraude comprovada ou decisão de autoridade pode gerar ajuste de repasse conforme a origem da responsabilidade e as regras legais aplicáveis.",
        "É proibido manipular pedidos, criar compras fictícias, combinar transações falsas, simular entrega ou usar contas relacionadas para obter bônus, promoções ou repasses indevidos.",
      ],
    },
    {
      title: "10. Ética, respeito e integridade",
      bullets: [
        "Tratar clientes, entregadores, outros feirantes, equipe da feira e suporte com respeito.",
        "É proibida discriminação por raça, cor, origem, nacionalidade, sexo, gênero, orientação sexual, deficiência, idade, religião ou qualquer outro fator protegido pela legislação.",
        "São proibidos assédio, ameaça, perseguição, violência, extorsão, suborno, fraude, retaliação por avaliação legítima e linguagem abusiva grave.",
        "Não se pode comprar, vender, trocar ou manipular avaliações, nem pressionar cliente ou entregador a dar nota específica.",
        "Problemas de segurança, fraude, alimento impróprio, vazamento de dados ou conduta grave devem ser comunicados ao Feiraê com boa-fé e sem fabricação de provas.",
      ],
    },
    {
      title: "11. Dados do cliente e confidencialidade",
      bullets: [
        "Nome, telefone, endereço, observações, localização, detalhes do pedido e demais dados do cliente só podem ser usados para cumprir o pedido, suporte, obrigação legal ou finalidade legitimamente informada.",
        "É proibido copiar lista de clientes para marketing próprio sem base legal, publicar endereço, compartilhar telefone em grupo, fotografar documento do cliente sem necessidade ou usar dados para assédio, cobrança vexatória ou finalidade estranha ao pedido.",
        "Dados recebidos pelo Feiraê devem ser protegidos contra acesso de terceiros e descartados ou anonimizados quando deixarem de ser necessários, observadas obrigações de retenção.",
      ],
    },
    {
      title: "12. Segurança da conta",
      bullets: [
        "Credenciais são pessoais. O Feirante deve proteger senha, códigos de autenticação e dispositivos usados na operação.",
        "Acesso suspeito, perda de dispositivo, troca não autorizada de dados bancários ou possível fraude deve ser comunicado imediatamente.",
        "O responsável não deve emprestar a conta para ocultar identidade de terceiro ou burlar suspensão, mas pode cadastrar colaboradores por mecanismo próprio quando o Feiraê disponibilizar perfis e permissões.",
      ],
    },
    {
      title: "13. Fiscalização da plataforma, evidências e auditoria",
      paragraphs: [
        "Para segurança, prevenção de fraude, defesa de direitos e cumprimento contratual, o Feiraê pode registrar eventos de conta, alterações de cadastro, aceite de pedidos, mudanças de status, comunicações, assinaturas de termos e outras evidências proporcionais à finalidade.",
        "O uso de controles de segurança não autoriza coleta ilimitada. O tratamento deve seguir finalidade, necessidade, transparência e segurança nos termos da LGPD.",
      ],
    },
    {
      title: "14. Medidas de integridade, suspensão e direito de contestação",
      bullets: [
        "Violações podem gerar orientação, advertência, ocultação de produto, bloqueio de funcionalidade, suspensão temporária ou encerramento da conta, considerando gravidade, risco, reincidência e evidências.",
        "Risco à saúde, fraude documental, ameaça, vazamento grave de dados ou perigo imediato pode justificar suspensão preventiva enquanto os fatos são apurados.",
        "Sempre que juridicamente e tecnicamente possível, o Feirante deve receber o motivo da medida e canal para apresentar esclarecimento ou contestação.",
        "Nenhuma medida interna impede comunicação à autoridade competente nem substitui direitos assegurados por lei.",
      ],
    },
    {
      title: "15. Responsabilidade e reparação",
      paragraphs: [
        "Cada parte responde, nos limites da lei, pelos atos, omissões e riscos que lhe sejam juridicamente atribuíveis. O Feirante responde pela veracidade das informações que fornece, regularidade da banca e dos produtos, cumprimento da oferta, acondicionamento, segurança e demais deveres próprios de fornecedor.",
        "O Feiraê responde pelas obrigações que a legislação atribuir à plataforma e não pretende afastar responsabilidade legal por meio deste termo.",
        "Nenhuma cláusula limita responsabilidade por dolo, fraude, violação deliberada de direitos, obrigação legal irrenunciável ou hipótese em que a lei vede exclusão ou limitação de responsabilidade.",
      ],
    },
    {
      title: "16. Conteúdo, imagem e propriedade intelectual",
      bullets: [
        "Fotos, marcas, descrições e materiais publicados devem ser próprios, licenciados ou utilizados com autorização.",
        "Ao publicar conteúdo necessário à oferta, o Feirante concede ao Feiraê licença não exclusiva, limitada à operação e divulgação da oferta dentro dos canais do serviço, enquanto o conteúdo permanecer ativo ou pelo tempo tecnicamente necessário ao histórico.",
        "É proibido usar marca, foto ou conteúdo de terceiro de forma enganosa ou infratora.",
      ],
    },
    {
      title: "17. Alterações, encerramento e continuidade de obrigações",
      paragraphs: [
        "Mudança material deste termo exige nova ciência e, quando necessário, nova assinatura antes de continuar operando. A versão aceita e a data ficam registradas.",
        "O Feirante pode solicitar encerramento da conta, respeitados pedidos em curso, repasses, retenções legais, prevenção de fraude, exercício de direitos e demais obrigações que sobrevivam ao encerramento.",
      ],
    },
    {
      title: "18. Solução de conflitos",
      paragraphs: [
        "As partes devem priorizar o canal de suporte para esclarecimentos e conciliação, sem impedir acesso a órgãos de defesa do consumidor, autoridades administrativas, mediação, arbitragem quando validamente pactuada ou Poder Judiciário.",
        "A competência territorial e o foro observarão a legislação aplicável ao caso concreto; este termo não impõe renúncia a foro legalmente protegido.",
      ],
    },
  ],
  declarations: [
    "Li integralmente o Termo de Adesão, Conduta e Responsabilidade do Feirante e aceito cumprir suas regras.",
    "Declaro que as informações, documentos, produtos, preços, estoque, licenças e autorizações que eu fornecer serão verdadeiros e atualizados.",
    "Reconheço minha responsabilidade por segurança sanitária, origem lícita, qualidade, informação correta e direitos do consumidor relativos à minha atividade.",
    "Estou ciente de que a autonomia descrita neste termo não afasta norma trabalhista imperativa caso a realidade concreta configure relação jurídica diferente.",
  ],
  references: [
    {
      label: "Lei nº 8.078/1990 — Código de Defesa do Consumidor",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    },
    {
      label: "Decreto nº 7.962/2013 — comércio eletrônico",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm",
    },
    {
      label: "Código Civil — Lei nº 10.406/2002",
      url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    },
    {
      label: "CLT — Decreto-Lei nº 5.452/1943",
      url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm",
    },
    {
      label: "RDC Anvisa nº 216/2004 — boas práticas para serviços de alimentação",
      url: "https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2004/res0216_15_09_2004.html",
    },
    {
      label: "Anvisa — RDC nº 727/2022 e consolidação da rotulagem de alimentos embalados",
      url: "https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2022/regulacao-de-alimentos-consolidacao-de-atos-normativos",
    },
    {
      label: "Anvisa — RDC nº 429/2020 e IN nº 75/2020 sobre rotulagem nutricional",
      url: "https://www.gov.br/anvisa/pt-br/assuntos/alimentos/rotulagem/rotulagem-nutricional",
    },
    {
      label: "Lei nº 6.437/1977 — infrações à legislação sanitária federal",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l6437compilado.htm",
    },
    ...commonReferences,
  ],
};

export const deliveryPartnerTerm: LegalTerm = {
  id: "delivery-partner-terms",
  version: "2026-09-26.1",
  role: "delivery",
  title: "Termo de Adesão, Segurança e Conduta do Entregador Parceiro",
  summary:
    "Regras de autonomia, ausência de exclusividade, aceite de corridas, segurança viária, veículo, moto-frete, ética, geolocalização, dados e responsabilidade.",
  sections: [
    {
      title: "1. Objeto e funcionamento da parceria",
      paragraphs: [
        "Este termo disciplina o uso do Feiraê pelo Entregador Parceiro para visualizar ofertas de entrega compatíveis, consultar distância e condições da corrida, aceitar ou recusar ofertas, realizar coleta, acompanhar rota, informar etapas e concluir entregas.",
        "O Feiraê fornece tecnologia de intermediação e organização do fluxo. O Entregador realiza a atividade por conta própria, com veículo e meios compatíveis, observando a legislação, a segurança e as condições apresentadas antes do aceite.",
      ],
    },
    {
      title: "2. Verdade, identidade e habilitação",
      bullets: [
        "Nome, CPF, idade, contato, CNH quando aplicável, categoria, veículo, placa, CRLV-e, cursos, autorizações, dados bancários e demais documentos devem ser verdadeiros, atuais e pertencentes ao titular ou regularmente disponibilizados a ele.",
        "É proibido documento falso, adulterado, de terceiro sem autorização, conta emprestada, identidade fictícia, placa falsa, localização simulada ou qualquer informação criada para burlar bloqueio, limite, verificação ou regra de segurança.",
        "Mudança de veículo, suspensão da CNH, vencimento, perda de autorização, sinistro relevante ou outra condição que impeça legalmente a atividade deve ser informada e pode exigir nova validação.",
      ],
    },
    {
      title: "3. Autonomia, ausência de exclusividade e natureza da relação",
      paragraphs: [
        "O Entregador decide se ficará online ou offline, pode definir sua disponibilidade dentro das funcionalidades oferecidas, pode aceitar ou recusar uma corrida antes do aceite e não é obrigado a cumprir quantidade mínima de corridas.",
        "Não há exclusividade. O Entregador pode prestar serviços por conta própria ou por outras plataformas, respeitando apenas entregas que já tenha voluntariamente aceitado e obrigações legais incompatíveis com execução simultânea insegura.",
        "A relação pretendida é civil e autônoma. Não há salário fixo, jornada mínima imposta, exclusividade ou promessa de benefícios trabalhistas pelo simples cadastro na plataforma.",
        "A denominação contratual não prevalece sobre os fatos: se a realidade concreta preencher requisitos legais de relação de emprego, norma trabalhista imperativa não pode ser afastada por uma cláusula de 'não vínculo'.",
      ],
    },
    {
      title: "4. Oferta e aceite da corrida",
      bullets: [
        "Antes do aceite, o Feiraê deve procurar mostrar informações operacionais relevantes disponíveis, como feira/banca, destino ou região, distância estimada, peso/capacidade necessária e valor da corrida.",
        "O Entregador pode recusar oferta antes do aceite sem obrigação de justificar, ressalvadas medidas antiabuso que não convertam a recusa legítima em punição automática incompatível com a autonomia declarada.",
        "Após aceitar, o Entregador assume compromisso de boa-fé de executar a corrida ou utilizar o fluxo de cancelamento/suporte quando houver impossibilidade, risco, emergência ou motivo legítimo.",
        "Aceitar corrida sem intenção de realizá-la, combinar fraude, simular entrega ou capturar oferta apenas para impedir outro entregador constitui abuso.",
      ],
    },
    {
      title: "5. Execução, coleta e entrega",
      bullets: [
        "Conferir identificação do pedido e coletar somente itens correspondentes à corrida aceita.",
        "Preservar embalagem, lacre, integridade, temperatura e posição do produto de acordo com sua natureza.",
        "Não abrir, consumir, substituir, retirar ou adicionar item ao pedido sem fluxo autorizado.",
        "Atualizar etapas com verdade: coleta, início da entrega, aproximação e entrega não podem ser marcadas antes do fato correspondente.",
        "Entrega deve ocorrer ao destinatário ou conforme instrução legítima do pedido; divergência de endereço, ausência ou risco deve ser tratada pelo suporte e registrada.",
      ],
    },
    {
      title: "6. Segurança viária e proibição de incentivo a conduta perigosa",
      paragraphs: [
        "A prioridade é segurança. Nenhum tempo estimado, bônus, avaliação, meta ou comunicação do Feiraê autoriza excesso de velocidade, avanço de sinal, direção perigosa, uso inadequado de celular, transporte acima da capacidade ou violação do Código de Trânsito Brasileiro.",
        "O Entregador deve interromper, atrasar ou cancelar a corrida quando a continuidade representar risco concreto relevante, utilizando o canal de suporte assim que for seguro fazê-lo.",
      ],
      bullets: [
        "Usar veículo em condições seguras e compatível com peso/volume.",
        "Cumprir habilitação, licenciamento, equipamentos obrigatórios e regras locais.",
        "Não conduzir sob efeito de álcool, drogas ou substâncias que comprometam a capacidade.",
        "Não dirigir utilizando o celular de forma proibida; orientação de rota deve respeitar as regras de trânsito.",
      ],
    },
    {
      title: "7. Regras específicas para moto-frete",
      paragraphs: [
        "Quando a entrega remunerada for realizada com motocicleta ou motoneta, aplicam-se as exigências legais específicas de moto-frete vigentes no local da operação.",
        "A Lei nº 12.009/2009, em seu texto vigente consultado em 26/09/2026, exige para a atividade abrangida requisitos como idade mínima de 21 anos, habilitação por pelo menos dois anos na categoria, curso especializado nos termos da regulamentação do Contran e colete de segurança com dispositivos retrorrefletivos.",
      ],
      bullets: [
        "A motocicleta/motoneta de moto-frete deve atender às exigências do art. 139-A do CTB introduzidas pela Lei nº 12.009/2009, incluindo autorização do órgão de trânsito competente, categoria de aluguel e equipamentos obrigatórios previstos em lei/regulamentação.",
        "O transporte de carga deve respeitar capacidade, acondicionamento e restrições legais.",
        "Normas estaduais e municipais adicionais continuam aplicáveis.",
        "A Resolução Contran nº 1.020/2025 disciplina atualmente procedimentos de habilitação e cursos especializados; o Entregador deve manter a especialização exigível registrada conforme as regras de trânsito vigentes.",
      ],
    },
    {
      title: "8. Veículos, capacidade e documentos",
      bullets: [
        "Somente veículo ativo, regular e com capacidade suficiente pode ser usado na corrida.",
        "Placa, categoria, capacidade e documento do veículo não podem ser alterados ou falsificados para receber ofertas incompatíveis.",
        "Se um documento obrigatório vencer, for suspenso ou perder validade, o veículo pode ser impedido de receber corridas até regularização.",
        "O Entregador é responsável por combustível, manutenção, equipamentos e demais custos próprios, salvo campanha ou benefício claramente informado pelo Feiraê.",
      ],
    },
    {
      title: "9. Transporte de alimentos e mercadorias",
      bullets: [
        "Pedidos de alimentos devem ser transportados de modo a reduzir contaminação, vazamento, violação, contato com substâncias impróprias e perda de temperatura quando aplicável.",
        "Não transportar junto com o pedido substância, animal, resíduo ou objeto que gere risco incompatível.",
        "Embalagem danificada, vazamento, indício de contaminação ou produto em condição insegura deve ser reportado antes da entrega sempre que possível.",
      ],
    },
    {
      title: "10. Conduta com clientes, feirantes e suporte",
      bullets: [
        "Manter comunicação respeitosa e limitada ao necessário para a entrega.",
        "São proibidos assédio, ameaça, intimidação, discriminação, violência, extorsão, cobrança fora do fluxo autorizado e contato persistente após encerrada a necessidade operacional.",
        "Não exigir gorjeta, avaliação positiva ou pagamento extra não apresentado no pedido.",
        "Não fotografar interior da residência, documento, pessoa ou propriedade do cliente sem necessidade legítima e autorização compatível.",
      ],
    },
    {
      title: "11. Fraude, manipulação e integridade operacional",
      bullets: [
        "É proibido GPS falso, spoofing, conta compartilhada para ocultar o condutor real, pedido fictício, conluio, simulação de coleta/entrega, manipulação de distância, fraude de bônus ou criação artificial de avaliações.",
        "É proibido tentar obter pagamento duplicado, apropriar-se de mercadoria, alterar troco ou induzir cliente/feirante a pagar por fora quando o fluxo não autoriza.",
        "Incidentes reais devem ser descritos com verdade; fabricar acidente, ameaça, atraso ou defeito para obter vantagem constitui falta grave.",
      ],
    },
    {
      title: "12. Valor da corrida, ganhos, despesas e tributos",
      paragraphs: [
        "O valor ou critério disponível da corrida deve ser informado antes do aceite sempre que tecnicamente calculável. Ajuste posterior deve ter fundamento identificável, como cancelamento, alteração legítima da rota, fraude ou regra previamente apresentada.",
        "O Entregador é responsável por verificar sua situação fiscal, previdenciária e cadastral como trabalhador autônomo ou outra forma jurídica aplicável. O Feiraê não presta consultoria tributária individual.",
      ],
    },
    {
      title: "13. Acidentes, emergência e seguro",
      bullets: [
        "Em acidente ou emergência, a prioridade é proteger a vida e acionar serviços públicos de emergência quando necessário.",
        "O Entregador deve informar o Feiraê assim que for seguro, preservar dados essenciais do evento e seguir o procedimento de suporte.",
        "Este termo não promete cobertura securitária inexistente. Qualquer seguro, benefício ou assistência somente existe se estiver expressamente contratado e identificado nas condições vigentes.",
      ],
    },
    {
      title: "14. Cancelamento e suporte",
      paragraphs: [
        "Cancelamentos devem utilizar motivo verdadeiro. Emergência, risco à segurança, acidente, veículo impossibilitado, endereço inviável, cliente ausente conforme procedimento ou outra ocorrência real pode justificar encerramento da corrida.",
        "Reincidência anormal pode ser analisada para fraude ou qualidade, mas a análise deve considerar contexto e não converter automaticamente o direito de recusar ofertas futuras em subordinação.",
      ],
    },
    {
      title: "15. Geolocalização e dados do cliente",
      bullets: [
        "A geolocalização pode ser tratada quando necessária à disponibilidade, oferta compatível, cálculo de rota, segurança, execução da corrida, suporte e prevenção de fraude, observada a LGPD.",
        "O rastreamento deve ser limitado ao necessário. Em produção, o Feiraê deve interromper ou reduzir coleta quando a finalidade operacional terminar, salvo retenção legítima de registros já gerados.",
        "Endereço, telefone, nome e instruções do cliente só podem ser usados para a entrega, suporte, segurança ou obrigação legal.",
        "É proibido guardar endereço para visitas posteriores, marketing próprio, perseguição, divulgação ou qualquer finalidade estranha ao serviço.",
      ],
    },
    {
      title: "16. Controles de segurança não são autorização para subordinação ilícita",
      paragraphs: [
        "Requisitos de identidade, habilitação, segurança, prevenção de fraude, qualidade mínima, proteção do consumidor, confirmação de etapas e cumprimento de lei são condições de uso da plataforma.",
        "Esses controles devem ser proporcionais ao risco e não alteram, por si só, a autonomia declarada. A forma real de operação deve permanecer coerente com o modelo contratual e com a legislação aplicável.",
      ],
    },
    {
      title: "17. Medidas de integridade, suspensão e contestação",
      bullets: [
        "Fraude, documento falso, risco à segurança, violência, apropriação de pedido, vazamento de dados ou conduta grave pode gerar suspensão preventiva imediata.",
        "Outras violações podem gerar orientação, advertência, bloqueio de função, suspensão temporária ou encerramento conforme gravidade e reincidência.",
        "Sempre que possível e juridicamente adequado, o Entregador recebe motivo e canal para contestar, enviar prova e pedir revisão.",
        "Medidas internas não impedem comunicação a autoridade competente nem retiram direitos previstos em lei.",
      ],
    },
    {
      title: "18. Responsabilidade",
      paragraphs: [
        "Cada parte responde pelos atos e omissões que a lei lhe atribuir. O Entregador responde pela condução do veículo, cumprimento das normas de trânsito, veracidade de seus documentos, guarda do pedido enquanto estiver sob sua custódia e condutas pessoais.",
        "O Feiraê responde pelas obrigações legalmente atribuídas à plataforma e não exclui responsabilidade que a lei considere irrenunciável.",
        "Nenhuma cláusula elimina responsabilidade por dolo, fraude, violação deliberada de direitos ou hipótese em que a lei proíba exclusão de responsabilidade.",
      ],
    },
    {
      title: "19. Alteração do termo e encerramento da conta",
      paragraphs: [
        "Mudança material exige nova ciência e, quando necessário, nova assinatura antes da continuidade da operação. A versão aceita fica registrada.",
        "O Entregador pode deixar de utilizar o Feiraê e solicitar encerramento da conta, respeitados corridas já aceitas, valores pendentes, obrigações legais, prevenção de fraude e exercício de direitos.",
      ],
    },
    {
      title: "20. Solução de conflitos",
      paragraphs: [
        "O canal de suporte deve ser usado para tentativa de resolução e produção de histórico, sem impedir acesso a autoridades, mediação ou Poder Judiciário.",
        "Foro e competência seguem a legislação aplicável; este termo não impõe renúncia antecipada a direito ou competência legalmente protegida.",
      ],
    },
  ],
  declarations: [
    "Li integralmente o Termo de Adesão, Segurança e Conduta do Entregador Parceiro e aceito cumprir suas regras.",
    "Declaro que minha identidade, habilitação, veículo, documentos, localização informada e eventos de corrida serão verdadeiros.",
    "Comprometo-me a priorizar segurança viária e reconheço que prazo, bônus ou avaliação nunca autorizam infração de trânsito ou conduta perigosa.",
    "Entendi que posso ficar offline, recusar ofertas antes do aceite e utilizar outras plataformas, e que a cláusula de autonomia não afasta norma trabalhista imperativa se a realidade concreta configurar relação jurídica diferente.",
  ],
  references: [
    {
      label: "CLT — Decreto-Lei nº 5.452/1943, inclusive arts. 2º, 3º e 9º",
      url: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm",
    },
    {
      label: "Código Civil — Lei nº 10.406/2002",
      url: "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    },
    {
      label: "Lei nº 12.009/2009 — motofrete",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12009.htm",
    },
    {
      label: "Resolução Contran nº 1.020/2025 — habilitação e cursos especializados",
      url: "https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao10202025.pdf",
    },
    ...commonReferences,
  ],
};

export const privacyNoticeTerm: LegalTerm = {
  id: "partner-privacy-notice",
  version: "2026-09-26.1",
  role: "all",
  title: "Aviso de Privacidade e Proteção de Dados — Parceiros Feiraê",
  summary:
    "Explica quais dados de Feirantes e Entregadores são tratados, para quais finalidades, bases legais, compartilhamentos, geolocalização, retenção, segurança e direitos.",
  sections: [
    {
      title: "1. Quem controla os dados",
      paragraphs: [
        "Nas operações em que define as finalidades e os meios essenciais do tratamento, o operador jurídico do Feiraê atuará como controlador nos termos da LGPD. A razão social, CNPJ, endereço e contato do encarregado deverão estar identificados na versão de produção antes da coleta real de documentos.",
        "Este protótipo ainda não possui backend de produção; portanto, não deve receber documentação pessoal real até que identidade do controlador, Storage privado, controle de acesso, retenção e canais de direitos estejam configurados.",
      ],
    },
    {
      title: "2. Dados tratados",
      bullets: [
        "Identificação e contato: nome, CPF/CNPJ, data de nascimento, e-mail, telefone e endereço.",
        "Credenciais e segurança: identificadores de conta, eventos de autenticação, registros de aceite, dispositivo e logs de segurança quando implementados.",
        "Feirante: dados da banca, autorizações, licenças, produtos, estoque, pedidos, avaliações, repasses, Pix e dados bancários.",
        "Entregador: CNH, categoria, cursos, veículo, placa, CRLV-e, documentos de moto-frete quando aplicáveis, disponibilidade, região, localização, rotas, corridas, avaliações, ganhos, Pix e dados bancários.",
        "Suporte e integridade: mensagens, protocolos, incidentes, cancelamentos, evidências de fraude e decisões de moderação.",
        "Assinaturas eletrônicas: termo, versão, nome digitado, e-mail, data/hora e impressão digital do conteúdo aceito.",
      ],
    },
    {
      title: "3. Finalidades e bases legais",
      bullets: [
        "Execução do contrato e procedimentos preliminares: criar conta, validar elegibilidade, operar banca/corrida, processar pedidos, pagar repasses e prestar suporte — LGPD art. 7º, V.",
        "Cumprimento de obrigação legal ou regulatória: registros fiscais, trânsito, segurança, ordens de autoridade e outras obrigações aplicáveis — art. 7º, II.",
        "Exercício regular de direitos: guardar evidências necessárias à defesa em processo judicial, administrativo ou arbitral — art. 7º, VI.",
        "Legítimo interesse: prevenção de fraude, segurança da plataforma, integridade de conta, melhoria operacional e proteção de usuários, desde que haja finalidade legítima, necessidade, balanceamento e salvaguardas — art. 7º, IX.",
        "Consentimento: usado apenas quando realmente necessário e separado de finalidades obrigatórias, como determinados canais de marketing; pode ser revogado na forma da LGPD.",
      ],
    },
    {
      title: "4. Dados sensíveis e biometria",
      paragraphs: [
        "O Feiraê não deve transformar consentimento genérico em autorização ampla para dados sensíveis. Se futuramente houver biometria ou outro dado sensível para KYC/fraude, será necessária base legal específica do art. 11 da LGPD, informação clara, minimização, segurança reforçada e revisão do aviso.",
      ],
    },
    {
      title: "5. Geolocalização do Entregador",
      bullets: [
        "Pode ser utilizada para definir área de atuação, compatibilidade da corrida, cálculo de rota/ETA, segurança, suporte, prevenção de fraude e acompanhamento da entrega.",
        "Coleta contínua não deve ocorrer sem necessidade. A versão de produção deve limitar frequência, precisão e duração ao mínimo necessário.",
        "O cliente não deve receber histórico completo de localização; apenas informação necessária ao acompanhamento da entrega.",
      ],
    },
    {
      title: "6. Compartilhamentos",
      bullets: [
        "Cliente recebe apenas dados necessários à execução e segurança da entrega, como identificação operacional do entregador quando aplicável.",
        "Feirante e Entregador recebem apenas dados do pedido necessários à preparação/coleta/entrega.",
        "Prestadores de pagamento, hospedagem, armazenamento, autenticação, antifraude, comunicação e suporte podem atuar como operadores ou controladores independentes conforme o serviço e o contrato.",
        "Autoridades podem receber dados quando houver obrigação legal, ordem válida ou necessidade de exercício regular de direitos.",
        "O Feiraê não deve vender dados pessoais como mercadoria.",
      ],
    },
    {
      title: "7. Transferência internacional",
      paragraphs: [
        "Se provedores de nuvem ou tecnologia tratarem dados fora do Brasil, a transferência deve observar a LGPD e a Resolução CD/ANPD nº 19/2024, incluindo mecanismo de transferência válido, transparência e medidas contratuais/técnicas adequadas.",
      ],
    },
    {
      title: "8. Retenção e descarte",
      bullets: [
        "Dados de conta e documentos: mantidos enquanto necessários à relação e por período adicional quando houver obrigação legal, prevenção de fraude ou exercício regular de direitos.",
        "Dados financeiros e fiscais: mantidos pelo período exigido pela legislação aplicável e por obrigações de auditoria/contestação.",
        "Geolocalização detalhada: deve ter retenção reduzida ao necessário para entrega, suporte, segurança, fraude e contestação; depois deve ser eliminada ou anonimizada quando não houver base para retenção.",
        "Consentimentos e assinaturas: mantidos como prova de manifestação e versão aceita durante o período necessário à finalidade e defesa de direitos.",
        "Registros de incidentes de segurança com dados pessoais: ao menos cinco anos quando sujeitos ao Regulamento de Comunicação de Incidente de Segurança da ANPD.",
      ],
    },
    {
      title: "9. Direitos do titular",
      bullets: [
        "Confirmação da existência de tratamento.",
        "Acesso aos dados.",
        "Correção de dados incompletos, inexatos ou desatualizados.",
        "Informações sobre compartilhamento.",
        "Anonimização, bloqueio ou eliminação quando cabíveis.",
        "Portabilidade quando regulamentada e aplicável.",
        "Revogação do consentimento e informação sobre suas consequências.",
        "Oposição e revisão de tratamento nas hipóteses previstas em lei.",
        "Petição à ANPD após tentativa de exercício perante o controlador, quando cabível.",
      ],
    },
    {
      title: "10. Marketing, ofertas e WhatsApp",
      paragraphs: [
        "Comunicação operacional necessária ao pedido, segurança ou contrato não deve ser confundida com marketing. Ofertas promocionais, campanhas e WhatsApp comercial devem ter preferência própria, linguagem clara e possibilidade de desativação quando a base utilizada exigir.",
        "Caixas opcionais não devem vir pré-marcadas. A recusa ao marketing não pode impedir acesso às funções essenciais contratadas.",
      ],
    },
    {
      title: "11. Segurança",
      bullets: [
        "Produção deve usar autenticação real, armazenamento privado, criptografia em trânsito, controle de acesso por função, logs de auditoria, minimização e proteção de segredos.",
        "Documentos de identidade, CNH, CRLV-e e dados bancários não devem ficar expostos em armazenamento público.",
        "Acesso administrativo a documentos deve ser restrito a pessoas autorizadas e gerar trilha quando apropriado.",
      ],
    },
    {
      title: "12. Incidente de segurança",
      paragraphs: [
        "Incidente com risco ou dano relevante deve ser avaliado conforme a Resolução CD/ANPD nº 15/2024. Quando configurado o dever de comunicação, o controlador deve comunicar ANPD e titulares no prazo regulamentar de três dias úteis, ressalvada legislação específica.",
        "A política interna deve preservar evidências, conter o incidente, corrigir vulnerabilidade, registrar decisões e manter o registro do incidente pelo prazo regulamentar aplicável.",
      ],
    },
    {
      title: "13. Decisões automatizadas e prevenção de fraude",
      paragraphs: [
        "Filtros de veículo, raio, documentação, risco e integridade podem apoiar decisões da plataforma. Em produção, decisões relevantes baseadas unicamente em tratamento automatizado devem ser transparentes e permitir exercício dos direitos previstos pela LGPD quando aplicável.",
      ],
    },
    {
      title: "14. Atualizações e canal de privacidade",
      paragraphs: [
        "Mudança material deste aviso deve gerar nova versão e destaque ao titular; quando a alteração depender de consentimento, nova manifestação deve ser solicitada.",
        "Antes da produção, o Feiraê deve publicar canal de privacidade/encarregado com identificação do controlador, prazos operacionais e protocolo para exercício de direitos.",
      ],
    },
  ],
  declarations: [
    "Li o Aviso de Privacidade e fui informado sobre categorias de dados, finalidades, bases legais, compartilhamentos, retenção, segurança e meus direitos.",
    "Entendi que esta assinatura registra ciência do aviso e não transforma tratamentos obrigatórios em consentimento, nem substitui consentimentos opcionais que devam ser solicitados separadamente.",
    "Comprometo-me a utilizar dados de clientes, feirantes e entregadores somente para finalidades autorizadas e a comunicar incidentes ou acessos indevidos de que eu tomar conhecimento.",
  ],
  references: commonReferences,
};

export const vendorRequiredTerms = [vendorPartnerTerm, privacyNoticeTerm];
export const deliveryRequiredTerms = [deliveryPartnerTerm, privacyNoticeTerm];

export function hasCurrentLegalAcceptance(
  acceptances: LegalAcceptance[],
  term: LegalTerm,
  role: Exclude<LegalPartyRole, "all">,
) {
  return acceptances.some(
    (acceptance) =>
      acceptance.termId === term.id && acceptance.version === term.version && acceptance.role === role,
  );
}

export function allRequiredTermsAccepted(
  acceptances: LegalAcceptance[],
  terms: LegalTerm[],
  role: Exclude<LegalPartyRole, "all">,
) {
  return terms.every((term) => hasCurrentLegalAcceptance(acceptances, term, role));
}

function canonicalTerm(term: LegalTerm) {
  return JSON.stringify({
    id: term.id,
    version: term.version,
    role: term.role,
    title: term.title,
    summary: term.summary,
    sections: term.sections,
    declarations: term.declarations,
    references: term.references,
  });
}

export async function legalTermFingerprint(term: LegalTerm) {
  const canonical = canonicalTerm(term);
  const bytes = new TextEncoder().encode(canonical);

  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function demoLegalAcceptance(
  term: LegalTerm,
  role: Exclude<LegalPartyRole, "all">,
  signerName: string,
  signerEmail: string,
): LegalAcceptance {
  return {
    termId: term.id,
    version: term.version,
    role,
    signerName,
    signerEmail,
    signedAt: "26/09/2026 18:00",
    fingerprint: `demo:${term.id}:${term.version}`,
    method: "seed-demo",
  };
}
