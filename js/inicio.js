/* Gestão OPME: painel inicial com indicadores e atalhos. */
(function () {
  'use strict';

  const O = window.OPME;
  const h = O.h;
  const u = O.shell({ ativo: 'inicio', titulo: 'Início', migalhas: [{ label: 'Início' }] });
  if (!u) return;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  document.getElementById('pagina-titulo').textContent = saudacao + ', ' + u.nome.split(' ')[0] + '!';

  const sols = O.db.all('solicitacoes');
  const abertas = sols.filter((s) => ['Rascunho', 'Em negociação', 'Em aprovação'].indexOf(s.status) >= 0);
  const emAprovacao = sols.filter((s) => s.status === 'Em aprovação');
  const urgentes = abertas.filter((s) => s.prioridade === 'Urgente');

  // Economia = diferença entre o que o hospital pediu e o valor acordado.
  let pedido = 0;
  let acordado = 0;
  sols.forEach((s) => s.itens.forEach((i) => {
    if (i.valorAcordado && i.situacao !== 'Reprovado') {
      pedido += i.valorHospital * i.quantidade;
      acordado += i.valorAcordado * i.quantidade;
    }
  }));
  const economia = pedido - acordado;

  const vencendo = O.db.all('precos').filter((p) => p.situacao === 'Vigente' && p.fim && O.diasAte(p.fim) >= 0 && O.diasAte(p.fim) <= 30)
    .sort((a, b) => (a.fim < b.fim ? -1 : 1));

  document.getElementById('hero-texto').textContent = abertas.length
    ? 'Hoje há ' + O.fmt.plural(abertas.length, 'solicitação em andamento', 'solicitações em andamento') + (urgentes.length ? ', ' + O.fmt.plural(urgentes.length, 'delas urgente', 'delas urgentes') : '') + '. Vamos lá?'
    : 'Nenhuma solicitação em andamento agora. Que tal revisar as tabelas de valores?';

  const kpis = [
    { icone: 'file', rotulo: 'Solicitações em andamento', valor: O.fmt.int(abertas.length), nota: O.fmt.plural(urgentes.length, 'urgente', 'urgentes'), href: 'solicitacoes.html?status=andamento' },
    { icone: 'shield', rotulo: 'Aguardando aprovação', valor: O.fmt.int(emAprovacao.length), nota: 'Itens já negociados', href: 'solicitacoes.html?status=Em%20aprova%C3%A7%C3%A3o', tom: 'accent' },
    { icone: 'trending-down', rotulo: 'Economia negociada', valor: O.fmt.money(economia), nota: pedido ? O.fmt.pct(economia / pedido) + ' abaixo do valor pedido' : 'Sem itens acordados', href: 'relatorio.html', tom: 'success' },
    { icone: 'calendar', rotulo: 'Valores perto de vencer', valor: O.fmt.int(vencendo.length), nota: 'Nos próximos 30 dias', href: '#vencendo-titulo', tom: 'warning' }
  ];
  const lista = document.getElementById('kpis');
  kpis.forEach((k) => {
    lista.appendChild(h('li', { class: 'kpi' + (k.tom ? ' kpi--' + k.tom : '') },
      h('span', { class: 'kpi__icon' }, O.icon(k.icone)),
      h('a', { class: 'kpi__label', href: k.href, text: k.rotulo }),
      h('span', { class: 'kpi__value', text: k.valor }),
      h('span', { class: 'kpi__note', text: k.nota })));
  });

  /* Precisam de atenção */
  const atencao = document.getElementById('atencao');
  const ordem = abertas.slice().sort((a, b) => (a.prioridade === b.prioridade ? (a.data < b.data ? -1 : 1) : a.prioridade === 'Urgente' ? -1 : 1)).slice(0, 5);
  if (!ordem.length) {
    atencao.appendChild(h('p', { class: 'muted', text: 'Tudo em dia por aqui.' }));
  } else {
    const ul = h('ul', { class: 'list-plain attention' });
    ordem.forEach((s) => {
      const dias = -O.diasAte(s.data);
      ul.appendChild(h('li', null,
        h('div', null,
          h('a', { href: 'solicitacao.html?id=' + s.id, text: s.numero + ' · ' + O.nome.hospital(s.hospitalId) }),
          h('span', { class: 'cell-sub', text: s.pacienteNome + ' · ' + (dias === 0 ? 'registrada hoje' : dias === 1 ? 'registrada ontem' : 'registrada há ' + dias + ' dias') })),
        h('span', { class: 'btn-row' }, s.prioridade === 'Urgente' ? O.statusBadge('Urgente') : null, O.statusBadge(s.status))));
    });
    atencao.appendChild(ul);
  }

  /* Valores perto de vencer */
  const venc = document.getElementById('vencendo');
  if (!vencendo.length) {
    venc.appendChild(h('p', { class: 'muted', text: 'Nenhum valor vence nos próximos 30 dias.' }));
  } else {
    const ul = h('ul', { class: 'list-plain attention' });
    vencendo.slice(0, 5).forEach((p) => {
      const org = p.tipo === 'hospital' ? O.nome.hospital(p.orgId) : O.nome.fornecedor(p.orgId);
      const d = O.diasAte(p.fim);
      ul.appendChild(h('li', null,
        h('div', null,
          h('a', { href: 'tabelas.html?tipo=' + p.tipo + '&org=' + p.orgId, text: O.nome.item(p.itemId) }),
          h('span', { class: 'cell-sub', text: org + ' · ' + O.fmt.money(p.valor) })),
        O.badge(d === 0 ? 'Vence hoje' : d === 1 ? 'Vence amanhã' : 'Vence em ' + d + ' dias', d <= 7 ? 'danger' : 'warning')));
    });
    venc.appendChild(ul);
  }

  /* Atalhos: os mesmos destinos do menu, menos o início */
  const atalhos = document.getElementById('atalhos');
  const dicas = {
    solicitacoes: 'Pedidos e negociações', tabelas: 'Valores por empresa', relatorio: 'Compare preços',
    hospitais: 'Rede de atendimento', fornecedores: 'Distribuidores', itens: 'Catálogo OPME', marcas: 'Fabricantes',
    unidadesMedida: 'UND, CX, KIT…', unidadesNegocio: 'Empresas do grupo', usuarios: 'Quem acessa', grupos: 'Permissões', telas: 'Telas liberáveis'
  };
  O.NAV.slice(1).forEach((g) => g.itens.forEach((it) => {
    atalhos.appendChild(h('li', { class: 'shortcut' },
      h('span', { class: 'shortcut__icon' }, O.icon(it.icone)),
      h('span', null, h('a', { href: it.href, text: it.label }), h('small', { text: dicas[it.chave] }))));
  }));
})();
