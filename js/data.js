// Tudo que aparece no site sai daqui.
// Campos com [preencher] ainda precisam de informação.

export const perfil = {
  nome: ['Vinicius', 'Lourenço'],
  nomeCompleto: 'Vinicius Lourenço Martins',
  cargo: 'Desenvolvedor full-stack',
  cidade: 'São Paulo, BR',
  fuso: 'America/Sao_Paulo',
  fusoLabel: 'GMT-3',
  coords: { lat: -23.5505, lon: -46.6333 },
  codandoDesde: null, // ex.: 2023
  foto: 'assets/foto.jpg', // troque pelo seu arquivo; sem foto, aparece uma silhueta
  email: 'vini172006v@gmail.com',
  status: ['codando', 'aprendendo', 'entregando'],
  sobre: {
    titulo: ['Um dev full-stack', 'movido a', '#código &', '#automação'],
    texto:
      'Estudo Análise e Desenvolvimento de Sistemas no Senac e venho do suporte técnico de TI. ' +
      'Gosto de construir sistemas que resolvem problema de gente de verdade, de fila de chamados a correção de prova com IA. ' +
      'Trabalho com Python, Java, React e Node.js, e tenho um pé em automação de processos e segurança da informação.'
  },
  redes: [
    { nome: 'GitHub', url: 'https://github.com/ViniciusVLM', icone: 'github' },
    { nome: 'LinkedIn', url: 'https://www.linkedin.com/in/vinicius-louren%C3%A7o-martins-722287381/', icone: 'linkedin' },
    { nome: 'Instagram', url: 'https://www.instagram.com/vinicius_lou_17/', icone: 'instagram' },
    { nome: 'E-mail', url: 'mailto:vini172006v@gmail.com', icone: 'mail' }
  ],
  faixaContato: [
    'Aberto a novas oportunidades',
    'Me conta o que você está construindo',
    'São Paulo, BR (GMT-3)',
    'Resposta em até 48h'
  ]
};

export const formacao = [
  {
    periodo: '2025 – 2027',
    curso: 'Análise e Desenvolvimento de Sistemas',
    instituicao: 'Centro Universitário Senac Santo Amaro',
    texto: 'Graduação tecnológica. Foi aqui que nasceu o SecureDesk, meu Projeto Integrador com Angular e Node.js.'
  }
  // para adicionar outra formação, copie o bloco acima
];

export const carreira = [
  {
    empresa: 'Reserva Parques / Dcset Group',
    logo: 'assets/empresas/reserva-parques.webp',
    cor: '#5cb85a', // verde do logo, clareado para ler no fundo escuro
    cargo: 'Suporte de TI & Segurança da Informação',
    periodo: 'Out 2025 – atual',
    texto: 'Suporte à tecnologia da operação e cuidado com a segurança da informação.'
  },
  {
    empresa: 'Vannucci',
    logo: 'assets/empresas/vannucci.webp',
    cor: '#e8231f',
    cargo: 'Recursos Humanos',
    periodo: 'Jan 2025 – Ago 2025',
    texto: 'Folha de ponto, folha de pagamento e contratação de candidatos.'
  },
  {
    empresa: 'Ativgreen',
    logo: 'assets/empresas/ativgreen.webp',
    cor: '#8fae4f',
    cargo: 'Suporte & desenvolvimento web',
    periodo: 'Nov 2023 – Dez 2024',
    texto: 'Suporte técnico e desenvolvimento de projetos web para empresas clientes.'
  }
];

export const skills = [
  { grupo: 'Frontend', itens: ['React', 'Angular', 'TypeScript', 'HTML & CSS'] },
  { grupo: 'Backend', itens: ['Node.js', 'Express', 'Django', 'Flask'] },
  { grupo: 'Linguagens', itens: ['Python', 'Java', 'JavaScript', 'SQL'] },
  { grupo: 'Dados', itens: ['MySQL', 'SQLite', 'Flyway'] },
  { grupo: 'IA & automação', itens: ['Gemini API', 'n8n'] },
  { grupo: 'Infra', itens: ['Docker', 'Git', 'Render', 'Railway'] },
  { grupo: 'Design', itens: ['Figma'] }
];

export const projetos = [
  {
    nome: 'Educathon',
    resumo: 'Copiloto pedagógico com IA',
    texto:
      'Lê a prova, até escrita à mão, e sugere um feedback por critério da rubrica. O professor revisa e decide a nota. ' +
      'Feito em equipe e semifinalista do desafio Salte com a IA, do Instituto Leapy com a 42 São Paulo.',
    tags: ['React', 'Node.js', 'Gemini', 'Docker'],
    imagem: 'assets/projetos/educathon.webp',
    repo: 'https://github.com/ViniciusVLM/EDUCATHON-project',
    extra: { label: 'Pitch', url: 'https://drive.google.com/file/d/12m5g6TW-f6cV1u64u8nYXsZOfpuAYZ3A/view?usp=sharing' }
  },
  {
    nome: 'PsycheBot',
    resumo: 'Orientação de carreira com IA',
    texto:
      'Um formulário sobre comportamento no trabalho vira um parecer de soft skills para jovens trabalhadores. ' +
      'Criado para a gincana do Dia do Jovem Trabalhador, no CIEE.',
    tags: ['Python', 'Flask', 'Gemini', 'Render'],
    imagem: 'assets/projetos/psychebot.webp',
    repo: 'https://github.com/ViniciusVLM/PsycheBott',
    extra: { label: 'Site', url: 'https://psychebot.onrender.com' }
  },
  {
    nome: 'SecureDesk',
    resumo: 'Sistema de chamados de TI',
    texto:
      'Usuários abrem chamados e acompanham o status; técnicos cuidam da fila, com login por perfil. ' +
      'Projeto Integrador do curso de ADS no Senac.',
    tags: ['Angular', 'TypeScript', 'Express', 'SQL'],
    imagem: 'assets/projetos/securedesk.webp',
    repo: 'https://github.com/ViniciusVLM/PI-Projeto-Integrador-Senac'
  },
  {
    nome: 'VaultBank',
    resumo: 'Simulador de cartão de crédito',
    texto:
      'Conta aberta com cartão na hora, extrato, contestação com reembolso e pedido de aumento de limite. ' +
      'Visual de terminal verde, homenagem aos computadores de Fallout.',
    tags: ['Java 21', 'Javalin', 'MySQL', 'Flyway'],
    imagem: 'assets/projetos/vaultbank.webp',
    repo: 'https://github.com/ViniciusVLM/Cartao-de-Credito-Java'
  }
];

// Para mostrar um certificado, coloque a imagem em assets/certificados/
// (nome.webp e uma versão menor nome-p.webp) e preencha "imagem".
// Para várias imagens no mesmo cartão, use "imagens: [...]" (vira galeria).
// Sem imagem, o cartão aparece só com o texto.
export const conquistas = [
  {
    grupo: 'Desafios & hackathons',
    itens: [
      {
        titulo: 'Salte com a IA · Semifinalista',
        org: 'Instituto Leapy · 42 São Paulo',
        detalhe: 'Educathon · em equipe',
        ano: '2026',
        posicao: 'center',
        imagens: [
          'assets/desafios/salte-semifinalista.webp',
          'assets/desafios/salte-semifinal.webp',
          'assets/desafios/salte-somos-semifinalistas.webp',
          'assets/desafios/salte-salto.webp',
          'assets/desafios/salte-certificado.webp'
        ]
      },
      {
        titulo: 'Dia do Jovem Trabalhador',
        org: 'CIEE',
        detalhe: 'Gincana · PsycheBot',
        ano: 'Jun 2026',
        posicao: 'center',
        imagens: ['assets/desafios/ciee-jovem-trabalhador.webp']
      }
    ]
  },
  {
    grupo: 'Programação & dados',
    itens: [
      { titulo: 'Modelagem de Software', org: 'Universidade Anhembi Morumbi', detalhe: 'Modelagem e persistência de dados · 160h', ano: 'Jul 2025', imagem: 'assets/certificados/anhembi-modelagem.webp' },
      { titulo: 'Programação de Soluções Computacionais', org: 'Universidade Anhembi Morumbi', detalhe: 'Qualificação profissional · 160h', ano: 'Jul 2025', imagem: 'assets/certificados/anhembi-programacao.webp' },
      { titulo: 'Java Programming', org: 'Oracle Academy', detalhe: 'Curso completo', ano: 'Jun 2025', imagem: 'assets/certificados/oracle-java.webp' },
      { titulo: 'Java for AP CSA', org: 'Oracle Academy', detalhe: 'Curso completo', ano: 'Jun 2025', imagem: 'assets/certificados/oracle-java-apcsa.webp' },
      { titulo: 'Database Programming with SQL', org: 'Oracle Academy', detalhe: 'Curso completo', ano: 'Jun 2025', imagem: 'assets/certificados/oracle-sql.webp' },
      { titulo: 'Programação em Python', org: 'SENAI Ary Torres', detalhe: '60h', ano: 'Set 2024', imagem: 'assets/certificados/senai-python.webp' },
      { titulo: 'Lógica de Programação', org: 'SENAI Ary Torres', detalhe: 'Competência transversal · 14h', ano: 'Jun 2024', imagem: 'assets/certificados/senai-logica.webp' }
    ]
  },
  {
    grupo: 'Redes & segurança',
    itens: [
      { titulo: 'Introdução à Cibersegurança', org: 'Cisco Networking Academy', detalhe: 'Curso completo', ano: 'Fev 2026', imagem: 'assets/certificados/cisco-ciberseguranca.webp' },
      { titulo: 'Linux Unhatched', org: 'Cisco Networking Academy · NDG', detalhe: 'Pelo Senac Santo Amaro', ano: 'Fev 2026', imagem: 'assets/certificados/cisco-linux.webp' },
      { titulo: 'Começando com o Cisco Packet Tracer', org: 'Cisco Networking Academy', detalhe: 'Curso completo', ano: 'Fev 2026', imagem: 'assets/certificados/cisco-packet-tracer.webp' },
      { titulo: 'Sistemas Computacionais e Segurança', org: 'Universidade Anhembi Morumbi', detalhe: 'Analista de sistemas computacionais · 160h', ano: 'Dez 2025', imagem: 'assets/certificados/anhembi-sistemas-seguranca.webp' }
    ]
  },
  {
    grupo: 'Automação & design',
    itens: [
      { titulo: 'Automação de Processos', org: 'Pipefy Academy', detalhe: 'Certificação', ano: 'Nov 2025', imagem: 'assets/certificados/pipefy-automacao.webp' },
      { titulo: 'Processo de Compras', org: 'Pipefy Academy', detalhe: 'Certificação', ano: 'Nov 2025', imagem: 'assets/certificados/pipefy-compras.webp' },
      { titulo: 'Designer de Interface Web', org: 'SENAI Suíço-Brasileira', detalhe: '60h', ano: 'Mar 2025', imagem: 'assets/certificados/senai-interface-web.webp' }
    ]
  }
];
