/*
 * Gestão OPME: tabelas de valores de hospitais e fornecedores
 * (tabelas.html?tipo=hospital|fornecedor&org=...).
 */
(function () {
  'use strict';

  const O = window.OPME;
  const h = O.h;
  const tipo = O.param('tipo') === 'fornecedor' ? 'fornecedor' : 'hospital';
  const col = tipo === 'hospital' ? 'hospitais' : 'fornecedores';
  const orgId = Number(O.param('org')) || null;
  const org = orgId ? O.db.get(col, orgId) : null;
  const rotuloTipo = tipo === 'hospital' ? 'Hospitais e clínicas' : 'Fornecedores';
  const quem = tipo === 'hospital' ? 'Hospital' : 'Fornecedor';

  const u = O.shell({
    ativo: 'tabelas',
    titulo: org ? 'Tabela de ' + org.nomeFantasia : 'Tabelas de valores',
    migalhas: [{ label: 'Início', href: 'inicio.html' }, { label: 'Tabelas de valores', href: org ? 'tabelas.html?tipo=' + tipo : null }]
      .concat(org ? [{ label: org.nomeFantasia }] : [{ label: rotuloTipo }])
  });
  if (!u) return;

  const tipos = document.getElementById('tipos-tabela');
  [['hospital', 'Hospitais e clínicas', 'hospital'], ['fornecedor', 'Fornecedores', 'truck']].forEach((t) => {
    tipos.appendChild(h('li', null, h('a', { class: 'step-btn', href: 'tabelas.html?tipo=' + t[0], 'aria-current': t[0] === tipo ? 'page' : null }, O.icon(t[2]), t[1])));
  });

  const area = document.getElementById('tabelas-conteudo');
  area.className = 'stack';
  const precosDe = (id) => O.db.all('precos').filter((p) => p.tipo === tipo && p.orgId === id);

  if (!org) escolherEmpresa(); else tabelaDaEmpresa();

  /* ------------------------------------------------ Escolha da empresa */

  function escolherEmpresa() {
    if (orgId) area.appendChild(h('div', { class: 'alert alert--warning' }, O.icon('alert'), h('div', { class: 'alert__body' }, h('p', { text: 'Não encontramos essa empresa. Escolha outra na lista abaixo.' }))));
    const form = h('form', { id: 'busca-empresa', role: 'search', 'aria-label': 'Buscar ' + rotuloTipo.toLowerCase(), novalidate: true });
    const nome = O.field({ id: 'busca-nome', label: 'Nome ou razão social', span: 6 });
    const cnpj = O.field({ id: 'busca-cnpj', label: 'CNPJ', mask: 'cnpj', inputmode: 'numeric', max: 18, span: 6 });
    form.append(h('div', { class: 'form-grid' }, nome, cnpj),
      h('div', { class: 'filters__actions' }, h('button', { type: 'reset', class: 'btn', text: 'Limpar' }), h('button', { type: 'submit', class: 'btn btn--primary' }, O.icon('search'), 'Buscar')));
    const resultado = h('div');
    const total = h('p');
    const tid = O.uid('t');
    area.append(
      h('section', { class: 'card filters', 'aria-labelledby': tid + 'f' }, h('div', { class: 'card__head' }, h('h2', { id: tid + 'f', text: tipo === 'hospital' ? 'Escolha um hospital ou clínica' : 'Escolha um fornecedor' })), form),
      h('section', { class: 'card card--flush', 'aria-labelledby': tid }, h('div', { class: 'table-toolbar' }, h('div', null, h('h2', { id: tid, text: rotuloTipo }), total)), resultado));
    O.applyMasks(form);

    const linhas = () => O.db.all(col).filter((e) => {
      if (nome.control.value && O.normaliza(e.nomeFantasia + ' ' + e.razaoSocial).indexOf(O.normaliza(nome.control.value)) < 0) return false;
      if (cnpj.control.value && O.digitos(e.cnpj).indexOf(O.digitos(cnpj.control.value)) < 0) return false;
      return true;
    }).map((e) => {
      const ps = precosDe(e.id);
      const conta = (s) => ps.filter((p) => O.situacaoPreco(p) === s).length;
      return Object.assign({}, e, { total: ps.length, vigentes: conta('Vigente'), negociacao: conta('Em negociação'), atencao: conta('Vencido') + conta('Suspenso') });
    });
    const tabela = O.dataTable({
      container: resultado,
      caption: rotuloTipo,
      rows: [],
      rowKey: (e) => e.id,
      sortKey: 'nomeFantasia',
      columns: [
        { key: 'nomeFantasia', label: tipo === 'hospital' ? 'Hospital ou clínica' : 'Fornecedor', sort: true, render: (e) => h('span', null, h('a', { class: 'row-link', href: 'tabelas.html?tipo=' + tipo + '&org=' + e.id, text: e.nomeFantasia }), h('span', { class: 'cell-sub', text: e.cnpj })) },
        { key: 'total', label: 'Itens na tabela', num: true, sort: true },
        { key: 'vigentes', label: 'Vigentes', num: true, sort: true },
        { key: 'negociacao', label: 'Em negociação', num: true, sort: true },
        { key: 'atencao', label: 'Vencidos ou suspensos', num: true, sort: true },
        { key: 'status', label: 'Status', sort: true, render: (e) => O.statusBadge(e.status) }
      ],
      emptyTitle: 'Ninguém encontrado',
      emptyText: 'Confira o nome ou o CNPJ.'
    });
    const aplica = (anunciar) => {
      const l = linhas();
      tabela.update(l);
      total.textContent = O.fmt.plural(l.length, 'empresa', 'empresas') + '. Clique no nome para abrir a tabela.';
      if (anunciar) O.announce(O.fmt.plural(l.length, 'empresa encontrada', 'empresas encontradas') + '.');
    };
    form.addEventListener('submit', (ev) => { ev.preventDefault(); aplica(true); });
    form.addEventListener('reset', () => window.setTimeout(() => aplica(true), 0));
    aplica(false);
  }

  /* ------------------------------------------------ Tabela de uma empresa */

  function tabelaDaEmpresa() {
    document.getElementById('pagina-titulo').textContent = 'Tabela de ' + org.nomeFantasia;
    document.getElementById('pagina-descricao').textContent = 'Valores combinados com ' + (tipo === 'hospital' ? 'esse hospital' : 'esse fornecedor') + '. Selecione itens para suspender ou reativar, ou abra o histórico para registrar uma proposta.';

    const resumo = h('dl', { class: 'summary-bar' });
    const desenhaResumo = () => {
      const ps = precosDe(orgId);
      resumo.replaceChildren(
        h('div', null, h('dt', { text: 'CNPJ' }), h('dd', { text: org.cnpj })),
        h('div', null, h('dt', { text: quem }), h('dd', { text: org.razaoSocial })),
        h('div', null, h('dt', { text: 'Cidade' }), h('dd', { text: org.endereco.cidade + '/' + org.endereco.uf })),
        h('div', null, h('dt', { text: 'Itens na tabela' }), h('dd', { text: String(ps.length) })),
        h('div', null, h('dt', { text: 'Status' }), h('dd', null, O.statusBadge(org.status))));
    };
    desenhaResumo();

    /* Filtros */
    const SIT = ['Vigente', 'Suspenso', 'Em negociação', 'Vencido'];
    const ROT = { 'Vigente': 'Vigentes', 'Suspenso': 'Suspensos', 'Em negociação': 'Em negociação', 'Vencido': 'Vencidos' };
    const form = h('form', { id: 'filtro-tabela', role: 'search', 'aria-label': 'Filtrar itens da tabela', novalidate: true });
    const sits = O.choiceGroup({ id: 'f-situacao', name: 'situacao', label: 'Mostrar itens', opcoes: SIT.map((s) => ({ value: s, label: ROT[s] })), multiplo: true, box: true, valor: SIT });
    const fTuss = O.field({ id: 'f-tuss', label: 'TUSS', mask: 'digits', inputmode: 'numeric', max: 8, span: 3 });
    const fItem = O.field({ id: 'f-item', label: 'Nome do item', span: 3 });
    const fFab = O.field({ id: 'f-fabricante', label: 'Fabricante', span: 3 });
    const fCod = O.field({ id: 'f-codigo', label: 'Código na empresa', mask: 'digits', inputmode: 'numeric', max: 10, span: 3 });
    form.append(h('div', { class: 'form-grid' }, sits, fTuss, fItem, fFab, fCod),
      h('div', { class: 'filters__actions' }, h('button', { type: 'reset', class: 'btn', text: 'Limpar filtros' }), h('button', { type: 'submit', class: 'btn btn--primary' }, O.icon('search'), 'Buscar')));

    const resultado = h('div');
    const total = h('p');
    const selInfo = h('span', { class: 'muted', 'aria-live': 'polite' });
    const btnSuspender = h('button', { type: 'button', class: 'btn btn--sm' }, O.icon('pause'), 'Suspender selecionados');
    const btnReativar = h('button', { type: 'button', class: 'btn btn--sm' }, O.icon('play'), 'Reativar selecionados');
    const btnIncluir = h('button', { type: 'button', class: 'btn btn--primary btn--sm' }, O.icon('plus'), 'Incluir item');
    const btnExportar = h('button', { type: 'button', class: 'btn btn--sm' }, O.icon('download'), 'Exportar CSV');
    const btnSuspTudo = h('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Suspender tabela completa');
    const btnReatTudo = h('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, 'Reativar tabela completa');
    const tid = O.uid('t');

    area.append(
      resumo,
      h('div', { class: 'btn-row no-print' }, h('a', { class: 'btn btn--sm', href: 'tabelas.html?tipo=' + tipo }, O.icon('arrow-left'), tipo === 'hospital' ? 'Escolher outro hospital' : 'Escolher outro fornecedor'), btnSuspTudo, btnReatTudo),
      h('section', { class: 'card filters no-print', 'aria-labelledby': tid + 'f' }, h('div', { class: 'card__head' }, h('h2', { id: tid + 'f', text: 'Filtros' })), form),
      h('section', { class: 'card card--flush', 'aria-labelledby': tid },
        h('div', { class: 'table-toolbar' },
          h('div', null, h('h2', { id: tid, text: 'Itens da tabela' }), total),
          h('div', { class: 'btn-row' }, btnIncluir, btnExportar)),
        h('div', { class: 'table-toolbar no-print' }, h('div', { class: 'btn-row' }, btnSuspender, btnReativar), selInfo),
        resultado));
    O.applyMasks(form);

    const colunas = [
      { key: 'tuss', label: 'TUSS', sort: true, render: (p) => p.tuss || 'Sem TUSS' },
      { key: 'item', label: 'Item', sort: true, class: 'col-item', render: (p) => h('span', null, h('span', { class: 'cell-title', text: p.item }), h('span', { class: 'cell-sub', text: p.fabricante + ' · ref. ' + p.ref })) },
      { key: 'codigoInterno', label: 'Código na empresa', sort: true },
      { key: 'valor', label: 'Último valor aprovado', num: true, sort: true, render: (p) => O.fmt.money(p.valor), csv: (p) => O.fmt.decimal(p.valor) },
      { key: 'inicio', label: 'Vigência', sort: true, render: (p) => O.fmt.date(p.inicio) + (p.fim ? ' a ' + O.fmt.date(p.fim) : ' em diante'), csv: (p) => O.fmt.date(p.inicio) + (p.fim ? ' a ' + O.fmt.date(p.fim) : '') },
      { key: 'situacao', label: 'Situação', sort: true, render: (p) => O.statusBadge(p.situacao) },
      { key: 'acoes', label: 'Ações', srOnly: true, class: 'col-actions', render: (p) => h('button', { type: 'button', class: 'btn btn--sm', 'aria-label': 'Histórico e propostas de ' + p.item, onClick: () => historico(p.id) }, O.icon('history'), 'Histórico') }
    ];

    const linhas = () => {
      const marcadas = Array.from(sits.querySelectorAll('input:checked')).map((i) => i.value);
      return precosDe(orgId).map((p) => {
        const item = O.db.get('itens', p.itemId);
        return Object.assign({}, p, { situacao: O.situacaoPreco(p), item: item.descricao, tuss: item.tuss, fabricante: O.nome.marca(item.fabricante), ref: item.refFabricante });
      }).filter((p) => {
        if (marcadas.indexOf(p.situacao) < 0) return false;
        if (fTuss.control.value && String(p.tuss).indexOf(fTuss.control.value) < 0) return false;
        if (fItem.control.value && O.normaliza(p.item).indexOf(O.normaliza(fItem.control.value)) < 0) return false;
        if (fFab.control.value && O.normaliza(p.fabricante).indexOf(O.normaliza(fFab.control.value)) < 0) return false;
        if (fCod.control.value && p.codigoInterno.indexOf(fCod.control.value) < 0) return false;
        return true;
      });
    };

    const tabela = O.dataTable({
      container: resultado,
      caption: 'Itens da tabela de ' + org.nomeFantasia,
      rows: [],
      rowKey: (p) => p.id,
      rowLabel: (p) => p.item,
      selectable: true,
      sortKey: 'item',
      rowHeader: false,
      columns: colunas,
      emptyIcon: 'table',
      emptyTitle: 'Nenhum item com esses filtros',
      emptyText: 'Marque mais situações ou limpe os filtros.',
      onSelect(sel) {
        selInfo.textContent = sel.length ? O.fmt.plural(sel.length, 'item selecionado', 'itens selecionados') + '.' : 'Selecione itens para suspender ou reativar.';
      }
    });

    function aplica(anunciar, manterPagina) {
      const l = linhas();
      tabela.update(l, manterPagina);
      total.textContent = O.fmt.plural(l.length, 'item', 'itens') + ' com os filtros atuais.';
      if (anunciar) O.announce(total.textContent);
    }
    form.addEventListener('submit', (ev) => { ev.preventDefault(); aplica(true); });
    form.addEventListener('reset', () => window.setTimeout(() => {
      sits.querySelectorAll('input').forEach((i) => { i.checked = true; });
      aplica(true);
    }, 0));
    sits.addEventListener('change', () => aplica(true));

    function grava(p, acao) {
      p.alteradoEm = new Date().toISOString();
      p.alteradoPor = u.nome;
      O.db.commit();
      return acao;
    }

    async function mudarSituacao(ids, para) {
      const todos = O.db.all('precos').filter((p) => ids.indexOf(p.id) >= 0);
      const aplicaveis = todos.filter((p) => (para === 'Suspenso' ? O.situacaoPreco(p) !== 'Suspenso' : p.situacao === 'Suspenso'));
      if (!aplicaveis.length) {
        O.toast(para === 'Suspenso' ? 'Esses itens já estão suspensos.' : 'Nenhum desses itens está suspenso.', 'error');
        return;
      }
      const ok = await O.confirmDialog({
        titulo: (para === 'Suspenso' ? 'Suspender ' : 'Reativar ') + O.fmt.plural(aplicaveis.length, 'item', 'itens') + '?',
        icone: para === 'Suspenso' ? 'pause' : 'play',
        montar(c) {
          c.append(h('p', { text: para === 'Suspenso'
            ? 'Itens suspensos não aparecem como valor tabelado nas novas solicitações até serem reativados.'
            : 'Os itens voltam a valer como tabelados nas novas solicitações.' }),
          h('ul', null, aplicaveis.slice(0, 8).map((p) => h('li', { text: O.nome.item(p.itemId) })), aplicaveis.length > 8 ? h('li', { text: 'e mais ' + (aplicaveis.length - 8) }) : null));
          if (todos.length > aplicaveis.length) c.append(h('p', { class: 'muted', text: (todos.length - aplicaveis.length) + ' dos selecionados já estavam assim e ficam como estão.' }));
        },
        confirmar: para === 'Suspenso' ? 'Suspender' : 'Reativar',
        tomBotao: para === 'Suspenso' ? 'danger' : 'success'
      });
      if (!ok) return;
      aplicaveis.forEach((p) => { p.situacao = para; grava(p); });
      tabela.clearSelection();
      aplica(false, true);
      desenhaResumo();
      O.toast(O.fmt.plural(aplicaveis.length, 'item', 'itens') + (para === 'Suspenso' ? (aplicaveis.length === 1 ? ' suspenso.' : ' suspensos.') : (aplicaveis.length === 1 ? ' reativado.' : ' reativados.')));
    }

    btnSuspender.addEventListener('click', () => {
      const sel = tabela.selected();
      if (!sel.length) { O.toast('Selecione pelo menos um item na tabela.', 'error'); return; }
      mudarSituacao(sel, 'Suspenso');
    });
    btnReativar.addEventListener('click', () => {
      const sel = tabela.selected();
      if (!sel.length) { O.toast('Selecione pelo menos um item na tabela.', 'error'); return; }
      mudarSituacao(sel, 'Vigente');
    });
    btnSuspTudo.addEventListener('click', () => mudarSituacao(precosDe(orgId).map((p) => p.id), 'Suspenso'));
    btnReatTudo.addEventListener('click', () => mudarSituacao(precosDe(orgId).map((p) => p.id), 'Vigente'));
    btnExportar.addEventListener('click', () => O.downloadCsv('tabela-' + O.normaliza(org.nomeFantasia).replace(/\s+/g, '-') + '.csv', colunas.filter((c) => c.key !== 'acoes'), tabela.rows()));

    /* Incluir item */
    btnIncluir.addEventListener('click', async () => {
      const ja = precosDe(orgId).map((p) => p.itemId);
      const opcoes = O.db.all('itens').filter((i) => i.status === 'Ativo' && ja.indexOf(i.id) < 0).map((i) => ({ value: String(i.id), label: i.descricao + ' · ' + O.nome.marca(i.fabricante) }));
      if (!opcoes.length) { O.toast('Todos os itens ativos do catálogo já estão nessa tabela.'); return; }
      const res = await O.dialog({
        titulo: 'Incluir item na tabela',
        icone: 'plus',
        tom: 'success',
        confirmar: 'Incluir',
        montar(c) {
          c.append(h('div', { class: 'form-grid' },
            O.field({ id: 'novo-item', label: 'Item', tipo: 'select', opcoes, required: true }),
            O.field({ id: 'novo-codigo', label: 'Código do item na empresa', mask: 'digits', inputmode: 'numeric', max: 10, opcional: true, span: 6 }),
            O.field({ id: 'novo-valor', label: 'Valor unitário', mask: 'money', rules: 'money', inputmode: 'decimal', required: true, span: 6, placeholder: '0,00' }),
            O.field({ id: 'novo-inicio', label: 'Início da vigência', tipo: 'date', required: true, valor: O.hoje(), span: 6 }),
            O.field({ id: 'novo-fim', label: 'Fim da vigência', tipo: 'date', opcional: true, span: 6, dica: 'Deixe em branco se não tiver data para acabar.' })));
        },
        aoConfirmar(form) {
          const ini = form.querySelector('#novo-inicio');
          const fim = form.querySelector('#novo-fim');
          const ok = O.validateForm(form, {
            resumoTitulo: 'Confira estes pontos:',
            extra(addErro) { if (ini.value && fim.value && fim.value < ini.value) addErro(fim, 'O fim da vigência precisa ser depois do início.'); }
          });
          if (!ok) return false;
          return { itemId: Number(form.querySelector('#novo-item').value), codigo: form.querySelector('#novo-codigo').value, valor: O.parseMoney(form.querySelector('#novo-valor').value), inicio: ini.value, fim: fim.value };
        }
      });
      if (!res) return;
      const lista = O.db.all('precos');
      const novo = {
        id: lista.reduce((m, p) => Math.max(m, p.id), 0) + 1, tipo, orgId, itemId: res.itemId,
        codigoInterno: res.codigo || String(100000 + lista.length * 37), valor: res.valor, inicio: res.inicio, fim: res.fim, situacao: 'Vigente',
        propostas: [{ data: O.hoje(), condicao: 'Valor incluído na tabela', origem: 'Operadora', valor: res.valor, responsavel: u.nome, resposta: 'Aceita' }]
      };
      lista.push(novo);
      grava(novo);
      aplica(false);
      desenhaResumo();
      O.toast(O.nome.item(res.itemId) + ' incluído na tabela por ' + O.fmt.money(res.valor) + '.');
    });

    /* Histórico e propostas */
    async function historico(precoId) {
      const p = O.db.get('precos', precoId);
      const item = O.db.get('itens', p.itemId);
      const ultimaEmpresa = p.propostas.slice().reverse().find((x) => x.origem === quem);
      const res = await O.dialog({
        titulo: item.descricao,
        wide: true,
        icone: 'history',
        confirmar: 'Registrar',
        cancelar: 'Fechar',
        montar(c) {
          c.append(h('ul', { class: 'meta' },
            h('li', null, O.icon('coin'), 'Valor atual: ' + O.fmt.money(p.valor)),
            h('li', null, O.icon('calendar'), 'Vigência: ' + O.fmt.date(p.inicio) + (p.fim ? ' a ' + O.fmt.date(p.fim) : ' em diante')),
            h('li', null, O.statusBadge(O.situacaoPreco(p)))),
          h('h3', { text: 'Histórico de propostas' }),
          h('div', { class: 'table-wrap', role: 'region', 'aria-label': 'Histórico de propostas', tabindex: '0' }, h('table', { class: 'table table--compact' },
            h('thead', null, h('tr', null, ['Data', 'Quem propôs', 'Condição', 'Valor', 'Resposta', 'Responsável'].map((t, i) => h('th', { scope: 'col', class: i === 3 ? 'num' : '', text: t })))),
            h('tbody', null, p.propostas.slice().reverse().map((x) => h('tr', null,
              h('td', { class: 'nowrap', text: O.fmt.date(x.data) }), h('td', { text: x.origem }), h('td', { text: x.condicao }),
              h('td', { class: 'num', text: O.fmt.money(x.valor) }), h('td', { text: x.resposta || 'Aguardando' }), h('td', { text: x.responsavel })))))),
          h('h3', { text: 'Registrar proposta' }),
          h('div', { class: 'form-grid' },
            O.choiceGroup({ id: 'prop-tipo', name: 'prop-tipo', label: 'O que aconteceu?', required: true, box: true, opcoes: [
              { value: 'empresa', label: 'Nova proposta ' + (tipo === 'hospital' ? 'do hospital' : 'do fornecedor') },
              { value: 'operadora', label: 'Contraproposta da operadora' },
              { value: 'aceite', label: 'Aceite da última proposta ' + (tipo === 'hospital' ? 'do hospital' : 'do fornecedor') }
            ] }),
            O.field({ id: 'prop-valor', label: 'Valor unitário', mask: 'money', rules: 'money', inputmode: 'decimal', required: true, span: 6, placeholder: '0,00' }),
            O.field({ id: 'prop-fim', label: 'Fim da nova vigência', tipo: 'date', opcional: true, span: 6, dica: 'Usado só no aceite. Em branco, vale sem data para acabar.' })));
          const valor = c.querySelector('#prop-valor');
          c.querySelector('#prop-tipo').addEventListener('change', (ev) => {
            const aceite = ev.target.value === 'aceite';
            valor.readOnly = aceite;
            if (aceite) valor.value = ultimaEmpresa ? O.fmt.decimal(ultimaEmpresa.valor) : '';
          });
        },
        aoConfirmar(form) {
          const t = form.querySelector('[name="prop-tipo"]:checked');
          const ok = O.validateForm(form, {
            resumoTitulo: 'Confira estes pontos:',
            extra(addErro) {
              if (t && t.value === 'aceite' && !ultimaEmpresa) addErro(t, 'Ainda não há proposta da empresa para aceitar.');
              const fim = form.querySelector('#prop-fim').value;
              if (fim && fim <= O.hoje()) addErro(form.querySelector('#prop-fim'), 'O fim da vigência precisa ser depois de hoje.');
            }
          });
          if (!ok) return false;
          return { tipo: t.value, valor: O.parseMoney(form.querySelector('#prop-valor').value), fim: form.querySelector('#prop-fim').value };
        }
      });
      if (!res) return;
      const ult = p.propostas[p.propostas.length - 1];
      if (res.tipo === 'aceite') {
        if (ult && !ult.resposta) ult.resposta = 'Aceita';
        p.propostas.push({ data: O.hoje(), condicao: 'Aceite', origem: 'Operadora', valor: res.valor, responsavel: u.nome, resposta: 'Aceita' });
        p.valor = res.valor;
        p.situacao = 'Vigente';
        p.inicio = O.hoje();
        p.fim = res.fim || '';
      } else {
        if (ult && !ult.resposta) ult.resposta = 'Contraproposta';
        p.propostas.push({ data: O.hoje(), condicao: res.tipo === 'empresa' ? 'Proposta' : 'Contraproposta', origem: res.tipo === 'empresa' ? quem : 'Operadora', valor: res.valor, responsavel: u.nome, resposta: '' });
        p.situacao = 'Em negociação';
      }
      grava(p);
      aplica(false, true);
      O.toast(res.tipo === 'aceite' ? 'Novo valor vigente: ' + O.fmt.money(res.valor) + '.' : 'Proposta registrada. O item ficou em negociação.');
    }

    aplica(false);
    selInfo.textContent = 'Selecione itens para suspender ou reativar.';
  }
})();
