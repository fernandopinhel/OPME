/* Gestão OPME: consulta de solicitações de compra. */
(function () {
  'use strict';

  const O = window.OPME;
  const h = O.h;
  const u = O.shell({
    ativo: 'solicitacoes',
    titulo: 'Solicitações de compra',
    migalhas: [{ label: 'Início', href: 'inicio.html' }, { label: 'Operação' }, { label: 'Solicitações de compra' }]
  });
  if (!u) return;

  const STATUS_SOL = ['Rascunho', 'Em negociação', 'Em aprovação', 'Aprovada', 'Parcialmente aprovada', 'Reprovada'];
  const ABERTAS = ['Rascunho', 'Em negociação', 'Em aprovação'];
  const destaque = O.store.get('destaque', null);
  O.store.remove('destaque');

  const salvos = O.store.get('filtros:solicitacoes', {});
  const daUrl = O.param('status');
  if (daUrl) {
    Object.keys(salvos).forEach((k) => { salvos[k] = ''; });
    salvos.status = daUrl;
  }

  const form = document.getElementById('filtros');
  form.setAttribute('aria-label', 'Filtrar solicitações');
  const grade = form.querySelector('.form-grid');
  const hospitais = O.db.all('hospitais').map((x) => ({ value: String(x.id), label: x.nomeFantasia })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  const campos = {
    numero: O.field({ id: 'filtro-numero', label: 'Número', span: 3, valor: salvos.numero, mask: 'upper', dica: 'Da operadora (SC-) ou do hospital.' }),
    paciente: O.field({ id: 'filtro-paciente', label: 'Paciente', span: 3, valor: salvos.paciente, dica: 'Nome ou carteirinha.' }),
    hospital: O.field({ id: 'filtro-hospital', label: 'Hospital ou clínica', tipo: 'select', opcoes: hospitais, vazio: 'Todos', span: 3, valor: salvos.hospital }),
    status: O.field({ id: 'filtro-status', label: 'Status', tipo: 'select', opcoes: [{ value: 'andamento', label: 'Em andamento (todas abertas)' }].concat(STATUS_SOL), vazio: 'Todos', span: 3, valor: salvos.status }),
    prioridade: O.field({ id: 'filtro-prioridade', label: 'Prioridade', tipo: 'select', opcoes: ['Urgente', 'Eletiva'], vazio: 'Todas', span: 4, valor: salvos.prioridade }),
    de: O.field({ id: 'filtro-de', label: 'Registradas a partir de', tipo: 'date', span: 4, valor: salvos.de }),
    ate: O.field({ id: 'filtro-ate', label: 'Registradas até', tipo: 'date', span: 4, valor: salvos.ate })
  };
  Object.keys(campos).forEach((k) => grade.appendChild(campos[k]));
  O.applyMasks(form);

  const val = () => Object.keys(campos).reduce((acc, k) => { acc[k] = campos[k].control.value.trim(); return acc; }, {});

  function filtra(v) {
    return O.db.all('solicitacoes').filter((s) => {
      if (v.numero && O.normaliza(s.numero + ' ' + s.numeroHospital).indexOf(O.normaliza(v.numero)) < 0) return false;
      if (v.paciente && O.normaliza(s.pacienteNome + ' ' + s.pacienteCarteira).indexOf(O.normaliza(v.paciente)) < 0) return false;
      if (v.hospital && String(s.hospitalId) !== v.hospital) return false;
      if (v.status === 'andamento' && ABERTAS.indexOf(s.status) < 0) return false;
      if (v.status && v.status !== 'andamento' && s.status !== v.status) return false;
      if (v.prioridade && s.prioridade !== v.prioridade) return false;
      if (v.de && s.data < v.de) return false;
      if (v.ate && s.data > v.ate) return false;
      return true;
    }).map((s) => Object.assign({}, s, { totais: O.totaisSolicitacao(s), hospital: O.nome.hospital(s.hospitalId) }));
  }

  const colunas = [
    { key: 'numero', label: 'Solicitação', sort: true, render: (s) => h('span', null, h('a', { class: 'row-link', href: 'solicitacao.html?id=' + s.id, text: s.numero }), h('span', { class: 'cell-sub', text: 'Hospital: ' + s.numeroHospital })) },
    { key: 'hospital', label: 'Hospital ou clínica', sort: true },
    { key: 'pacienteNome', label: 'Paciente', sort: true },
    { key: 'itens', label: 'Itens', num: true, sort: (s) => s.itens.length, render: (s) => String(s.itens.length), csv: (s) => s.itens.length },
    {
      key: 'valor', label: 'Valor', num: true, sort: (s) => s.totais.acordado || s.totais.hospital,
      render: (s) => h('span', null, O.fmt.money(s.totais.acordado || s.totais.hospital), h('span', { class: 'cell-sub', text: s.totais.acordado ? 'acordado' : 'pedido pelo hospital' })),
      csv: (s) => O.fmt.decimal(s.totais.acordado || s.totais.hospital)
    },
    { key: 'data', label: 'Registrada em', sort: true, render: (s) => O.fmt.date(s.data), csv: (s) => O.fmt.date(s.data) },
    { key: 'prioridade', label: 'Prioridade', sort: true, render: (s) => O.statusBadge(s.prioridade) },
    { key: 'status', label: 'Status', sort: (s) => STATUS_SOL.indexOf(s.status), render: (s) => O.statusBadge(s.status) }
  ];

  const contador = document.getElementById('resultado-total');
  const tabela = O.dataTable({
    container: document.getElementById('resultado'),
    columns: colunas,
    rows: [],
    caption: 'Solicitações de compra',
    rowKey: (s) => s.id,
    sortKey: 'data',
    sortDir: 'desc',
    highlight: (s) => destaque && destaque.tipo === 'solicitacoes' && destaque.id === s.id,
    emptyIcon: 'file',
    emptyTitle: 'Nenhuma solicitação com esses filtros',
    emptyText: 'Revise os filtros ou registre uma nova solicitação.'
  });

  function aplicar(anunciar) {
    const v = val();
    O.store.set('filtros:solicitacoes', v);
    const linhas = filtra(v);
    tabela.update(linhas);
    contador.textContent = O.fmt.plural(linhas.length, 'solicitação encontrada', 'solicitações encontradas');
    if (anunciar) O.announce(contador.textContent + '.');
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (campos.de.control.value && campos.ate.control.value && campos.de.control.value > campos.ate.control.value) {
      O.setErro(campos.ate.control, 'A data final precisa ser igual ou depois da inicial.');
      campos.ate.control.focus();
      return;
    }
    O.setErro(campos.ate.control, '');
    aplicar(true);
  });
  form.addEventListener('reset', () => window.setTimeout(() => {
    Object.keys(campos).forEach((k) => { campos[k].control.value = ''; });
    O.setErro(campos.ate.control, '');
    aplicar(true);
  }, 0));

  document.getElementById('exportar').addEventListener('click', () => {
    O.downloadCsv('solicitacoes.csv', colunas.map((c) => Object.assign({}, c, { csv: c.csv || ((s) => s[c.key]) })), tabela.rows());
  });
  document.getElementById('imprimir').addEventListener('click', () => window.print());

  aplicar(false);
})();
