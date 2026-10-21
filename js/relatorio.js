/* Gestão OPME: relatório geral de precificação dos itens. */
(function () {
  'use strict';

  const O = window.OPME;
  const h = O.h;
  const u = O.shell({
    ativo: 'relatorio',
    titulo: 'Relatório de preços',
    migalhas: [{ label: 'Início', href: 'inicio.html' }, { label: 'Operação' }, { label: 'Relatório de preços' }]
  });
  if (!u) return;

  // Último valor acordado de cada item nas solicitações (mais recente primeiro).
  const acordados = {};
  O.db.all('solicitacoes').slice().sort((a, b) => (a.data < b.data ? 1 : -1)).forEach((s) => s.itens.forEach((i) => {
    if (i.valorAcordado && !acordados[i.itemId]) acordados[i.itemId] = { valor: i.valorAcordado, numero: s.numero };
  }));

  function analisa(origem) {
    return O.db.all('itens').map((item) => {
      const precos = O.db.all('precos').filter((p) => p.itemId === item.id && O.situacaoPreco(p) === 'Vigente' && (!origem || p.tipo === origem));
      if (!precos.length) return null;
      const menor = precos.reduce((a, b) => (b.valor < a.valor ? b : a));
      const maior = precos.reduce((a, b) => (b.valor > a.valor ? b : a));
      const media = precos.reduce((s, p) => s + p.valor, 0) / precos.length;
      const empresa = (p) => (p.tipo === 'hospital' ? O.nome.hospital(p.orgId) : O.nome.fornecedor(p.orgId));
      return {
        id: item.id, item: item.descricao, tuss: item.tuss, subgrupo: item.subgrupo, fabricanteId: item.fabricante, fabricante: O.nome.marca(item.fabricante),
        n: precos.length, menor: menor.valor, menorEmpresa: empresa(menor), maior: maior.valor, maiorEmpresa: empresa(maior), media,
        variacao: maior.valor / menor.valor - 1, acordado: acordados[item.id] || null
      };
    }).filter(Boolean);
  }

  /* KPIs sobre todos os valores vigentes */
  const geral = analisa('');
  const economia = O.db.all('solicitacoes').reduce((s, x) => s + O.totaisSolicitacao(x).economia, 0);
  const maiorVar = geral.reduce((a, b) => (b.variacao > a.variacao ? b : a), geral[0]);
  const kpis = [
    { icone: 'package', rotulo: 'Itens com valor vigente', valor: O.fmt.int(geral.length), nota: 'de ' + O.db.all('itens').length + ' no catálogo' },
    { icone: 'swap', rotulo: 'Diferença média de preço', valor: O.fmt.pct(geral.reduce((s, x) => s + x.variacao, 0) / (geral.length || 1)), nota: 'Entre o menor e o maior valor', tom: 'accent' },
    { icone: 'alert', rotulo: 'Maior diferença', valor: maiorVar ? O.fmt.pct(maiorVar.variacao) : '', nota: maiorVar ? maiorVar.item : '', tom: 'warning' },
    { icone: 'trending-down', rotulo: 'Economia nas solicitações', valor: O.fmt.money(economia), nota: 'Pedido pelo hospital menos o acordado', tom: 'success' }
  ];
  const lista = document.getElementById('kpis');
  kpis.forEach((k) => lista.appendChild(h('li', { class: 'kpi' + (k.tom ? ' kpi--' + k.tom : '') },
    h('span', { class: 'kpi__icon' }, O.icon(k.icone)),
    h('span', { class: 'kpi__label', text: k.rotulo }),
    h('span', { class: 'kpi__value', text: k.valor }),
    h('span', { class: 'kpi__note', text: k.nota }))));

  /* Filtros */
  const form = document.getElementById('filtros');
  form.setAttribute('aria-label', 'Filtrar relatório');
  const fabricantes = O.db.all('marcas').map((m) => ({ value: String(m.id), label: m.nome })).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  const f = {
    item: O.field({ id: 'r-item', label: 'Item ou TUSS', span: 4 }),
    subgrupo: O.field({ id: 'r-subgrupo', label: 'Subgrupo', tipo: 'select', opcoes: O.SUBGRUPOS, vazio: 'Todos', span: 4 }),
    fabricante: O.field({ id: 'r-fabricante', label: 'Fabricante', tipo: 'select', opcoes: fabricantes, vazio: 'Todos', span: 4 }),
    origem: O.field({ id: 'r-origem', label: 'Valores considerados', tipo: 'select', vazio: false, opcoes: [{ value: '', label: 'Hospitais e fornecedores' }, { value: 'hospital', label: 'Só hospitais e clínicas' }, { value: 'fornecedor', label: 'Só fornecedores' }], span: 6 }),
    variacao: O.field({ id: 'r-variacao', label: 'Diferença de preço', tipo: 'select', vazio: false, opcoes: [{ value: '0', label: 'Qualquer diferença' }, { value: '0.1', label: 'Acima de 10%' }, { value: '0.25', label: 'Acima de 25%' }, { value: '0.5', label: 'Acima de 50%' }], span: 6 })
  };
  const grade = form.querySelector('.form-grid');
  Object.keys(f).forEach((k) => grade.appendChild(f[k]));

  const colunas = [
    { key: 'item', label: 'Item', sort: true, render: (r) => h('span', null, h('a', { class: 'row-link', href: 'cadastro.html?tipo=itens&id=' + r.id, text: r.item }), h('span', { class: 'cell-sub', text: (r.tuss ? 'TUSS ' + r.tuss + ' · ' : '') + r.fabricante })) },
    { key: 'subgrupo', label: 'Subgrupo', sort: true },
    { key: 'n', label: 'Valores', num: true, sort: true },
    { key: 'menor', label: 'Menor valor', num: true, sort: true, render: (r) => h('span', null, O.fmt.money(r.menor), h('span', { class: 'cell-sub', text: r.menorEmpresa })), csv: (r) => O.fmt.decimal(r.menor) + ' (' + r.menorEmpresa + ')' },
    { key: 'media', label: 'Média', num: true, sort: true, render: (r) => O.fmt.money(r.media), csv: (r) => O.fmt.decimal(r.media) },
    { key: 'maior', label: 'Maior valor', num: true, sort: true, render: (r) => h('span', null, O.fmt.money(r.maior), h('span', { class: 'cell-sub', text: r.maiorEmpresa })), csv: (r) => O.fmt.decimal(r.maior) + ' (' + r.maiorEmpresa + ')' },
    {
      key: 'variacao', label: 'Diferença', sort: true, csv: (r) => O.fmt.pct(r.variacao),
      render: (r) => {
        const barra = h('span', { class: 'bar__range' });
        barra.style.left = '0';
        barra.style.width = Math.min(100, Math.max(4, r.variacao * 100)) + '%';
        return h('span', { class: 'bar-cell' }, h('span', { class: 'bar__label', text: O.fmt.pct(r.variacao) }), h('span', { class: 'bar', 'aria-hidden': 'true' }, barra));
      }
    },
    { key: 'acordado', label: 'Último acordado', num: true, sort: (r) => (r.acordado ? r.acordado.valor : 0), render: (r) => (r.acordado ? h('span', null, O.fmt.money(r.acordado.valor), h('span', { class: 'cell-sub', text: r.acordado.numero })) : h('span', { class: 'muted', text: 'Sem negociação' })), csv: (r) => (r.acordado ? O.fmt.decimal(r.acordado.valor) : '') }
  ];

  const contador = document.getElementById('resultado-total');
  const tabela = O.dataTable({
    container: document.getElementById('resultado'),
    caption: 'Precificação por item',
    rows: [],
    rowKey: (r) => r.id,
    sortKey: 'variacao',
    sortDir: 'desc',
    columns: colunas,
    pageSize: 12,
    emptyIcon: 'chart',
    emptyTitle: 'Nenhum item com esses filtros',
    emptyText: 'Tente uma diferença de preço menor ou outro subgrupo.'
  });

  function aplica(anunciar) {
    const v = {
      item: O.normaliza(f.item.control.value), subgrupo: f.subgrupo.control.value, fabricante: f.fabricante.control.value,
      origem: f.origem.control.value, variacao: Number(f.variacao.control.value)
    };
    const linhas = analisa(v.origem).filter((r) => {
      if (v.item && O.normaliza(r.item + ' ' + r.tuss).indexOf(v.item) < 0) return false;
      if (v.subgrupo && r.subgrupo !== v.subgrupo) return false;
      if (v.fabricante && String(r.fabricanteId) !== v.fabricante) return false;
      return r.variacao >= v.variacao;
    });
    tabela.update(linhas);
    contador.textContent = O.fmt.plural(linhas.length, 'item analisado', 'itens analisados') + '. Considera só valores vigentes.';
    if (anunciar) O.announce(contador.textContent);
  }

  form.addEventListener('submit', (ev) => { ev.preventDefault(); aplica(true); });
  form.addEventListener('reset', () => window.setTimeout(() => aplica(true), 0));
  document.getElementById('exportar').addEventListener('click', () => O.downloadCsv('relatorio-precificacao.csv', colunas.map((c) => Object.assign({}, c, { csv: c.csv || ((r) => r[c.key]) })), tabela.rows()));
  document.getElementById('imprimir').addEventListener('click', () => window.print());
  aplica(false);
})();
