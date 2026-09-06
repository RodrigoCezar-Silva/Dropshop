const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');

const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Configurações ABNT (Medidas em twips: 1 cm ≈ 567 twips)
// Margens: Superior 3 cm (1701 twips), Esquerda 3 cm (1701 twips), Inferior 2 cm (1134 twips), Direita 2 cm (1134 twips)
const MARGIN_TOP = 1701;
const MARGIN_LEFT = 1701;
const MARGIN_BOTTOM = 1134;
const MARGIN_RIGHT = 1134;

// Parágrafo Normal ABNT: Times New Roman 12pt (size 24), entrelinhas 1,5 (line 360), recuo 1,25 cm (firstLine 709)
function pNormal(textRuns, options = {}) {
  const children = Array.isArray(textRuns)
    ? textRuns
    : [new TextRun({ text: textRuns, font: 'Times New Roman', size: 24, ...options })];

  return new Paragraph({
    children,
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 709 },
    spacing: { line: 360, after: 0, before: 0 },
  });
}

// Citação Longa ABNT (4 linhas ou mais): Recuo de 4 cm (left 2268), fonte Times New Roman 11pt (size 22), entrelinhas simples (line 240)
function pCitacaoLonga(textRuns, options = {}) {
  const children = Array.isArray(textRuns)
    ? textRuns
    : [new TextRun({ text: textRuns, font: 'Times New Roman', size: 22, ...options })];

  return new Paragraph({
    children,
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 2268, firstLine: 0 },
    spacing: { line: 240, before: 120, after: 120 },
  });
}

// Título de Seção Primária (ex: 1 INTRODUÇÃO, SUMÁRIO, 3 CONCLUSÃO, REFERÊNCIAS)
function pSecaoPrimaria(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })],
    spacing: { before: 240, after: 120, line: 360 },
    alignment: AlignmentType.LEFT,
  });
}

// Título de Seção Secundária (ex: 2.1 Tema, 2.2 Justificativa)
function pSecaoSecundaria(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Times New Roman', size: 24, bold: true })],
    spacing: { before: 180, after: 100, line: 360 },
    alignment: AlignmentType.LEFT,
  });
}

// Linha do Sumário
function pSumarioItem(secao, titulo, pagina, options = {}) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${secao} `, font: 'Times New Roman', size: 22, bold: options.bold || false }),
      new TextRun({ text: titulo, font: 'Times New Roman', size: 22, bold: options.bold || false }),
      new TextRun({ text: ` ${'.'.repeat(options.dots || 45)} `, font: 'Times New Roman', size: 22, color: '666666' }),
      new TextRun({ text: `${pagina}`, font: 'Times New Roman', size: 22, bold: options.bold || false }),
    ],
    alignment: AlignmentType.LEFT,
    indent: { left: options.indent ? 360 : 0 },
    spacing: { line: 250, after: 30 },
  });
}

// Parágrafo de Referência ABNT
function pReferencia(textRuns) {
  const children = Array.isArray(textRuns)
    ? textRuns
    : [new TextRun({ text: textRuns, font: 'Times New Roman', size: 24 })];

  return new Paragraph({
    children,
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, after: 120 },
  });
}

// ==========================================
// PÁGINA 1: CABEÇALHO, TÍTULO, SUMÁRIO E INTRODUÇÃO
// ==========================================
const pagina1 = [
  new Paragraph({
    children: [
      new TextRun({ text: 'UNIVERSIDADE VEIGA DE ALMEIDA — UVA\n', font: 'Times New Roman', size: 22, bold: true }),
      new TextRun({ text: 'CURSO DE BACHARELADO EM SISTEMAS DE INFORMAÇÃO\n', font: 'Times New Roman', size: 20, bold: true }),
      new TextRun({ text: 'TRABALHO DE CONCLUSÃO DE CURSO — PRÉ-PROJETO DE PESQUISA', font: 'Times New Roman', size: 20, italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 140, line: 240 },
  }),
  new Paragraph({
    children: [
      new TextRun({ text: 'Acadêmico(a): ', font: 'Times New Roman', size: 20, bold: true }),
      new TextRun({ text: 'Rodrigo Cézar da Silva | ', font: 'Times New Roman', size: 20 }),
      new TextRun({ text: 'Orientador(a): ', font: 'Times New Roman', size: 20, bold: true }),
      new TextRun({ text: 'Prof. [Orientador(a)]\n', font: 'Times New Roman', size: 20 }),
      new TextRun({ text: 'Linha de Pesquisa: ', font: 'Times New Roman', size: 20, bold: true }),
      new TextRun({ text: 'Engenharia de Software, Segurança da Informação e Sistemas Web', font: 'Times New Roman', size: 20 }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { after: 180, line: 240 },
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: 'PROJETO E DESENVOLVIMENTO DE UMA PLATAFORMA DE E-COMMERCE MODULAR: ARQUITETURA, SEGURANÇA E DESEMPENHO APLICADOS A PEQUENAS E MÉDIAS EMPRESAS',
        font: 'Times New Roman',
        size: 24,
        bold: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 180, line: 300 },
  }),

  // SUMÁRIO
  pSecaoPrimaria('SUMÁRIO'),
  pSumarioItem('1', 'INTRODUÇÃO', '1', { bold: true, dots: 52 }),
  pSumarioItem('2', 'DEFINIÇÃO DO PROJETO', '2', { bold: true, dots: 42 }),
  pSumarioItem('2.1', 'Tema', '2', { indent: true, dots: 54 }),
  pSumarioItem('2.2', 'Justificativa', '2', { indent: true, dots: 48 }),
  pSumarioItem('2.3', 'Problema de Pesquisa', '2', { indent: true, dots: 39 }),
  pSumarioItem('2.4', 'Hipóteses', '2', { indent: true, dots: 50 }),
  pSumarioItem('3', 'CONCLUSÃO', '3', { bold: true, dots: 55 }),
  pSumarioItem('', 'REFERÊNCIAS', '3', { bold: true, dots: 50 }),

  // 1. INTRODUÇÃO
  pSecaoPrimaria('1. INTRODUÇÃO'),
  pNormal([
    new TextRun('A expansão do comércio eletrônico ('),
    new TextRun({ text: 'e-commerce', italics: true }),
    new TextRun(') consolidou-se como requisito indispensável para a sustentabilidade de micro, pequenas e médias empresas (PMEs). Segundo Laudon e Laudon (2014, p. 320), os canais digitais redefiniram a intermediação comercial ao permitir que organizações de qualquer porte alcancem mercados geograficamente distribuídos, reduzindo significativamente custos transacionais. Contudo, PMEs enfrentam custos proibitivos de plataformas fechadas e rigidez arquitetural de sistemas legados (PRESSMAN; MAXIM, 2016). Consoante elucida Sommerville (2019, p. 115):')
  ]),
  pCitacaoLonga(
    'A arquitetura de software é a estrutura fundamental sobre a qual o sistema é construído. Uma arquitetura bem concebida assegura que o sistema não apenas satisfaça seus requisitos funcionais imediatos, mas também alcance atributos críticos de qualidade, como manutenibilidade, desempenho sob carga variável, tolerância a falhas e segurança contra acessos não autorizados.'
  ),
  pNormal([
    new TextRun('Delimitada no recorte temporal de 2024 a 2026, esta pesquisa investiga o projeto e a validação do protótipo '),
    new TextRun({ text: 'Dropshop', bold: true }),
    new TextRun(', articulando um '),
    new TextRun({ text: 'front-end', italics: true }),
    new TextRun(' estático responsivo, um '),
    new TextRun({ text: 'back-end', italics: true }),
    new TextRun(' RESTful em Node.js/Express, banco relacional MySQL, autenticação JWT e criptografia '),
    new TextRun({ text: 'bcrypt', italics: true }),
    new TextRun('.')
  ]),
];

// ==========================================
// PÁGINA 2: DEFINIÇÃO DO PROJETO, TEMA, JUSTIFICATIVA, PROBLEMA E HIPÓTESES
// ==========================================
const pagina2 = [
  pSecaoPrimaria('2. DEFINIÇÃO DO PROJETO'),
  
  pSecaoSecundaria('2.1 Tema'),
  pNormal([
    new TextRun('O tema compreende a '),
    new TextRun({ text: 'Engenharia de Software e Arquitetura de Plataformas Web de E-commerce: Desenvolvimento, Avaliação de Desempenho e Segurança de uma Aplicação Modular Full Stack para Pequenas e Médias Empresas', bold: true }),
    new TextRun('. Delimita-se à implementação de autenticação multifatorial, catálogo dinâmico, carrinho, '),
    new TextRun({ text: 'checkout', italics: true }),
    new TextRun(', avaliações e painéis de controle, com foco na mitigação dos riscos do '),
    new TextRun({ text: 'OWASP Top 10', italics: true }),
    new TextRun(' (OWASP, 2021).')
  ]),

  pSecaoSecundaria('2.2 Justificativa'),
  pNormal([
    new TextRun('A justificativa desdobra-se em três dimensões: acadêmica, tecnológica e socioeconômica. Sob o enfoque '),
    new TextRun({ text: 'acadêmico-teórico', bold: true }),
    new TextRun(', analisa-se a aplicação prática de padrões arquiteturais em ecossistemas JavaScript/Node.js. Conforme Fowler (2003, p. 48), a separação de responsabilidades entre apresentação, domínio e persistência é elementar para a manutenibilidade de sistemas empresariais. Na dimensão '),
    new TextRun({ text: 'tecnológico-prática', bold: true }),
    new TextRun(', propõe-se uma alternativa ao aprisionamento tecnológico ('),
    new TextRun({ text: 'vendor lock-in', italics: true }),
    new TextRun(') de plataformas proprietárias, empregando consultas parametrizadas contra injeção SQL, controle RBAC e conteinerização Docker. No âmbito '),
    new TextRun({ text: 'socioeconômico', bold: true }),
    new TextRun(', fornece-se um modelo acessível que assegura a privacidade dos dados conforme a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018).')
  ]),

  pSecaoSecundaria('2.3 Problema de Pesquisa'),
  pNormal([
    new TextRun('Diante da necessidade de conciliar baixo custo de infraestrutura, robustez e segurança em lojas virtuais, indaga-se: ')
  ]),
  pNormal([
    new TextRun({
      text: 'De que maneira a concepção de uma arquitetura web modular desacoplada — fundamentada em Node.js, Express, banco de dados relacional MySQL e autenticação baseada em tokens JWT — viabiliza a construção de uma plataforma de e-commerce segura, de baixo custo operacional e com desempenho adequado para os fluxos transacionais de pequenas e médias empresas?',
      bold: true,
      italics: true,
    })
  ]),

  pSecaoSecundaria('2.4 Hipóteses'),
  pNormal([
    new TextRun({ text: 'a) Hipótese Principal (H1): ', bold: true }),
    new TextRun('A arquitetura modular desacoplada em Node.js/Express com persistência relacional normalizada em MySQL assegura tempo de resposta inferior a 500 ms em consultas de catálogo e checkout, proporcionando manutenibilidade superior.')
  ]),
  pNormal([
    new TextRun({ text: 'b) Hipótese Secundária 1 (H2): ', bold: true }),
    new TextRun('A aplicação de tokens JWT com expiração, criptografia bcrypt e prepared statements no MySQL neutraliza os principais vetores do OWASP Top 10 (SQL Injection, XSS e quebra de autenticação).')
  ]),
  pNormal([
    new TextRun({ text: 'c) Hipótese Secundária 2 (H3): ', bold: true }),
    new TextRun('A modelagem relacional normalizada garante a consistência das transações de estoque e pedidos sob concorrência.')
  ]),
  pNormal([
    new TextRun({ text: 'd) Hipótese Secundária 3 (H4): ', bold: true }),
    new TextRun('A conteinerização via Docker associada a serviços de nuvem sob demanda viabiliza um ambiente resiliente com custo de ociosidade praticamente nulo.')
  ]),
];

// ==========================================
// PÁGINA 3: CONCLUSÃO E REFERÊNCIAS
// ==========================================
const pagina3 = [
  pSecaoPrimaria('3. CONCLUSÃO'),
  pNormal([
    new TextRun('Este pré-projeto de pesquisa estabelece as diretrizes teóricas, arquiteturais e metodológicas para o desenvolvimento da plataforma '),
    new TextRun({ text: 'Dropshop', bold: true }),
    new TextRun('. Constata-se que a conjugação de uma arquitetura em camadas orientada a serviços RESTful, o uso de tecnologias de código aberto amplamente consolidadas (Node.js, Express, MySQL) e a aplicação estrita de boas práticas de segurança cibernética constituem uma solução viável e altamente escalável para PMEs que buscam autonomia digital.')
  ]),
  pNormal([
    new TextRun('Os resultados preliminares e o planejamento executado indicam que a prototipagem funcional atende aos requisitos transacionais do comércio eletrônico moderno. Como etapas subsequentes no desenvolvimento do TCC, serão conduzidos testes automatizados de carga e estresse, refinamento das rotinas de integração de pagamento e a redação aprofundada dos capítulos de avaliação e análise de resultados da monografia final.')
  ]),

  // REFERÊNCIAS
  pSecaoPrimaria('REFERÊNCIAS'),
  pReferencia([
    new TextRun({ text: 'BRASIL. ' }),
    new TextRun({ text: 'Lei nº 13.709, de 14 de agosto de 2018', bold: true }),
    new TextRun({ text: '. Dispõe sobre a proteção de dados pessoais (LGPD). Diário Oficial da União: seção 1, Brasília, DF, 15 ago. 2018.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'FOWLER, Martin. ' }),
    new TextRun({ text: 'Patterns of Enterprise Application Architecture', bold: true }),
    new TextRun({ text: '. Boston: Addison-Wesley, 2003.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'LAUDON, Kenneth C.; LAUDON, Jane P. ' }),
    new TextRun({ text: 'Sistemas de Informação Gerenciais', bold: true }),
    new TextRun({ text: '. 11. ed. São Paulo: Pearson Prentice Hall, 2014.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'LUBISCO, Nídia Maria Lienert; VIEIRA, Sônia Chagas. ' }),
    new TextRun({ text: 'Manual de estilo acadêmico: ', bold: true }),
    new TextRun({ text: 'trabalhos de conclusão de curso, dissertações e teses. 5. ed. Salvador: EDUFBA, 2013.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'OWASP FOUNDATION. ' }),
    new TextRun({ text: 'OWASP Top 10: 2021: ', bold: true }),
    new TextRun({ text: 'the ten most critical web application security risks. Open Web Application Security Project, 2021. Disponível em: https://owasp.org/Top10/. Acesso em: 15 mar. 2026.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'PRESSMAN, Roger S.; MAXIM, Bruce R. ' }),
    new TextRun({ text: 'Engenharia de Software: ', bold: true }),
    new TextRun({ text: 'uma abordagem profissional. 8. ed. Porto Alegre: AMGH, 2016.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'SOMMERVILLE, Ian. ' }),
    new TextRun({ text: 'Engenharia de Software', bold: true }),
    new TextRun({ text: '. 10. ed. São Paulo: Pearson Education do Brasil, 2019.' }),
  ]),
  pReferencia([
    new TextRun({ text: 'TURBAN, Efraim et al. ' }),
    new TextRun({ text: 'Electronic Commerce 2018: ', bold: true }),
    new TextRun({ text: 'a managerial and social networks perspective. 9. ed. Cham: Springer, 2018.' }),
  ]),
];

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: MARGIN_TOP,
            left: MARGIN_LEFT,
            bottom: MARGIN_BOTTOM,
            right: MARGIN_RIGHT,
          },
        },
      },
      children: [
        ...pagina1,
        new Paragraph({ children: [new PageBreak()] }),
        ...pagina2,
        new Paragraph({ children: [new PageBreak()] }),
        ...pagina3,
      ],
    },
  ],
});

const filesToSave = [
  path.join(outputDir, 'Pre_Projeto_TCC_Dropshop_ABNT.docx'),
  path.join(outputDir, 'Pre_Projeto_TCC_3Paginas.docx'),
  path.join(__dirname, '..', 'Pre_Projeto_TCC_ABNT.docx'),
  path.join(__dirname, '..', 'Pre_Projeto_TCC_Final.docx'),
];

Packer.toBuffer(doc).then((buffer) => {
  const saved = [];
  for (const filePath of filesToSave) {
    try {
      fs.writeFileSync(filePath, buffer);
      saved.push(filePath);
    } catch (e) {
      // Ignora arquivos bloqueados
    }
  }
  console.log('Documentos Word atualizados com sucesso:');
  saved.forEach(f => console.log(`- ${f}`));
}).catch((err) => {
  console.error('Erro ao gerar buffer do documento:', err);
});
