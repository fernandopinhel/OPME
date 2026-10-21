/*
 * Gestão OPME: dados de exemplo e esquemas dos cadastros.
 * Tudo é fictício: empresas, pessoas, CNPJs, códigos TUSS/Anvisa e valores.
 * O "banco" vive no sessionStorage; restaurar recria estes dados.
 */
(function () {
  'use strict';

  const O = window.OPME;
  const VERSAO = 4;

  /* ------------------------------------------------------- Listas fixas */

  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  const STATUS = ['Ativo', 'Inativo'];

  const ESPECIALIDADES = [
    { value: 'ORT', label: 'Ortopedia e traumatologia' },
    { value: 'NEU', label: 'Neurocirurgia' },
    { value: 'CAR', label: 'Cardiologia intervencionista' },
    { value: 'VAS', label: 'Cirurgia vascular' },
    { value: 'PLA', label: 'Cirurgia plástica' },
    { value: 'GER', label: 'Cirurgia geral' },
    { value: 'OFT', label: 'Oftalmologia' },
    { value: 'BUC', label: 'Bucomaxilofacial' }
  ];

  const PROCEDIMENTOS = [
    { value: '30725020', label: '30725020 · Artroplastia total de quadril' },
    { value: '30726026', label: '30726026 · Artroplastia total de joelho' },
    { value: '30715016', label: '30715016 · Osteossíntese de fêmur' },
    { value: '30725046', label: '30725046 · Reparo artroscópico do manguito rotador' },
    { value: '30731018', label: '30731018 · Artrodese de coluna lombar' },
    { value: '30912032', label: '30912032 · Angioplastia coronária com implante de stent' },
    { value: '30914019', label: '30914019 · Angioplastia de artéria periférica' },
    { value: '30904021', label: '30904021 · Implante de marca-passo de dupla câmara' },
    { value: '30906016', label: '30906016 · Troca valvar aórtica' },
    { value: '30602050', label: '30602050 · Reconstrução mamária com implante' },
    { value: '30101670', label: '30101670 · Hernioplastia inguinal' },
    { value: '30310076', label: '30310076 · Facectomia com implante de lente intraocular' }
  ];

  const CIDS = [
    { value: 'M16.1', label: 'M16.1 · Coxartrose primária' },
    { value: 'M17.1', label: 'M17.1 · Gonartrose primária' },
    { value: 'S72.0', label: 'S72.0 · Fratura do colo do fêmur' },
    { value: 'M75.1', label: 'M75.1 · Síndrome do manguito rotador' },
    { value: 'M51.1', label: 'M51.1 · Transtorno de disco lombar com radiculopatia' },
    { value: 'I25.1', label: 'I25.1 · Doença aterosclerótica do coração' },
    { value: 'I70.2', label: 'I70.2 · Aterosclerose das artérias das extremidades' },
    { value: 'I44.2', label: 'I44.2 · Bloqueio atrioventricular total' },
    { value: 'I35.0', label: 'I35.0 · Estenose da valva aórtica' },
    { value: 'C50.9', label: 'C50.9 · Neoplasia maligna da mama' },
    { value: 'K40.9', label: 'K40.9 · Hérnia inguinal' },
    { value: 'H25.9', label: 'H25.9 · Catarata senil' }
  ];

  const SUBGRUPOS = ['Ortopedia', 'Neurocirurgia', 'Cardiologia', 'Vascular', 'Plástica', 'Cirurgia geral', 'Oftalmologia'];

  /* --------------------------------------------- Gerador determinístico */

  let semente = 20200426;
  function rnd() {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  }
  const entre = (a, b) => a + rnd() * (b - a);
  const redondo = (n) => Math.round(n / 5) * 5;

  function cnpj(base8, filial) {
    const b = String(base8).padStart(8, '0') + String(filial || 1).padStart(4, '0');
    const dv = (s) => {
      let soma = 0;
      let peso = s.length - 7;
      for (let i = 0; i < s.length; i++) {
        soma += Number(s[i]) * peso--;
        if (peso < 2) peso = 9;
      }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = dv(b);
    const d2 = dv(b + d1);
    return O.masks.cnpj(b + d1 + d2);
  }

  const cod = (n) => String(n).padStart(3, '0');

  /* ------------------------------------------------------ Dados de exemplo */

  function seed() {
    semente = 20200426;
    const hoje = O.hoje();
    const dia = (d) => O.somaDias(hoje, d);
    const quando = (d, hora) => dia(d) + 'T' + (hora || '10:30') + ':00';
    const db = { versao: VERSAO };
    const meta = (id, dias, quem) => ({
      id,
      codigo: cod(id),
      criadoEm: quando(dias),
      criadoPor: quem || 'Renata Scott',
      alteradoEm: quando(Math.min(0, dias + 40)),
      alteradoPor: quem || 'Renata Scott',
      historico: [{ quando: quando(dias), quem: quem || 'Renata Scott', acao: 'Cadastro criado' }]
    });

    db.unidadesMedida = [
      ['UND', 'Unidade'], ['CX', 'Caixa'], ['PCT', 'Pacote'], ['ENV', 'Envelope'], ['DZ', 'Dúzia'],
      ['ROL', 'Rolo'], ['KIT', 'Kit'], ['PAR', 'Par'], ['FR', 'Frasco']
    ].map((u, i) => Object.assign(meta(i + 1, -900 + i * 3), { sigla: u[0], descricao: u[1], status: u[0] === 'FR' ? 'Inativo' : 'Ativo' }));

    const endereco = (cep, logradouro, numero, bairro, cidade, uf) => ({ cep, logradouro, numero, complemento: '', bairro, cidade, uf });

    db.unidadesNegocio = [
      ['Origem', 'Valora Saúde', 41250877, endereco('01310-100', 'Avenida Paulista', '1200', 'Bela Vista', 'São Paulo', 'SP')],
      ['Origem', 'Valora Saúde Empresarial', 41250877, endereco('01310-100', 'Avenida Paulista', '1200', 'Bela Vista', 'São Paulo', 'SP'), 2],
      ['Origem', 'Valora Odonto', 41250877, endereco('20031-170', 'Rua da Assembleia', '45', 'Centro', 'Rio de Janeiro', 'RJ'), 3, 'Inativo'],
      ['Prestador', 'Rede Cuidar Prestadora', 52981004, endereco('30140-071', 'Rua da Bahia', '880', 'Lourdes', 'Belo Horizonte', 'MG')],
      ['Prestador', 'Valora Day Clinic', 41250877, endereco('04538-133', 'Avenida Brigadeiro Faria Lima', '3400', 'Itaim Bibi', 'São Paulo', 'SP'), 4]
    ].map((u, i) => Object.assign(meta(i + 1, -1000 + i * 5), {
      tipo: u[0], nome: u[1], cnpj: cnpj(u[2], u[4] || 1), terminoContrato: u[0] === 'Prestador' ? dia(400 + i * 60) : '',
      status: u[5] || 'Ativo', observacoes: '', endereco: u[3], entregaMesmoEndereco: 'sim', entrega: null,
      contatos: [{ nome: 'Central de OPME', telefone: '(11) 3003-' + (4100 + i), email: 'opme' + (i + 1) + '@valorasaude.exemplo' }]
    }));

    db.marcas = [
      ['OrtoVértice', 'Nacional'], ['Silmar Implantes', 'Nacional'], ['NeoSpine Medical', 'Importado'],
      ['CardioLume', 'Importado'], ['LifeFlow Vascular', 'Importado'], ['Arcos Cirúrgica', 'Nacional'],
      ['Vitalle Medical', 'Importado'], ['Oftalmo Prisma', 'Importado'], ['BioTrama', 'Nacional'],
      ['Medicativa', 'Nacional'], ['Sutura Viva', 'Nacional']
    ].map((m, i) => Object.assign(meta(i + 1, -800 + i * 7), {
      nome: m[0], procedencia: m[1], status: m[0] === 'Sutura Viva' ? 'Inativo' : 'Ativo', observacoes: ''
    }));
    const marca = (nome) => db.marcas.find((m) => m.nome === nome).id;

    db.telas = [
      ['Solicitações de compra', 'solicitacoes.html'], ['Tabelas de valores', 'tabelas.html'], ['Relatório de preços', 'relatorio.html'],
      ['Hospitais e clínicas', 'consulta.html?tipo=hospitais'], ['Fornecedores', 'consulta.html?tipo=fornecedores'],
      ['Itens OPME', 'consulta.html?tipo=itens'], ['Marcas e fabricantes', 'consulta.html?tipo=marcas'],
      ['Unidades de medida', 'consulta.html?tipo=unidadesMedida'], ['Unidades de negócio', 'consulta.html?tipo=unidadesNegocio'],
      ['Usuários', 'consulta.html?tipo=usuarios'], ['Grupos de acesso', 'consulta.html?tipo=grupos'], ['Telas do sistema', 'consulta.html?tipo=telas'],
      ['Painel de indicadores', 'painel.html', 'Inativo', 'Previsto para a fase 2.'], ['Mensagens', 'mensagens.html', 'Inativo', 'Previsto para a fase 2.']
    ].map((t, i) => Object.assign(meta(i + 1, -950 + i), { nome: t[0], caminho: t[1], status: t[2] || 'Ativo', descricao: t[3] || '' }));

    const todas = ['incluir', 'consultar', 'alterar', 'excluir'];
    const perm = (ids, acoes) => ids.reduce((acc, id) => { acc[id] = acoes.slice(); return acc; }, {});
    const idsTelas = db.telas.filter((t) => t.status === 'Ativo').map((t) => t.id);
    db.grupos = [
      ['Administrador', 'Acesso completo, inclusive configurações.', perm(idsTelas, todas)],
      ['Analista de negociação', 'Conduz solicitações e negocia valores.', Object.assign(perm([1, 2], ['incluir', 'consultar', 'alterar']), perm([3, 4, 5, 6, 7], ['consultar']))],
      ['Analista de cadastro', 'Mantém hospitais, fornecedores e itens.', Object.assign(perm([4, 5, 6, 7, 8], ['incluir', 'consultar', 'alterar']), perm([1, 2], ['consultar']))],
      ['Aprovador', 'Aprova ou reprova itens negociados.', Object.assign(perm([1], ['consultar', 'alterar']), perm([2, 3], ['consultar']))],
      ['Consulta', 'Somente leitura.', perm([1, 2, 3, 4, 5, 6, 7], ['consultar'])],
      ['Auditoria externa', 'Grupo criado e ainda sem telas liberadas.', {}, 'Inativo']
    ].map((g, i) => Object.assign(meta(i + 1, -940 + i), { nome: g[0], descricao: g[1], permissoes: g[2], status: g[3] || 'Ativo' }));

    db.usuarios = [
      ['G754632', 'Renata Scott', 1], ['G542333', 'Renan Rocha', 2], ['G613045', 'Juliana Prado', 2],
      ['G702118', 'Marcos Teixeira', 4], ['G488210', 'Patrícia Nunes', 5], ['G590774', 'Diego Andrade', 3, 'Inativo'],
      ['G631902', 'Camila Freitas', 3], ['G644550', 'Bruno Siqueira', 4]
    ].map((u, i) => Object.assign(meta(i + 1, -930 + i * 4), {
      matricula: u[0], nome: u[1], grupo: u[2], status: u[3] || 'Ativo',
      email: O.normaliza(u[1]).replace(/\s+/g, '.') + '@valorasaude.exemplo'
    }));

    const fornecedores = [
      ['Ortomed Distribuidora de Materiais Hospitalares LTDA', 'Ortomed', 'Nacional', 18332540, endereco('04094-050', 'Avenida Ibirapuera', '2100', 'Moema', 'São Paulo', 'SP'), ['OrtoVértice', 'Arcos Cirúrgica', 'Vitalle Medical']],
      ['BioPonte Comércio de Produtos Médicos LTDA', 'BioPonte', 'Nacional', 27114809, endereco('22250-040', 'Praia de Botafogo', '300', 'Botafogo', 'Rio de Janeiro', 'RJ'), ['BioTrama', 'Medicativa', 'Silmar Implantes']],
      ['Implanta Brasil Importação e Comércio LTDA', 'Implanta Brasil', 'Importado', 30876112, endereco('13025-320', 'Rua Coronel Quirino', '1500', 'Cambuí', 'Campinas', 'SP'), ['Vitalle Medical', 'NeoSpine Medical', 'OrtoVértice']],
      ['VascuLine Comércio de Materiais LTDA', 'VascuLine', 'Nacional', 22650871, endereco('90570-020', 'Rua Mostardeiro', '780', 'Moinhos de Vento', 'Porto Alegre', 'RS'), ['LifeFlow Vascular', 'CardioLume']],
      ['CardioVia Produtos Médicos S.A.', 'CardioVia', 'Importado', 33902447, endereco('80250-104', 'Avenida Sete de Setembro', '4500', 'Batel', 'Curitiba', 'PR'), ['CardioLume', 'LifeFlow Vascular']],
      ['Medsul Suprimentos Hospitalares LTDA', 'Medsul', 'Nacional', 15448203, endereco('88015-200', 'Rua Esteves Júnior', '160', 'Centro', 'Florianópolis', 'SC'), ['Medicativa', 'BioTrama', 'Oftalmo Prisma']],
      ['Heartline Comércio de Material Médico LTDA', 'Heartline', 'Nacional', 29081536, endereco('30130-170', 'Avenida Afonso Pena', '2770', 'Funcionários', 'Belo Horizonte', 'MG'), ['CardioLume']],
      ['NeuroPrime Distribuidora LTDA', 'NeuroPrime', 'Nacional', 26554318, endereco('74110-010', 'Avenida T-4', '619', 'Setor Bueno', 'Goiânia', 'GO'), ['NeoSpine Medical'], 'Inativo']
    ];
    db.fornecedores = fornecedores.map((f, i) => Object.assign(meta(i + 1, -700 + i * 9), {
      cnpj: cnpj(f[3]), inscricaoEstadual: String(110000000 + f[3] % 99999999).slice(0, 9), inscricaoMunicipal: '',
      razaoSocial: f[0], nomeFantasia: f[1], procedencia: f[2], endereco: f[4], status: f[6] || 'Ativo',
      processoAvaliacao: i % 3 === 0 ? 'nao' : 'sim', relacaoComercial: 'sim', matrizFilial: 'Matriz', grupo: 'OPME',
      condicaoPagamento: i % 2 ? '30 dias' : 'Em conta, via hospital ou clínica', frete: i % 3 === 1 ? 'FOB' : 'CIF',
      observacoes: '', marcas: f[5].map(marca),
      contatos: [{ nome: ['Larissa Campos', 'Rafael Mendes', 'Tatiane Rocha', 'Eduardo Lima', 'Priscila Gomes', 'Vinícius Prado', 'Aline Duarte', 'Gustavo Faria'][i], telefone: '(' + [11, 21, 19, 51, 41, 48, 31, 62][i] + ') 9' + (8100 + i * 37) + '-' + (2200 + i * 113), email: 'comercial@' + O.normaliza(f[1]).replace(/\s+/g, '') + '.exemplo' }]
    }));

    const hospitais = [
      ['Hospital Vale Verde S.A.', 'Hospital Vale Verde', 'Hospital', 37120458, endereco('05424-150', 'Rua dos Pinheiros', '1400', 'Pinheiros', 'São Paulo', 'SP')],
      ['Associação Hospitalar Bela Vista', 'Hospital Bela Vista', 'Hospital', 33410276, endereco('22410-001', 'Rua Visconde de Pirajá', '600', 'Ipanema', 'Rio de Janeiro', 'RJ')],
      ['Clínica Horizonte Ortopedia LTDA', 'Clínica Horizonte', 'Clínica', 21987345, endereco('30112-000', 'Avenida do Contorno', '5400', 'Funcionários', 'Belo Horizonte', 'MG')],
      ['Hospital Monte Azul LTDA', 'Hospital Monte Azul', 'Hospital', 44120983, endereco('13024-001', 'Avenida Norte-Sul', '900', 'Cambuí', 'Campinas', 'SP')],
      ['Instituto do Coração Aurora', 'Instituto Aurora', 'Hospital', 19203847, endereco('90035-001', 'Avenida Independência', '1200', 'Independência', 'Porto Alegre', 'RS')],
      ['Hospital Primavera do Paraná LTDA', 'Hospital Primavera', 'Hospital', 28345120, endereco('80420-090', 'Rua Comendador Araújo', '700', 'Batel', 'Curitiba', 'PR')],
      ['Hospital Maré Alta S.A.', 'Hospital Maré Alta', 'Hospital', 35678901, endereco('41820-020', 'Avenida Tancredo Neves', '1500', 'Caminho das Árvores', 'Salvador', 'BA')],
      ['Clínica Visão Clara Oftalmologia LTDA', 'Clínica Visão Clara', 'Clínica', 24561230, endereco('11060-001', 'Avenida Ana Costa', '300', 'Gonzaga', 'Santos', 'SP')],
      ['Hospital Jardim das Acácias LTDA', 'Hospital Jardim das Acácias', 'Hospital', 31029384, endereco('74230-010', 'Avenida T-9', '2100', 'Jardim América', 'Goiânia', 'GO')],
      ['Day Hospital Ipê LTDA', 'Day Hospital Ipê', 'Day hospital', 27890123, endereco('70390-100', 'SGAS Quadra 613', '10', 'Asa Sul', 'Brasília', 'DF')],
      ['Hospital Campo Sereno LTDA', 'Hospital Campo Sereno', 'Hospital', 38901234, endereco('52011-000', 'Rua Joaquim Nabuco', '800', 'Graças', 'Recife', 'PE')],
      ['Hospital Serra Nova LTDA', 'Hospital Serra Nova', 'Hospital', 22109876, endereco('88036-000', 'Rua Lauro Linhares', '1200', 'Trindade', 'Florianópolis', 'SC'), 'Inativo']
    ];
    const DDD = { SP: 11, RJ: 21, MG: 31, RS: 51, PR: 41, BA: 71, GO: 62, DF: 61, PE: 81, SC: 48 };
    db.hospitais = hospitais.map((x, i) => Object.assign(meta(i + 1, -600 + i * 11), {
      cnpj: cnpj(x[3]), inscricaoEstadual: '', razaoSocial: x[0], nomeFantasia: x[1], tipo: x[2], unidadeNegocio: i % 4 === 3 ? 2 : 1,
      status: x[5] || 'Ativo', observacoes: '', endereco: x[4], entregaMesmoEndereco: i === 1 ? 'nao' : 'sim',
      entrega: i === 1 ? endereco('20921-030', 'Rua General Gurjão', '200', 'Caju', 'Rio de Janeiro', 'RJ') : null,
      contatos: [{ nome: ['Sílvia Moraes', 'Henrique Bastos', 'Paula Reis', 'Fábio Nogueira', 'Cristina Alves', 'Mário Lopes', 'Joana Brito', 'Sérgio Paiva', 'Lúcia Vidal', 'André Coelho', 'Beatriz Sales', 'Otávio Prates'][i] + ' (suprimentos)', telefone: '(' + DDD[x[4].uf] + ') 3' + (200 + i * 7) + '-' + (4400 + i * 21), email: 'suprimentos@' + O.normaliza(x[1]).replace(/\s+/g, '') + '.exemplo' }]
    }));

    const itens = [
      ['Placa bloqueada de compressão 4,5 mm, 8 furos', 'Órtese', 'Ortopedia', 'OrtoVértice', 4800, 'UND'],
      ['Parafuso cortical autorroscante 3,5 mm', 'Material especial', 'Ortopedia', 'OrtoVértice', 180, 'UND'],
      ['Haste intramedular bloqueada de fêmur', 'Órtese', 'Ortopedia', 'Arcos Cirúrgica', 6900, 'UND'],
      ['Prótese total de quadril não cimentada', 'Prótese', 'Ortopedia', 'Vitalle Medical', 28500, 'KIT'],
      ['Prótese total de joelho primária', 'Prótese', 'Ortopedia', 'Vitalle Medical', 31200, 'KIT'],
      ['Âncora de sutura absorvível 5,0 mm', 'Material especial', 'Ortopedia', 'Arcos Cirúrgica', 2100, 'UND'],
      ['Cage intersomático lombar em PEEK', 'Prótese', 'Neurocirurgia', 'NeoSpine Medical', 9800, 'UND'],
      ['Parafuso pedicular poliaxial 6,5 mm', 'Material especial', 'Neurocirurgia', 'NeoSpine Medical', 2600, 'UND'],
      ['Stent coronário farmacológico 3,0 x 18 mm', 'Prótese', 'Cardiologia', 'CardioLume', 7400, 'UND'],
      ['Cateter balão de pré-dilatação periférico', 'Material especial', 'Vascular', 'LifeFlow Vascular', 3100, 'UND'],
      ['Fio-guia hidrofílico 0,035" com 150 cm', 'Material especial', 'Vascular', 'LifeFlow Vascular', 690, 'UND'],
      ['Introdutor valvulado 6F', 'Material especial', 'Vascular', 'LifeFlow Vascular', 420, 'UND'],
      ['Marca-passo cardíaco de dupla câmara', 'Prótese', 'Cardiologia', 'CardioLume', 38900, 'UND'],
      ['Válvula cardíaca biológica aórtica', 'Prótese', 'Cardiologia', 'CardioLume', 42000, 'UND'],
      ['Implante mamário de silicone gel coesivo 300 ml', 'Prótese', 'Plástica', 'Silmar Implantes', 3200, 'PAR'],
      ['Implante de panturrilha com superfície lisa', 'Prótese', 'Plástica', 'Silmar Implantes', 2900, 'PAR'],
      ['Tela de polipropileno para hérnia 15 x 15 cm', 'Material especial', 'Cirurgia geral', 'BioTrama', 980, 'UND'],
      ['Carga de grampeador linear cortante 60 mm', 'Material especial', 'Cirurgia geral', 'Medicativa', 1350, 'UND'],
      ['Lente intraocular dobrável acrílica', 'Prótese', 'Oftalmologia', 'Oftalmo Prisma', 1650, 'UND'],
      ['Agulha de punção para biópsia óssea', 'Material especial', 'Cirurgia geral', 'Medicativa', 510, 'UND']
    ];
    const espDe = { 'Ortopedia': ['ORT'], 'Neurocirurgia': ['NEU', 'ORT'], 'Cardiologia': ['CAR'], 'Vascular': ['VAS', 'CAR'], 'Plástica': ['PLA'], 'Cirurgia geral': ['GER'], 'Oftalmologia': ['OFT'] };
    const procDe = { 'Ortopedia': ['30725020', '30726026', '30715016', '30725046'], 'Neurocirurgia': ['30731018'], 'Cardiologia': ['30912032', '30904021', '30906016'], 'Vascular': ['30914019', '30912032'], 'Plástica': ['30602050'], 'Cirurgia geral': ['30101670'], 'Oftalmologia': ['30310076'] };
    const um = (sigla) => db.unidadesMedida.find((u) => u.sigla === sigla).id;
    db.itens = itens.map((it, i) => {
      const fab = marca(it[3]);
      return Object.assign(meta(i + 1, -500 + i * 6), {
        codigoProvisorio: 'P' + String(2020100 + i * 17), tuss: String(70300000 + i * 4217 + 13).slice(0, 8), descricao: it[0],
        grupo: it[1], subgrupo: it[2], unidadeNegocio: 1, umCompra: um(it[5]), umConsulta: um(it[5]),
        origem: db.marcas.find((m) => m.id === fab).procedencia, status: 'Ativo',
        inspecao: i % 4 === 0 ? 'sim' : 'nao', avaliacao: 'sim', critico: it[4] > 20000 ? 'sim' : 'nao',
        reutilizavel: 'nao', reutilizacoes: '', reesterilizacao: 'nao',
        fabricante: fab, refFabricante: it[3].slice(0, 2).toUpperCase() + '-' + (1040 + i * 31), anvisa: String(80145900000 + i * 70313).slice(0, 11),
        validadeAnvisa: i === 19 ? dia(-45) : dia(300 + i * 40),
        especialidades: espDe[it[2]], procedimentos: procDe[it[2]],
        fornecedores: db.fornecedores.filter((f) => f.marcas.indexOf(fab) >= 0).map((f) => f.id),
        precoBase: it[4]
      });
    });

    // Tabelas de valores: cada hospital e fornecedor tem preços para parte do catálogo.
    db.precos = [];
    let pid = 0;
    const responsaveis = ['Renata Scott', 'Renan Rocha', 'Juliana Prado'];
    function preco(tipo, orgId, item, fator, situacaoForcada) {
      pid += 1;
      const valor = redondo(item.precoBase * fator);
      const inicio = dia(-Math.round(entre(60, 400)));
      let situacao = 'Vigente';
      let fim = '';
      const sorteio = rnd();
      if (situacaoForcada) situacao = situacaoForcada;
      else if (sorteio < .1) situacao = 'Suspenso';
      else if (sorteio < .22) situacao = 'Em negociação';
      if (situacao === 'Vigente' && sorteio > .955) fim = dia(Math.round(entre(5, 28)));
      if (situacao === 'Vigente' && sorteio > .83 && sorteio <= .88) fim = dia(-Math.round(entre(5, 60)));
      const inicial = redondo(valor * entre(1.08, 1.25));
      const contra = redondo(valor * entre(.9, .97));
      const origemOrg = tipo === 'hospital' ? 'Hospital' : 'Fornecedor';
      const quem = responsaveis[pid % 3];
      const propostas = [
        { data: O.somaDias(inicio, -20), condicao: 'Proposta inicial', origem: origemOrg, valor: inicial, responsavel: quem, resposta: 'Contraproposta' },
        { data: O.somaDias(inicio, -14), condicao: 'Contraproposta', origem: 'Operadora', valor: contra, responsavel: quem, resposta: situacao === 'Em negociação' ? '' : 'Contraproposta' }
      ];
      if (situacao !== 'Em negociação') {
        propostas.push({ data: O.somaDias(inicio, -6), condicao: 'Contraproposta', origem: origemOrg, valor, responsavel: quem, resposta: 'Aceita' });
      }
      return {
        id: pid, tipo, orgId, itemId: item.id, codigoInterno: String(100000 + pid * 37), valor: situacao === 'Em negociação' ? contra : valor,
        inicio, fim, situacao, propostas, alteradoEm: quando(-Math.round(entre(1, 50))), alteradoPor: quem
      };
    }
    db.hospitais.forEach((hsp, hi) => {
      if (hsp.status !== 'Ativo') return;
      const foco = { 2: 'Ortopedia', 4: 'Cardiologia', 7: 'Oftalmologia' }[hi];
      db.itens.forEach((it, ii) => {
        if (foco && it.subgrupo !== foco && it.subgrupo !== 'Cirurgia geral') return;
        if (!foco && (ii + hi) % 3 === 0) return;
        db.precos.push(preco('hospital', hsp.id, it, entre(1.08, 1.42)));
      });
    });
    db.fornecedores.forEach((f) => {
      if (f.status !== 'Ativo') return;
      db.itens.filter((it) => f.marcas.indexOf(it.fabricante) >= 0).forEach((it) => {
        db.precos.push(preco('fornecedor', f.id, it, entre(.84, 1.04)));
      });
    });

    // Solicitações de compra em vários momentos do fluxo.
    const pacientes = [
      ['Maria Aparecida Lopes', '0081234500012'], ['João Batista Moreira', '0081234500029'], ['Ana Cláudia Ferraz', '0081234500036'],
      ['Carlos Eduardo Reis', '0081234500043'], ['Luiza Martins', '0081234500050'], ['Sebastião Pereira', '0081234500067'],
      ['Helena Duarte', '0081234500074'], ['Roberto Campos', '0081234500081']
    ];
    const medicos = [['Dra. Fernanda Lacerda', '128734', 'SP'], ['Dr. Paulo Henrique Viana', '54321', 'RJ'], ['Dr. Ricardo Mota', '43210', 'MG'], ['Dra. Simone Azevedo', '38475', 'RS'], ['Dr. Tiago Brandão', '29384', 'PR']];
    const cenarios = [
      { h: 1, proc: ['30725020'], cid: 'M16.1', itens: [[4, 1], [2, 4]], status: 'Em negociação', prioridade: 'Eletiva', dias: -3 },
      { h: 5, proc: ['30912032'], cid: 'I25.1', itens: [[9, 2], [11, 2], [12, 1]], status: 'Em aprovação', prioridade: 'Urgente', dias: -1 },
      { h: 3, proc: ['30726026'], cid: 'M17.1', itens: [[5, 1]], status: 'Aprovada', prioridade: 'Eletiva', dias: -24 },
      { h: 2, proc: ['30602050'], cid: 'C50.9', itens: [[15, 1]], status: 'Em negociação', prioridade: 'Eletiva', dias: -6 },
      { h: 4, proc: ['30731018'], cid: 'M51.1', itens: [[7, 2], [8, 4]], status: 'Em aprovação', prioridade: 'Eletiva', dias: -9 },
      { h: 5, proc: ['30904021'], cid: 'I44.2', itens: [[13, 1], [12, 1]], status: 'Aprovada', prioridade: 'Urgente', dias: -15 },
      { h: 8, proc: ['30310076'], cid: 'H25.9', itens: [[19, 2]], status: 'Reprovada', prioridade: 'Eletiva', dias: -32 },
      { h: 6, proc: ['30715016'], cid: 'S72.0', itens: [[3, 1], [2, 6]], status: 'Rascunho', prioridade: 'Urgente', dias: 0 }
    ];
    db.solicitacoes = cenarios.map((c, i) => {
      const med = medicos[i % medicos.length];
      const pac = pacientes[i];
      const data = dia(c.dias);
      const itensSol = c.itens.map((par) => {
        const item = db.itens[par[0] - 1];
        const tab = db.precos.find((p) => p.tipo === 'hospital' && p.orgId === c.h && p.itemId === item.id && p.situacao === 'Vigente');
        const forn = db.precos.filter((p) => p.tipo === 'fornecedor' && p.itemId === item.id && p.situacao !== 'Suspenso').map((p) => p.valor);
        const valorHospital = tab ? tab.valor : redondo(item.precoBase * 1.45);
        const referencia = forn.length ? Math.min.apply(null, forn) : redondo(item.precoBase);
        const valorOperadora = redondo(Math.min(valorHospital, referencia * 1.12));
        const negociacao = [{ data: quando(c.dias, '09:10'), origem: 'Hospital', condicao: 'Proposta inicial', valor: valorHospital, nota: tab ? 'Valor da tabela vigente do hospital.' : '', responsavel: 'Renan Rocha' }];
        let situacao = 'Pendente';
        let valorAcordado = null;
        if (c.status !== 'Rascunho') {
          negociacao.push({ data: quando(c.dias, '11:40'), origem: 'Operadora', condicao: 'Contraproposta', valor: valorOperadora, nota: 'Baseado no menor valor entre fornecedores.', responsavel: 'Renan Rocha' });
          situacao = 'Em negociação';
        }
        if (['Em aprovação', 'Aprovada', 'Reprovada'].indexOf(c.status) >= 0 || (c.status === 'Em negociação' && par === c.itens[c.itens.length - 1] && c.itens.length > 1)) {
          valorAcordado = redondo(Math.min(valorHospital, valorOperadora * 1.03));
          negociacao.push({ data: quando(c.dias + 1, '15:20'), origem: 'Hospital', condicao: 'Aceite', valor: valorAcordado, nota: 'Hospital aceitou o valor.', responsavel: 'Renan Rocha' });
          situacao = 'Acordado';
        }
        if (c.status === 'Aprovada') situacao = 'Aprovado';
        if (c.status === 'Reprovada') situacao = 'Reprovado';
        return { itemId: item.id, quantidade: par[1], valorHospital, valorOperadora, valorAcordado, situacao, negociacao, motivoReprovacao: c.status === 'Reprovada' ? 'Procedimento sem cobertura contratual para lente multifocal.' : '' };
      });
      const hist = [{ quando: quando(c.dias, '09:00'), quem: 'Renan Rocha', acao: 'Solicitação registrada' }];
      if (c.status !== 'Rascunho') hist.push({ quando: quando(c.dias, '11:40'), quem: 'Renan Rocha', acao: 'Negociação iniciada com o hospital' });
      if (['Em aprovação', 'Aprovada', 'Reprovada'].indexOf(c.status) >= 0) hist.push({ quando: quando(c.dias + 1, '15:30'), quem: 'Renan Rocha', acao: 'Enviada para aprovação' });
      if (c.status === 'Aprovada') hist.push({ quando: quando(c.dias + 2, '10:00'), quem: 'Marcos Teixeira', acao: 'Itens aprovados' });
      if (c.status === 'Reprovada') hist.push({ quando: quando(c.dias + 2, '10:00'), quem: 'Marcos Teixeira', acao: 'Itens reprovados' });
      return {
        id: i + 1,
        numero: 'SC-' + String(10231 + i).padStart(6, '0'),
        hospitalId: c.h,
        numeroHospital: 'HSP-' + (7700 + i * 13),
        data,
        dataCirurgia: dia(c.dias + 12 + i),
        unidadeOrigem: 1,
        prioridade: c.prioridade,
        especialidade: { 'Ortopedia': 'ORT', 'Neurocirurgia': 'NEU', 'Cardiologia': 'CAR', 'Plástica': 'PLA', 'Oftalmologia': 'OFT' }[db.itens[c.itens[0][0] - 1].subgrupo] || 'GER',
        medicoNome: med[0], medicoCrm: med[1], medicoUf: med[2], medicoTelefone: '(11) 9' + (7300 + i * 41) + '-' + (1200 + i * 77),
        motivo: 'Nova solicitação', vinculada: '',
        pacienteNome: pac[0], pacienteCarteira: pac[1], senha: String(88310000 + i * 1379),
        cid: c.cid, procedimentos: c.proc, diretoria: false, observacoes: '',
        itens: itensSol,
        status: c.status,
        criadoPor: 'Renan Rocha',
        historico: hist
      };
    });

    db.contador = { solicitacao: 10231 + cenarios.length };
    return db;
  }

  /* ------------------------------------------------------------- Banco */

  let cache = null;
  function carregar() {
    if (cache) return cache;
    const salvo = O.store.get('db', null);
    cache = salvo && salvo.versao === VERSAO ? salvo : seed();
    if (!salvo || salvo.versao !== VERSAO) O.store.set('db', cache);
    return cache;
  }
  function persistir() { O.store.set('db', cache); }

  function agora() { return new Date().toISOString(); }

  const db = {
    all(col) { return carregar()[col] || []; },
    get(col, id) { return db.all(col).find((r) => r.id === Number(id)) || null; },
    // Grava o registro e anota quem/quando no histórico.
    save(col, rec, acao) {
      const lista = carregar()[col];
      const u = O.usuario();
      const quem = u ? u.nome : 'Sistema';
      const quando = agora();
      if (!rec.id) {
        rec.id = lista.reduce((m, r) => Math.max(m, r.id), 0) + 1;
        rec.codigo = cod(rec.id);
        rec.criadoEm = quando;
        rec.criadoPor = quem;
        rec.historico = [];
        lista.push(rec);
      } else {
        const i = lista.findIndex((r) => r.id === rec.id);
        if (i >= 0) lista[i] = rec; else lista.push(rec);
      }
      rec.alteradoEm = quando;
      rec.alteradoPor = quem;
      if (!rec.historico) rec.historico = [];
      rec.historico.push({ quando, quem, acao: acao || 'Cadastro alterado' });
      persistir();
      return rec;
    },
    remove(col, id) {
      const c = carregar();
      c[col] = c[col].filter((r) => r.id !== Number(id));
      persistir();
    },
    commit: persistir,
    nextNumero() {
      const c = carregar();
      c.contador.solicitacao += 1;
      persistir();
      return 'SC-' + String(c.contador.solicitacao).padStart(6, '0');
    },
    reset() {
      cache = seed();
      persistir();
    }
  };

  /* ------------------------------------------------- Consultas auxiliares */

  const nome = {
    hospital: (id) => { const r = db.get('hospitais', id); return r ? r.nomeFantasia : ''; },
    fornecedor: (id) => { const r = db.get('fornecedores', id); return r ? r.nomeFantasia : ''; },
    marca: (id) => { const r = db.get('marcas', id); return r ? r.nome : ''; },
    item: (id) => { const r = db.get('itens', id); return r ? r.descricao : ''; },
    grupo: (id) => { const r = db.get('grupos', id); return r ? r.nome : ''; },
    unidadeNegocio: (id) => { const r = db.get('unidadesNegocio', id); return r ? r.nome : ''; },
    unidadeMedida: (id) => { const r = db.get('unidadesMedida', id); return r ? r.sigla : ''; },
    especialidade: (v) => { const r = ESPECIALIDADES.find((e) => e.value === v); return r ? r.label : v; },
    procedimento: (v) => { const r = PROCEDIMENTOS.find((e) => e.value === v); return r ? r.label : v; },
    cid: (v) => { const r = CIDS.find((e) => e.value === v); return r ? r.label : v; }
  };

  // Situação efetiva de um preço: vigente com data de fim no passado conta como vencido.
  function situacaoPreco(p) {
    if (p.situacao === 'Vigente' && p.fim && p.fim < O.hoje()) return 'Vencido';
    return p.situacao;
  }

  // Totais de uma solicitação: pedido pelo hospital, contraproposta e acordado.
  function totaisSolicitacao(s) {
    const t = { qtd: 0, hospital: 0, operadora: 0, acordado: 0, hospitalAcordados: 0, aprovado: 0 };
    s.itens.forEach((i) => {
      t.qtd += i.quantidade;
      t.hospital += i.valorHospital * i.quantidade;
      t.operadora += (i.valorOperadora || i.valorHospital) * i.quantidade;
      if (i.valorAcordado && i.situacao !== 'Reprovado') {
        t.acordado += i.valorAcordado * i.quantidade;
        t.hospitalAcordados += i.valorHospital * i.quantidade;
      }
      if (i.situacao === 'Aprovado') t.aprovado += i.valorAcordado * i.quantidade;
    });
    t.economia = t.hospitalAcordados - t.acordado;
    return t;
  }

  /* ------------------------------------------------- Esquemas dos cadastros */

  const opcoesRef = (col, rotuloFn, soAtivos) => () => db.all(col)
    .filter((r) => !soAtivos || r.status === 'Ativo')
    .map((r) => ({ value: String(r.id), label: rotuloFn(r) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const C = {
    status: { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS, required: true, span: 4, padrao: 'Ativo' },
    observacoes: { key: 'observacoes', label: 'Observações', tipo: 'textarea', max: 600, opcional: true, dica: 'Informações que ajudam o time, até 600 caracteres.' }
  };

  const colStatus = { key: 'status', label: 'Status', sort: true, render: (r) => O.statusBadge(r.status) };

  const schemas = {
    hospitais: {
      titulo: 'Hospitais e clínicas',
      singular: 'hospital ou clínica',
      novo: 'Novo hospital ou clínica',
      descricao: 'Quem pede os materiais. A tabela de valores de cada um fica em Tabelas de valores.',
      icone: 'hospital',
      nomeRegistro: (r) => r.nomeFantasia,
      unico: [{ key: 'cnpj', msg: 'Já existe um hospital ou clínica com esse CNPJ.' }],
      secoes: [
        {
          titulo: 'Dados gerais',
          campos: [
            { key: 'cnpj', label: 'CNPJ', required: true, rules: 'cnpj', mask: 'cnpj', inputmode: 'numeric', max: 18, span: 4 },
            { key: 'inscricaoEstadual', label: 'Inscrição estadual', mask: 'digits', inputmode: 'numeric', max: 14, span: 4, opcional: true },
            { key: 'tipo', label: 'Tipo', tipo: 'select', opcoes: ['Hospital', 'Clínica', 'Day hospital'], required: true, span: 4 },
            { key: 'razaoSocial', label: 'Razão social', required: true, max: 120, span: 6 },
            { key: 'nomeFantasia', label: 'Nome fantasia', required: true, max: 80, span: 6, dica: 'É o nome que aparece nas telas.' },
            { key: 'unidadeNegocio', label: 'Unidade de negócio', tipo: 'select', ref: opcoesRef('unidadesNegocio', (r) => r.nome, true), required: true, span: 6, numero: true },
            Object.assign({}, C.status, { span: 6 }),
            C.observacoes
          ]
        },
        { titulo: 'Endereço', campos: [{ key: 'endereco', tipo: 'endereco' }] },
        {
          titulo: 'Entrega dos materiais',
          campos: [
            { key: 'entregaMesmoEndereco', label: 'A entrega é no mesmo endereço?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não, é em outro lugar' }], required: true, padrao: 'sim' },
            { key: 'entrega', tipo: 'endereco', showIf: { key: 'entregaMesmoEndereco', value: 'nao' } }
          ]
        },
        { titulo: 'Contatos', dica: 'Quem o time de OPME procura para falar sobre pedidos e entregas.', campos: [{ key: 'contatos', tipo: 'contatos' }] }
      ],
      filtros: [
        { key: 'nome', label: 'Nome ou razão social', tipo: 'text', match: (r, v) => O.normaliza(r.nomeFantasia + ' ' + r.razaoSocial).indexOf(O.normaliza(v)) >= 0 },
        { key: 'cnpj', label: 'CNPJ', tipo: 'text', mask: 'cnpj', match: (r, v) => O.digitos(r.cnpj).indexOf(O.digitos(v)) >= 0 },
        { key: 'uf', label: 'UF', tipo: 'select', opcoes: UFS, match: (r, v) => r.endereco && r.endereco.uf === v },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nomeFantasia', label: 'Hospital ou clínica', sort: true, link: true, sub: (r) => r.razaoSocial },
        { key: 'cnpj', label: 'CNPJ', sort: true, class: 'nowrap' },
        { key: 'tipo', label: 'Tipo', sort: true },
        { key: 'cidade', label: 'Cidade', sort: (r) => r.endereco.cidade, render: (r) => r.endereco.cidade + '/' + r.endereco.uf, csv: (r) => r.endereco.cidade + '/' + r.endereco.uf },
        colStatus
      ],
      emUso: (id) => {
        const n = db.all('solicitacoes').filter((s) => s.hospitalId === id).length + db.all('precos').filter((p) => p.tipo === 'hospital' && p.orgId === id).length;
        return n ? 'Esse hospital tem solicitações e uma tabela de valores ligadas a ele. Para tirar de uso, mude o status para Inativo.' : '';
      }
    },

    fornecedores: {
      titulo: 'Fornecedores',
      singular: 'fornecedor',
      novo: 'Novo fornecedor',
      descricao: 'Distribuidores que vendem OPME para a operadora ou para a rede.',
      icone: 'truck',
      nomeRegistro: (r) => r.nomeFantasia,
      unico: [{ key: 'cnpj', msg: 'Já existe um fornecedor com esse CNPJ.' }],
      secoes: [
        {
          titulo: 'Dados gerais',
          campos: [
            { key: 'cnpj', label: 'CNPJ', required: true, rules: 'cnpj', mask: 'cnpj', inputmode: 'numeric', max: 18, span: 4 },
            { key: 'inscricaoEstadual', label: 'Inscrição estadual', mask: 'digits', inputmode: 'numeric', max: 14, span: 4, opcional: true },
            { key: 'inscricaoMunicipal', label: 'Inscrição municipal', mask: 'digits', inputmode: 'numeric', max: 14, span: 4, opcional: true },
            { key: 'razaoSocial', label: 'Razão social', required: true, max: 120, span: 6 },
            { key: 'nomeFantasia', label: 'Nome fantasia', required: true, max: 80, span: 6 },
            { key: 'procedencia', label: 'Procedência', tipo: 'select', opcoes: ['Nacional', 'Importado'], required: true, span: 6 },
            Object.assign({}, C.status, { span: 6 })
          ]
        },
        { titulo: 'Endereço', campos: [{ key: 'endereco', tipo: 'endereco' }] },
        {
          titulo: 'Condições comerciais',
          campos: [
            { key: 'grupo', label: 'Grupo de fornecedor', tipo: 'select', opcoes: ['OPME', 'Materiais especiais', 'Medicamentos'], required: true, span: 4 },
            { key: 'condicaoPagamento', label: 'Condição de pagamento', tipo: 'select', opcoes: ['À vista, conforme cronograma', 'Em conta, via hospital ou clínica', '30 dias', '60 dias'], required: true, span: 4 },
            { key: 'frete', label: 'Frete', tipo: 'select', opcoes: [{ value: 'CIF', label: 'CIF (por conta do fornecedor)' }, { value: 'FOB', label: 'FOB (por conta de quem compra)' }], required: true, span: 4 },
            { key: 'processoAvaliacao', label: 'Passou pelo processo de avaliação?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'relacaoComercial', label: 'Já tem relação comercial?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'matrizFilial', label: 'É matriz ou filial?', tipo: 'radio', opcoes: ['Matriz', 'Filial'], required: true, span: 4, padrao: 'Matriz' },
            C.observacoes
          ]
        },
        { titulo: 'Marcas e fabricantes', dica: 'Marque o que esse fornecedor distribui. Isso alimenta a lista de fornecedores de cada item.', campos: [{ key: 'marcas', tipo: 'checklist', ref: opcoesRef('marcas', (r) => r.nome + ' (' + r.procedencia.toLowerCase() + ')', true), label: 'Marcas e fabricantes distribuídos', numero: true }] },
        { titulo: 'Contatos', campos: [{ key: 'contatos', tipo: 'contatos' }] }
      ],
      filtros: [
        { key: 'nome', label: 'Nome ou razão social', tipo: 'text', match: (r, v) => O.normaliza(r.nomeFantasia + ' ' + r.razaoSocial).indexOf(O.normaliza(v)) >= 0 },
        { key: 'cnpj', label: 'CNPJ', tipo: 'text', mask: 'cnpj', match: (r, v) => O.digitos(r.cnpj).indexOf(O.digitos(v)) >= 0 },
        { key: 'procedencia', label: 'Procedência', tipo: 'select', opcoes: ['Nacional', 'Importado'] },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nomeFantasia', label: 'Fornecedor', sort: true, link: true, sub: (r) => r.razaoSocial },
        { key: 'cnpj', label: 'CNPJ', sort: true, class: 'nowrap' },
        { key: 'procedencia', label: 'Procedência', sort: true },
        { key: 'marcas', label: 'Marcas', sort: (r) => r.marcas.length, render: (r) => r.marcas.map(nome.marca).join(', '), csv: (r) => r.marcas.map(nome.marca).join(', ') },
        colStatus
      ],
      emUso: (id) => db.all('precos').some((p) => p.tipo === 'fornecedor' && p.orgId === id)
        ? 'Esse fornecedor tem uma tabela de valores. Para tirar de uso, mude o status para Inativo.' : ''
    },

    itens: {
      titulo: 'Itens OPME',
      singular: 'item',
      novo: 'Novo item',
      descricao: 'Catálogo de órteses, próteses e materiais especiais, com códigos TUSS e registro na Anvisa.',
      icone: 'package',
      nomeRegistro: (r) => r.descricao,
      unico: [{ key: 'codigoProvisorio', msg: 'Já existe um item com esse código provisório.' }],
      secoes: [
        {
          titulo: 'Características',
          campos: [
            { key: 'descricao', label: 'Descrição do item', required: true, max: 140, span: 8 },
            { key: 'codigoProvisorio', label: 'Código provisório', required: true, max: 12, span: 4, mask: 'upper', dica: 'Usado enquanto o item não tem código TUSS.' },
            { key: 'tuss', label: 'Código TUSS', rules: 'tuss', mask: 'digits', inputmode: 'numeric', max: 8, span: 4, opcional: true },
            { key: 'grupo', label: 'Grupo', tipo: 'select', opcoes: ['Órtese', 'Prótese', 'Material especial'], required: true, span: 4 },
            { key: 'subgrupo', label: 'Subgrupo', tipo: 'select', opcoes: SUBGRUPOS, required: true, span: 4 },
            { key: 'unidadeNegocio', label: 'Unidade de negócio', tipo: 'select', ref: opcoesRef('unidadesNegocio', (r) => r.nome, true), required: true, span: 4, numero: true },
            { key: 'umCompra', label: 'Unidade para compra', tipo: 'select', ref: opcoesRef('unidadesMedida', (r) => r.sigla + ' · ' + r.descricao, true), required: true, span: 4, numero: true },
            { key: 'umConsulta', label: 'Unidade para consulta', tipo: 'select', ref: opcoesRef('unidadesMedida', (r) => r.sigla + ' · ' + r.descricao, true), required: true, span: 4, numero: true },
            { key: 'origem', label: 'Origem', tipo: 'select', opcoes: ['Nacional', 'Importado'], required: true, span: 6 },
            Object.assign({}, C.status, { span: 6 })
          ]
        },
        {
          titulo: 'Regras de uso',
          campos: [
            { key: 'inspecao', label: 'Exige inspeção no recebimento?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'avaliacao', label: 'Passa por avaliação técnica?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'critico', label: 'É um item crítico?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'reesterilizacao', label: 'Pode ser reesterilizado?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'reutilizavel', label: 'É reutilizável?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }], required: true, span: 4, padrao: 'nao' },
            { key: 'reutilizacoes', label: 'Quantas vezes pode ser reutilizado?', tipo: 'number', min: 1, max: 3, inputmode: 'numeric', required: true, span: 4, showIf: { key: 'reutilizavel', value: 'sim' } }
          ]
        },
        {
          titulo: 'Fabricante e Anvisa',
          campos: [
            { key: 'fabricante', label: 'Fabricante', tipo: 'select', ref: opcoesRef('marcas', (r) => r.nome, true), required: true, span: 6, numero: true },
            { key: 'refFabricante', label: 'Referência do item no fabricante', required: true, max: 30, span: 6, mask: 'upper' },
            { key: 'anvisa', label: 'Registro na Anvisa', required: true, rules: 'anvisa', mask: 'digits', inputmode: 'numeric', max: 11, span: 6 },
            { key: 'validadeAnvisa', label: 'Validade do registro', tipo: 'date', required: true, span: 6 }
          ]
        },
        { titulo: 'Especialidades', dica: 'Em quais especialidades esse item costuma ser usado.', campos: [{ key: 'especialidades', tipo: 'checklist', opcoes: ESPECIALIDADES, label: 'Especialidades' }] },
        { titulo: 'Procedimentos', campos: [{ key: 'procedimentos', tipo: 'checklist', opcoes: PROCEDIMENTOS, label: 'Procedimentos' }] },
        { titulo: 'Fornecedores', dica: 'Quem pode fornecer esse item.', campos: [{ key: 'fornecedores', tipo: 'checklist', ref: opcoesRef('fornecedores', (r) => r.nomeFantasia, true), label: 'Fornecedores', numero: true }] },
        { titulo: 'Valores tabelados', somenteEdicao: true, campos: [{ key: 'valores', tipo: 'valoresItem' }] }
      ],
      filtros: [
        { key: 'descricao', label: 'Descrição', tipo: 'text' },
        { key: 'tuss', label: 'Código TUSS', tipo: 'text', mask: 'digits', inputmode: 'numeric', max: 8 },
        { key: 'anvisa', label: 'Registro Anvisa', tipo: 'text', mask: 'digits', inputmode: 'numeric', max: 11 },
        { key: 'codigoProvisorio', label: 'Código provisório', tipo: 'text' },
        { key: 'refFabricante', label: 'Ref. do fabricante', tipo: 'text' },
        { key: 'fabricante', label: 'Fabricante', tipo: 'select', ref: opcoesRef('marcas', (r) => r.nome), numero: true },
        { key: 'subgrupo', label: 'Subgrupo', tipo: 'select', opcoes: SUBGRUPOS },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'descricao', label: 'Item', sort: true, link: true, sub: (r) => nome.marca(r.fabricante) + ' · ref. ' + r.refFabricante },
        { key: 'tuss', label: 'TUSS', sort: true, class: 'nowrap', render: (r) => r.tuss || 'Sem TUSS' },
        { key: 'anvisa', label: 'Anvisa', sort: true, class: 'nowrap', render: (r) => {
          const vencido = r.validadeAnvisa && r.validadeAnvisa < O.hoje();
          return O.h('span', null, r.anvisa, vencido ? O.h('span', { class: 'cell-sub' }, O.badge('Registro vencido', 'danger')) : null);
        } },
        { key: 'subgrupo', label: 'Subgrupo', sort: true },
        colStatus
      ],
      emUso: (id) => {
        const n = db.all('solicitacoes').filter((s) => s.itens.some((i) => i.itemId === id)).length;
        return n ? 'Esse item aparece em ' + O.fmt.plural(n, 'solicitação', 'solicitações') + '. Para tirar de uso, mude o status para Inativo.' : '';
      }
    },

    marcas: {
      titulo: 'Marcas e fabricantes',
      singular: 'marca ou fabricante',
      novo: 'Nova marca ou fabricante',
      descricao: 'Quem fabrica os itens do catálogo.',
      icone: 'tag',
      nomeRegistro: (r) => r.nome,
      parecidos: true,
      secoes: [{
        titulo: 'Dados da marca',
        campos: [
          { key: 'nome', label: 'Nome', required: true, max: 80, span: 4 },
          { key: 'procedencia', label: 'Procedência', tipo: 'select', opcoes: ['Nacional', 'Importado'], required: true, span: 4 },
          C.status,
          C.observacoes
        ]
      }],
      filtros: [
        { key: 'nome', label: 'Nome', tipo: 'text' },
        { key: 'procedencia', label: 'Procedência', tipo: 'select', opcoes: ['Nacional', 'Importado'] },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Marca ou fabricante', sort: true, link: true },
        { key: 'codigo', label: 'Código', sort: true },
        { key: 'procedencia', label: 'Procedência', sort: true },
        { key: 'itens', label: 'Itens no catálogo', num: true, sort: (r) => db.all('itens').filter((i) => i.fabricante === r.id).length, render: (r) => String(db.all('itens').filter((i) => i.fabricante === r.id).length), csv: (r) => db.all('itens').filter((i) => i.fabricante === r.id).length },
        colStatus
      ],
      emUso: (id) => {
        const n = db.all('itens').filter((i) => i.fabricante === id).length;
        return n ? 'Esse fabricante está ligado a ' + O.fmt.plural(n, 'item', 'itens') + ' do catálogo. Para tirar de uso, mude o status para Inativo.' : '';
      }
    },

    unidadesMedida: {
      titulo: 'Unidades de medida',
      singular: 'unidade de medida',
      novo: 'Nova unidade de medida',
      descricao: 'Como os itens são comprados e consultados: unidade, caixa, kit e outras.',
      icone: 'ruler',
      nomeRegistro: (r) => r.sigla + ' (' + r.descricao + ')',
      unico: [{ key: 'sigla', msg: 'Já existe uma unidade de medida com essa sigla.', normaliza: true }],
      secoes: [{
        titulo: 'Dados da unidade',
        campos: [
          { key: 'sigla', label: 'Sigla', required: true, max: 5, span: 4, mask: 'upper', dica: 'Até 5 letras, como UND ou CX.' },
          { key: 'descricao', label: 'Descrição', required: true, max: 40, span: 4 },
          C.status
        ]
      }],
      filtros: [
        { key: 'sigla', label: 'Sigla', tipo: 'text' },
        { key: 'descricao', label: 'Descrição', tipo: 'text' },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'sigla', label: 'Sigla', sort: true, link: true },
        { key: 'descricao', label: 'Descrição', sort: true },
        { key: 'criadoEm', label: 'Incluída em', sort: true, render: (r) => O.fmt.date(r.criadoEm), csv: (r) => O.fmt.date(r.criadoEm) },
        { key: 'criadoPor', label: 'Incluída por', sort: true },
        colStatus
      ],
      emUso: (id) => db.all('itens').some((i) => i.umCompra === id || i.umConsulta === id)
        ? 'Essa unidade é usada por itens do catálogo. Para tirar de uso, mude o status para Inativo.' : ''
    },

    unidadesNegocio: {
      titulo: 'Unidades de negócio',
      singular: 'unidade de negócio',
      novo: 'Nova unidade de negócio',
      descricao: 'Empresas do grupo que originam as solicitações e prestadoras ligadas a elas.',
      icone: 'briefcase',
      nomeRegistro: (r) => r.nome,
      secoes: [
        {
          titulo: 'Dados gerais',
          campos: [
            { key: 'tipo', label: 'Tipo', tipo: 'select', opcoes: [{ value: 'Origem', label: 'Origem (operadora)' }, { value: 'Prestador', label: 'Prestador' }], required: true, span: 4 },
            { key: 'nome', label: 'Nome', required: true, max: 80, span: 8 },
            { key: 'cnpj', label: 'CNPJ', required: true, rules: 'cnpj', mask: 'cnpj', inputmode: 'numeric', max: 18, span: 4 },
            { key: 'terminoContrato', label: 'Fim do contrato', tipo: 'date', span: 4, opcional: true },
            C.status,
            C.observacoes
          ]
        },
        { titulo: 'Endereço', campos: [{ key: 'endereco', tipo: 'endereco' }] },
        {
          titulo: 'Entrega',
          campos: [
            { key: 'entregaMesmoEndereco', label: 'A entrega é no mesmo endereço?', tipo: 'radio', opcoes: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não, é em outro lugar' }], required: true, padrao: 'sim' },
            { key: 'entrega', tipo: 'endereco', showIf: { key: 'entregaMesmoEndereco', value: 'nao' } }
          ]
        },
        { titulo: 'Contatos', campos: [{ key: 'contatos', tipo: 'contatos' }] }
      ],
      filtros: [
        { key: 'nome', label: 'Nome', tipo: 'text' },
        { key: 'cnpj', label: 'CNPJ', tipo: 'text', mask: 'cnpj', match: (r, v) => O.digitos(r.cnpj).indexOf(O.digitos(v)) >= 0 },
        { key: 'tipo', label: 'Tipo', tipo: 'select', opcoes: ['Origem', 'Prestador'] },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Unidade', sort: true, link: true },
        { key: 'tipo', label: 'Tipo', sort: true },
        { key: 'cnpj', label: 'CNPJ', sort: true, class: 'nowrap' },
        { key: 'alteradoPor', label: 'Última alteração', sort: true, render: (r) => O.h('span', null, r.alteradoPor, O.h('span', { class: 'cell-sub', text: O.fmt.date(r.alteradoEm) })), csv: (r) => r.alteradoPor + ' em ' + O.fmt.date(r.alteradoEm) },
        colStatus
      ],
      emUso: (id) => db.all('hospitais').some((x) => x.unidadeNegocio === id) || db.all('itens').some((x) => x.unidadeNegocio === id)
        ? 'Essa unidade está ligada a hospitais ou itens. Para tirar de uso, mude o status para Inativo.' : ''
    },

    usuarios: {
      titulo: 'Usuários',
      singular: 'usuário',
      novo: 'Novo usuário',
      descricao: 'Pessoas que acessam o sistema e o grupo que define o que cada uma pode fazer.',
      icone: 'user',
      nomeRegistro: (r) => r.nome,
      unico: [{ key: 'matricula', msg: 'Já existe um usuário com essa matrícula.' }, { key: 'email', msg: 'Já existe um usuário com esse e-mail.', normaliza: true }],
      secoes: [{
        titulo: 'Dados do usuário',
        campos: [
          { key: 'matricula', label: 'Matrícula', required: true, rules: 'matricula', mask: 'upper', max: 7, span: 4, dica: 'Uma letra e 6 números, como G754632.' },
          { key: 'nome', label: 'Nome completo', required: true, max: 80, span: 8, autocomplete: 'off' },
          { key: 'email', label: 'E-mail corporativo', required: true, rules: 'email', tipo: 'email', max: 80, span: 6 },
          { key: 'grupo', label: 'Grupo de acesso', tipo: 'select', ref: opcoesRef('grupos', (r) => r.nome, true), required: true, span: 3, numero: true },
          Object.assign({}, C.status, { span: 3 })
        ]
      }],
      filtros: [
        { key: 'matricula', label: 'Matrícula', tipo: 'text', mask: 'upper' },
        { key: 'nome', label: 'Nome', tipo: 'text' },
        { key: 'grupo', label: 'Grupo de acesso', tipo: 'select', ref: opcoesRef('grupos', (r) => r.nome), numero: true },
        { key: 'tela', label: 'Tem acesso à tela', tipo: 'select', ref: opcoesRef('telas', (r) => r.nome, true), match: (r, v) => { const g = db.get('grupos', r.grupo); return !!(g && g.permissoes[v] && g.permissoes[v].length); } },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Nome', sort: true, link: true, sub: (r) => r.email },
        { key: 'matricula', label: 'Matrícula', sort: true },
        { key: 'grupo', label: 'Grupo', sort: (r) => nome.grupo(r.grupo), render: (r) => nome.grupo(r.grupo), csv: (r) => nome.grupo(r.grupo) },
        colStatus
      ]
    },

    grupos: {
      titulo: 'Grupos de acesso',
      singular: 'grupo de acesso',
      novo: 'Novo grupo de acesso',
      descricao: 'Defina quais telas cada grupo vê e o que pode fazer em cada uma.',
      icone: 'users',
      nomeRegistro: (r) => r.nome,
      unico: [{ key: 'nome', msg: 'Já existe um grupo com esse nome.', normaliza: true }],
      secoes: [
        {
          titulo: 'Dados do grupo',
          campos: [
            { key: 'nome', label: 'Nome do grupo', required: true, max: 60, span: 8 },
            C.status,
            { key: 'descricao', label: 'Para que serve', tipo: 'textarea', max: 300, opcional: true }
          ]
        },
        { titulo: 'Telas e permissões', dica: 'Marque o que o grupo pode fazer em cada tela. Quem não tem "Consultar" não vê a tela no menu.', campos: [{ key: 'permissoes', tipo: 'permissoes' }] }
      ],
      filtros: [
        { key: 'nome', label: 'Nome do grupo', tipo: 'text' },
        { key: 'tela', label: 'Tela', tipo: 'select', ref: opcoesRef('telas', (r) => r.nome, true), match: (r, v) => !!(r.permissoes[v] && r.permissoes[v].length) },
        { key: 'usuario', label: 'Usuário do grupo', tipo: 'text', match: (r, v) => db.all('usuarios').some((u) => u.grupo === r.id && O.normaliza(u.nome + ' ' + u.matricula).indexOf(O.normaliza(v)) >= 0) },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS },
        { key: 'semTelas', label: 'Mostrar só grupos sem nenhuma tela liberada', tipo: 'checkbox', match: (r) => !Object.keys(r.permissoes).some((k) => r.permissoes[k].length) }
      ],
      colunas: [
        { key: 'nome', label: 'Grupo', sort: true, link: true, sub: (r) => r.descricao },
        { key: 'telas', label: 'Telas liberadas', num: true, sort: (r) => Object.keys(r.permissoes).filter((k) => r.permissoes[k].length).length, render: (r) => String(Object.keys(r.permissoes).filter((k) => r.permissoes[k].length).length), csv: (r) => Object.keys(r.permissoes).filter((k) => r.permissoes[k].length).length },
        { key: 'usuarios', label: 'Usuários', num: true, sort: (r) => db.all('usuarios').filter((u) => u.grupo === r.id).length, render: (r) => String(db.all('usuarios').filter((u) => u.grupo === r.id).length), csv: (r) => db.all('usuarios').filter((u) => u.grupo === r.id).length },
        colStatus
      ],
      emUso: (id) => {
        const n = db.all('usuarios').filter((u) => u.grupo === id).length;
        return n ? 'Esse grupo tem ' + O.fmt.plural(n, 'usuário', 'usuários') + '. Mova essas pessoas para outro grupo antes de excluir.' : '';
      }
    },

    telas: {
      titulo: 'Telas do sistema',
      singular: 'tela',
      novo: 'Nova tela',
      descricao: 'As telas que podem ser liberadas nos grupos de acesso.',
      icone: 'layout',
      nomeRegistro: (r) => r.nome,
      unico: [{ key: 'caminho', msg: 'Já existe uma tela com esse endereço.' }],
      secoes: [{
        titulo: 'Dados da tela',
        campos: [
          { key: 'nome', label: 'Nome da tela', required: true, max: 60, span: 4 },
          { key: 'caminho', label: 'Endereço da tela', required: true, max: 120, span: 4, dica: 'Caminho dentro do sistema, como relatorio.html.', spellcheck: false },
          C.status,
          { key: 'descricao', label: 'Descrição', tipo: 'textarea', max: 300, opcional: true }
        ]
      }],
      filtros: [
        { key: 'nome', label: 'Nome da tela', tipo: 'text' },
        { key: 'caminho', label: 'Endereço', tipo: 'text' },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Tela', sort: true, link: true, sub: (r) => r.descricao },
        { key: 'codigo', label: 'Código', sort: true },
        { key: 'caminho', label: 'Endereço', sort: true, render: (r) => O.h('code', { text: r.caminho }) },
        colStatus
      ],
      emUso: (id) => db.all('grupos').some((g) => g.permissoes[id] && g.permissoes[id].length)
        ? 'Essa tela está liberada em grupos de acesso. Tire a permissão dos grupos ou mude o status para Inativo.' : ''
    }
  };

  Object.assign(window.OPME, {
    db, schemas, nome, situacaoPreco, totaisSolicitacao, UFS, STATUS, ESPECIALIDADES, PROCEDIMENTOS, CIDS, SUBGRUPOS
  });
})();
