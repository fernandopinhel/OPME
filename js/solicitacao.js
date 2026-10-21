/*
 * Gestão OPME: solicitação de compra (solicitacao.html?id=...&etapa=...).
 * Cinco etapas: dados, procedimentos e itens, negociação, aprovação e mapa.
 */
(function () {
  'use strict';

  const O = window.OPME;
  const h = O.h;

  const ETAPAS = [
    { chave: 'dados', titulo: 'Dados da solicitação', curto: 'Dados' },
    { chave: 'itens', titulo: 'Procedimentos e itens', curto: 'Itens' },
    { chave: 'negociacao', titulo: 'Negociação', curto: 'Negociação' },
    { chave: 'aprovacao', titulo: 'Aprovação', curto: 'Aprovação' },
    { chave: 'mapa', titulo: 'Mapa consolidado', curto: 'Mapa' }
  ];
  const ALCADA_DIRETORIA = 30000;
  const ABERTAS = ['Rascunho', 'Em negociação'];

  const id = Number(O.param('id')) || null;
  const existente = id ? O.db.get('solicitacoes', id) : null;

  const u = O.shell({
    ativo: 'solicitacoes',
    titulo: existente ? existente.numero : 'Nova solicitação',
    migalhas: [{ label: 'Início', href: 'inicio.html' }, { label: 'Solicitações de compra', href: 'solicitacoes.html' }, { label: existente ? existente.numero : 'Nova solicitação' }]
  });
  if (!u) return;

  const main = document.getElementById('conteudo');
  if (id && !existente) {
    main.replaceChildren(h('div', { class: 'card empty' },
      O.icon('alert'),
      h('h1', { text: 'Não encontramos essa solicitação' }),
      h('p', { text: 'Ela pode ter sido removida quando os dados de exemplo foram restaurados.' }),
      h('a', { class: 'btn btn--primary', href: 'solicitacoes.html', text: 'Ver todas as solicitações' })));
    return;
  }

  let sol = existente ? JSON.parse(JSON.stringify(existente)) : novaSolicitacao();
  let etapaAtual = ETAPAS.some((e) => e.chave === O.param('etapa')) ? O.param('etapa') : 'dados';
  let sujo = false;

  window.addEventListener('beforeunload', (ev) => {
    if (!sujo) return;
    ev.preventDefault();
    ev.returnValue = '';
  });

  function novaSolicitacao() {
    return {
      id: null, numero: '', hospitalId: null, numeroHospital: '', data: O.hoje(), dataCirurgia: '', unidadeOrigem: 1,
      prioridade: 'Eletiva', especialidade: '', medicoNome: '', medicoCrm: '', medicoUf: '', medicoTelefone: '',
      motivo: 'Nova solicitação', vinculada: '', pacienteNome: '', pacienteCarteira: '', senha: '', cid: '',
      procedimentos: [], diretoria: false, observacoes: '', itens: [], status: 'Rascunho', historico: []
    };
  }

  /* ------------------------------------------------------ Regras de preço */

  function tabelaHospital(itemId) {
    return O.db.all('precos').find((p) => p.tipo === 'hospital' && p.orgId === sol.hospitalId && p.itemId === itemId && O.situacaoPreco(p) === 'Vigente') || null;
  }
  function referenciaMercado(itemId) {
    const lista = O.db.all('precos').filter((p) => p.tipo === 'fornecedor' && p.itemId === itemId && O.situacaoPreco(p) === 'Vigente');
    if (!lista.length) return null;
    const menor = lista.reduce((a, b) => (b.valor < a.valor ? b : a));
    return { valor: menor.valor, fornecedor: O.nome.fornecedor(menor.orgId) };
  }
  const ultima = (it, origem) => it.negociacao.slice().reverse().find((n) => n.origem === origem && n.condicao !== 'Aceite') || null;

  /* ------------------------------------------------------- Persistência */

  function salvar(acao) {
    if (!sol.id) {
      sol.numero = O.db.nextNumero();
      sol.criadoPor = u.nome;
    }
    sol.historico = sol.historico || [];
    sol.historico.push({ quando: new Date().toISOString(), quem: u.nome, acao });
    const lista = O.db.all('solicitacoes');
    if (!sol.id) sol.id = lista.reduce((m, s) => Math.max(m, s.id), 0) + 1;
    // O banco guarda uma cópia: edições não salvas da tela não vazam para ele.
    const copia = JSON.parse(JSON.stringify(sol));
    const i = lista.findIndex((s) => s.id === sol.id);
    if (i >= 0) lista[i] = copia; else lista.push(copia);
    O.db.commit();
    sujo = false;
  }

  /* -------------------------------------------------- Cabeçalho e etapas */

  function disponivel(chave) {
    if (!sol.id) return chave === 'dados';
    if (chave === 'negociacao' || chave === 'mapa') return sol.itens.length > 0;
    if (chave === 'aprovacao') return sol.itens.length > 0 && ['Em aprovação', 'Aprovada', 'Reprovada', 'Parcialmente aprovada'].indexOf(sol.status) >= 0;
    return true;
  }
  function concluida(chave) {
    if (!sol.id) return false;
    if (chave === 'dados') return true;
    if (chave === 'itens') return sol.itens.length > 0 && sol.procedimentos.length > 0;
    if (chave === 'negociacao') return sol.itens.length > 0 && sol.itens.every((i) => i.situacao !== 'Pendente' && i.situacao !== 'Em negociação');
    if (chave === 'aprovacao') return ['Aprovada', 'Reprovada', 'Parcialmente aprovada'].indexOf(sol.status) >= 0;
    return false;
  }

  function cabecalho() {
    document.getElementById('pagina-titulo').textContent = sol.id ? sol.numero : 'Nova solicitação';
    const migalha = document.querySelector('.breadcrumbs [aria-current]');
    if (migalha && sol.numero) migalha.textContent = sol.numero;
    const desc = document.getElementById('pagina-descricao');
    if (sol.id) {
      desc.replaceChildren(h('ul', { class: 'meta' },
        h('li', null, O.icon('calendar'), 'Registrada em ' + O.fmt.date(sol.data) + ' por ' + (sol.criadoPor || u.nome)),
        h('li', null, O.icon('hospital'), 'Nº no hospital: ' + sol.numeroHospital),
        h('li', null, O.statusBadge(sol.status))));
      const t = O.totaisSolicitacao(sol);
      const hosp = O.db.get('hospitais', sol.hospitalId);
      const resumo = document.getElementById('resumo');
      resumo.hidden = false;
      resumo.replaceChildren(
        h('div', null, h('dt', { text: 'Hospital ou clínica' }), h('dd', { text: hosp ? hosp.nomeFantasia + ' · ' + hosp.cnpj : '' })),
        h('div', null, h('dt', { text: 'Paciente' }), h('dd', { text: sol.pacienteNome })),
        h('div', null, h('dt', { text: 'Prioridade' }), h('dd', null, O.statusBadge(sol.prioridade))),
        h('div', null, h('dt', { text: 'Pedido pelo hospital' }), h('dd', { text: O.fmt.money(t.hospital) })),
        h('div', null, h('dt', { text: 'Acordado até agora' }), h('dd', { text: t.acordado ? O.fmt.money(t.acordado) : 'Ainda nada' })));
    } else {
      desc.textContent = 'Comece pelos dados do pedido. Depois você inclui os itens e parte para a negociação.';
    }

    const ol = document.getElementById('etapas');
    ol.replaceChildren();
    ETAPAS.forEach((e, i) => {
      const ok = disponivel(e.chave);
      const feito = concluida(e.chave) && e.chave !== etapaAtual;
      const btn = h('button', {
        type: 'button',
        class: 'step-btn' + (feito ? ' is-done' : ''),
        'aria-current': e.chave === etapaAtual ? 'step' : null,
        disabled: !ok
      },
      h('span', { class: 'step-num', 'aria-hidden': 'true' }, feito ? O.icon('check') : String(i + 1)),
      h('span', null, h('span', { class: 'visually-hidden', text: 'Etapa ' + (i + 1) + ': ' }), e.titulo),
      feito ? h('span', { class: 'visually-hidden', text: ' (concluída)' }) : null);
      btn.addEventListener('click', () => irPara(e.chave, true));
      ol.appendChild(h('li', null, btn));
    });
  }

  async function irPara(chave, foco) {
    if (chave === etapaAtual && document.querySelector('#etapa h2')) return;
    if (sujo) {
      const sair = await O.confirmDialog({
        titulo: 'Sair desta etapa sem salvar?',
        descricao: 'Você mexeu em alguns campos e ainda não salvou. Se sair agora, essas mudanças se perdem.',
        cancelar: 'Continuar editando',
        confirmar: 'Sair sem salvar',
        tomBotao: 'danger'
      });
      if (!sair) return;
      sol = sol.id ? JSON.parse(JSON.stringify(O.db.get('solicitacoes', sol.id))) : novaSolicitacao();
      sujo = false;
    }
    etapaAtual = chave;
    render(foco);
  }

  function render(foco) {
    if (!disponivel(etapaAtual)) etapaAtual = sol.id ? 'itens' : 'dados';
    const idx = ETAPAS.findIndex((e) => e.chave === etapaAtual);
    const e = ETAPAS[idx];
    if (sol.id) {
      const url = 'solicitacao.html?id=' + sol.id + '&etapa=' + etapaAtual;
      window.history.replaceState(null, '', url);
    }
    document.title = 'Etapa ' + (idx + 1) + ' de 5: ' + e.titulo + ' | ' + (sol.numero || 'Nova solicitação') + ' | Gestão OPME';
    cabecalho();
    const area = document.getElementById('etapa');
    area.replaceChildren();
    const titulo = h('h2', { class: 'visually-hidden', id: 'etapa-titulo', tabindex: '-1', text: 'Etapa ' + (idx + 1) + ' de 5: ' + e.titulo });
    area.appendChild(titulo);
    ({ dados: etapaDados, itens: etapaItens, negociacao: etapaNegociacao, aprovacao: etapaAprovacao, mapa: etapaMapa })[etapaAtual](area);
    if (foco) {
      titulo.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function avisoSomenteLeitura(area) {
    area.appendChild(h('div', { class: 'alert alert--info' }, O.icon('lock'),
      h('div', { class: 'alert__body' }, h('p', { text: 'Essa solicitação está em "' + sol.status.toLowerCase() + '", então os dados não podem mais ser alterados aqui. Para mudar algo, reabra na etapa de aprovação.' }))));
  }

  function cartao(titulo, dica, ...conteudo) {
    const tid = O.uid('sec');
    return h('section', { class: 'card', 'aria-labelledby': tid },
      h('div', { class: 'card__head' }, h('div', null, h('h3', { id: tid, text: titulo }), dica ? h('p', { text: dica }) : null)),
      conteudo);
  }

  function rodape(esquerda, ...botoes) {
    return h('div', { class: 'form-actions' }, h('div', { class: 'btn-row' }, esquerda), h('div', { class: 'btn-row' }, botoes));
  }

  /* --------------------------------------------------- Etapa 1: dados */

  function etapaDados(area) {
    const editavel = ABERTAS.indexOf(sol.status) >= 0;
    if (!editavel) avisoSomenteLeitura(area);
    const form = h('form', { id: 'form-dados', novalidate: true });
    const opt = (lista) => lista.map((x) => ({ value: String(x.id), label: x.nomeFantasia || x.nome }));
    const hospitais = opt(O.db.all('hospitais').filter((x) => x.status === 'Ativo' || x.id === sol.hospitalId)).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
    const origens = opt(O.db.all('unidadesNegocio').filter((x) => x.tipo === 'Origem' && (x.status === 'Ativo' || x.id === sol.unidadeOrigem)));

    const f = {
      hospitalId: O.field({ id: 'sol-hospital', label: 'Hospital ou clínica', tipo: 'select', opcoes: hospitais, required: true, span: 6, valor: sol.hospitalId }),
      numeroHospital: O.field({ id: 'sol-numero-hospital', label: 'Nº da solicitação no hospital', required: true, max: 20, span: 3, valor: sol.numeroHospital, mask: 'upper' }),
      data: O.field({ id: 'sol-data', label: 'Data da solicitação', tipo: 'date', required: true, span: 3, valor: sol.data }),
      unidadeOrigem: O.field({ id: 'sol-origem', label: 'Unidade de negócio', tipo: 'select', opcoes: origens, required: true, span: 4, valor: sol.unidadeOrigem }),
      prioridade: O.choiceGroup({ id: 'sol-prioridade', name: 'prioridade', label: 'Prioridade', opcoes: ['Eletiva', 'Urgente'], required: true, valor: sol.prioridade, span: 4, box: true }),
      dataCirurgia: O.field({ id: 'sol-cirurgia', label: 'Data prevista da cirurgia', tipo: 'date', required: true, span: 4, valor: sol.dataCirurgia }),
      motivo: O.choiceGroup({ id: 'sol-motivo', name: 'motivo', label: 'Motivo do cadastro', opcoes: ['Nova solicitação', 'Reanálise'], required: true, valor: sol.motivo, span: 6, box: true }),
      vinculada: O.field({ id: 'sol-vinculada', label: 'Solicitação que será reanalisada', required: true, max: 9, span: 6, valor: sol.vinculada, mask: 'upper', dica: 'Número da operadora, como SC-010233.' }),
      pacienteNome: O.field({ id: 'sol-paciente', label: 'Nome do paciente', required: true, max: 100, span: 6, valor: sol.pacienteNome }),
      pacienteCarteira: O.field({ id: 'sol-carteira', label: 'Carteirinha', required: true, mask: 'digits', inputmode: 'numeric', max: 13, span: 3, valor: sol.pacienteCarteira, dica: '13 números.' }),
      senha: O.field({ id: 'sol-senha', label: 'Senha de autorização', required: true, mask: 'digits', inputmode: 'numeric', max: 12, span: 3, valor: sol.senha, dica: 'Gerada na guia do procedimento.' }),
      medicoNome: O.field({ id: 'sol-medico', label: 'Médico responsável', required: true, max: 100, span: 6, valor: sol.medicoNome }),
      medicoCrm: O.field({ id: 'sol-crm', label: 'CRM', required: true, rules: 'crm', mask: 'digits', inputmode: 'numeric', max: 7, span: 3, valor: sol.medicoCrm }),
      medicoUf: O.field({ id: 'sol-crm-uf', label: 'UF do CRM', tipo: 'select', opcoes: O.UFS, required: true, span: 3, valor: sol.medicoUf }),
      medicoTelefone: O.field({ id: 'sol-medico-tel', label: 'Telefone do médico', tipo: 'tel', rules: 'phone', mask: 'phone', inputmode: 'tel', max: 15, span: 4, opcional: true, valor: sol.medicoTelefone }),
      especialidade: O.field({ id: 'sol-especialidade', label: 'Especialidade', tipo: 'select', opcoes: O.ESPECIALIDADES, required: true, span: 4, valor: sol.especialidade }),
      cid: O.field({ id: 'sol-cid', label: 'CID principal', tipo: 'select', opcoes: O.CIDS, required: true, span: 4, valor: sol.cid }),
      observacoes: O.field({ id: 'sol-obs', label: 'Observações', tipo: 'textarea', max: 600, opcional: true, valor: sol.observacoes, dica: 'Algo que ajude quem vai negociar, até 600 caracteres.' })
    };
    const grade = (...els) => h('div', { class: 'form-grid' }, els);
    form.append(
      h('div', { 'data-summary-anchor': '' }),
      h('div', { class: 'stack' },
        cartao('Pedido do hospital', null, grade(f.hospitalId, f.numeroHospital, f.data, f.unidadeOrigem, f.prioridade, f.dataCirurgia, f.motivo, f.vinculada)),
        cartao('Paciente', 'Os dados aparecem só para quem participa da negociação.', grade(f.pacienteNome, f.pacienteCarteira, f.senha)),
        cartao('Médico e diagnóstico', null, grade(f.medicoNome, f.medicoCrm, f.medicoUf, f.medicoTelefone, f.especialidade, f.cid, f.observacoes))));

    const salvarBtn = h('button', { type: 'submit', class: 'btn btn--primary' }, 'Salvar e continuar', O.icon('arrow-right'));
    if (editavel) form.appendChild(rodape(h('p', null, 'Campos com ', h('span', { class: 'req', text: '*' }), ' são obrigatórios.'), salvarBtn));
    area.appendChild(form);
    O.applyMasks(form);

    const atualizaVinculo = () => { f.vinculada.hidden = !form.querySelector('[name="motivo"][value="Reanálise"]').checked; };
    form.addEventListener('change', atualizaVinculo);
    atualizaVinculo();
    form.addEventListener('input', () => { sujo = true; });
    form.addEventListener('change', () => { sujo = true; });

    if (!editavel) {
      form.querySelectorAll('input, select, textarea').forEach((el) => { el.disabled = true; });
      return;
    }

    // Trocar o hospital muda os valores tabelados dos itens já incluídos.
    if (sol.itens.length) {
      f.hospitalId.appendChild(h('p', { class: 'hint', text: 'Se trocar o hospital, os valores tabelados dos itens são recalculados.' }));
    }

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const ok = O.validateForm(form, {
        extra(addErro) {
          const d = f.data.control.value;
          const c = f.dataCirurgia.control.value;
          if (d && d > O.hoje()) addErro(f.data.control, 'A data da solicitação não pode ser depois de hoje.');
          if (d && c && c < d) addErro(f.dataCirurgia.control, 'A cirurgia precisa ser na mesma data da solicitação ou depois.');
          const carteira = f.pacienteCarteira.control.value;
          if (carteira && carteira.length !== 13) addErro(f.pacienteCarteira.control, 'A carteirinha tem 13 números.');
          if (!f.vinculada.hidden && f.vinculada.control.value) {
            const alvo = f.vinculada.control.value.trim();
            const achou = O.db.all('solicitacoes').find((s) => s.numero === alvo);
            if (!achou) addErro(f.vinculada.control, 'Não encontramos a solicitação ' + alvo + '. Confira o número.');
            else if (achou.id === sol.id) addErro(f.vinculada.control, 'Uma solicitação não pode reanalisar ela mesma.');
          }
        }
      });
      if (!ok) return;
      const antesHospital = sol.hospitalId;
      const val = (el) => el.control.value.trim();
      Object.assign(sol, {
        hospitalId: Number(val(f.hospitalId)), numeroHospital: val(f.numeroHospital), data: val(f.data),
        unidadeOrigem: Number(val(f.unidadeOrigem)), prioridade: form.querySelector('[name="prioridade"]:checked').value,
        dataCirurgia: val(f.dataCirurgia), motivo: form.querySelector('[name="motivo"]:checked').value,
        vinculada: f.vinculada.hidden ? '' : val(f.vinculada), pacienteNome: val(f.pacienteNome), pacienteCarteira: val(f.pacienteCarteira),
        senha: val(f.senha), medicoNome: val(f.medicoNome), medicoCrm: val(f.medicoCrm), medicoUf: val(f.medicoUf),
        medicoTelefone: val(f.medicoTelefone), especialidade: val(f.especialidade), cid: val(f.cid), observacoes: val(f.observacoes)
      });
      if (antesHospital && antesHospital !== sol.hospitalId) {
        sol.itens.forEach((it) => {
          const tab = tabelaHospital(it.itemId);
          if (tab && it.situacao === 'Pendente') it.valorHospital = tab.valor;
        });
      }
      const nova = !sol.id;
      salvar(nova ? 'Solicitação registrada' : 'Dados da solicitação alterados');
      O.store.set('destaque', { tipo: 'solicitacoes', id: sol.id });
      O.toast(nova ? 'Solicitação ' + sol.numero + ' registrada. Agora inclua os procedimentos e itens.' : 'Dados salvos.');
      etapaAtual = 'itens';
      render(true);
    });
  }

  /* ----------------------------------------- Etapa 2: procedimentos e itens */

  function etapaItens(area) {
    const editavel = ABERTAS.indexOf(sol.status) >= 0;
    if (!editavel) avisoSomenteLeitura(area);
    const form = h('form', { id: 'form-itens', novalidate: true });
    form.appendChild(h('div', { 'data-summary-anchor': '' }));
    const marcaSujo = () => { sujo = true; };

    /* Procedimentos */
    const listaProc = h('ul', { class: 'list-plain attention', id: 'lista-procedimentos' });
    const procSel = O.field({ id: 'add-procedimento', label: 'Procedimento', tipo: 'select', opcoes: O.PROCEDIMENTOS, span: 8, vazio: 'Escolha um procedimento' });
    procSel.control.dataset.novalidate = '1';
    const addProc = h('button', { type: 'button', class: 'btn' }, O.icon('plus'), 'Adicionar procedimento');
    const erroProc = h('p', { class: 'field-error', id: 'procedimentos-erro', hidden: true });

    function desenhaProc() {
      listaProc.replaceChildren();
      if (!sol.procedimentos.length) listaProc.appendChild(h('li', { class: 'muted', text: 'Nenhum procedimento ainda.' }));
      sol.procedimentos.forEach((p) => {
        const rem = editavel ? h('button', { type: 'button', class: 'btn btn--danger btn--sm', 'aria-label': 'Remover ' + O.nome.procedimento(p) }, O.icon('trash'), 'Remover') : null;
        if (rem) {
          rem.addEventListener('click', () => {
            sol.procedimentos = sol.procedimentos.filter((x) => x !== p);
            marcaSujo();
            desenhaProc();
            O.announce('Procedimento removido.');
            procSel.control.focus();
          });
        }
        listaProc.appendChild(h('li', null, h('span', { class: 'cell-title', text: O.nome.procedimento(p) }), rem));
      });
    }
    addProc.addEventListener('click', () => {
      const v = procSel.control.value;
      if (!v) { O.setErro(procSel.control, 'Escolha um procedimento para adicionar.'); procSel.control.focus(); return; }
      if (sol.procedimentos.indexOf(v) >= 0) { O.setErro(procSel.control, 'Esse procedimento já está na lista.'); procSel.control.focus(); return; }
      O.setErro(procSel.control, '');
      erroProc.hidden = true;
      sol.procedimentos.push(v);
      marcaSujo();
      desenhaProc();
      procSel.control.value = '';
      O.announce('Procedimento adicionado: ' + O.nome.procedimento(v) + '.');
    });
    desenhaProc();

    /* Itens */
    const catalogo = O.db.all('itens').filter((i) => i.status === 'Ativo');
    const itemSel = h('select', { class: 'select', id: 'add-item', 'data-novalidate': '1' }, h('option', { value: '', text: 'Escolha um item do catálogo' }));
    O.SUBGRUPOS.forEach((g) => {
      const doGrupo = catalogo.filter((i) => i.subgrupo === g);
      if (doGrupo.length) itemSel.appendChild(h('optgroup', { label: g }, doGrupo.map((i) => h('option', { value: String(i.id), text: i.descricao + ' · ' + O.nome.marca(i.fabricante) }))));
    });
    const itemCampo = h('div', { class: 'field span-8' }, h('label', { for: 'add-item', text: 'Item' }), itemSel);
    const qtdCampo = O.field({ id: 'add-qtd', label: 'Quantidade', tipo: 'number', min: 1, valor: '1', span: 4, inputmode: 'numeric' });
    qtdCampo.control.dataset.novalidate = '1';
    const addItem = h('button', { type: 'button', class: 'btn' }, O.icon('plus'), 'Incluir item');
    const areaTabela = h('div');
    const totais = h('dl', { class: 'totals' });

    addItem.addEventListener('click', () => {
      const v = Number(itemSel.value);
      const qtd = Number(qtdCampo.control.value);
      O.setErro(itemSel, '');
      O.setErro(qtdCampo.control, '');
      if (!v) { O.setErro(itemSel, 'Escolha um item para incluir.'); itemSel.focus(); return; }
      const item = O.db.get('itens', v);
      if (sol.itens.some((i) => i.itemId === v)) { O.setErro(itemSel, 'Esse item já está na solicitação. Ajuste a quantidade na tabela abaixo.'); itemSel.focus(); return; }
      if (item.validadeAnvisa < O.hoje()) {
        O.setErro(itemSel, 'O registro na Anvisa desse item venceu em ' + O.fmt.date(item.validadeAnvisa) + '. Ele precisa ser atualizado no cadastro antes de entrar numa solicitação.');
        itemSel.focus();
        return;
      }
      if (!qtd || qtd < 1) { O.setErro(qtdCampo.control, 'A quantidade precisa ser pelo menos 1.'); qtdCampo.control.focus(); return; }
      const tab = tabelaHospital(v);
      sol.itens.push({ itemId: v, quantidade: qtd, valorHospital: tab ? tab.valor : 0, valorOperadora: null, valorAcordado: null, situacao: 'Pendente', negociacao: [], motivoReprovacao: '' });
      marcaSujo();
      itemSel.value = '';
      qtdCampo.control.value = '1';
      desenhaItens();
      O.announce(item.descricao + ' incluído' + (tab ? ', com valor tabelado de ' + O.fmt.money(tab.valor) + '.' : '. Ele não tem valor tabelado com esse hospital, então informe o valor pedido.'));
      const alvo = tab ? itemSel : document.getElementById('valor-' + v);
      if (alvo) alvo.focus();
    });

    function desenhaItens() {
      areaTabela.replaceChildren();
      if (!sol.itens.length) {
        areaTabela.appendChild(h('div', { class: 'empty' }, O.icon('package'), h('strong', { text: 'Nenhum item ainda' }), h('p', { text: 'Escolha os materiais do catálogo acima. O valor tabelado com o hospital aparece sozinho.' })));
        totais.replaceChildren();
        return;
      }
      const tbody = h('tbody');
      sol.itens.forEach((it) => {
        const item = O.db.get('itens', it.itemId);
        const tab = tabelaHospital(it.itemId);
        const negociado = it.negociacao.length > 0;
        const qtd = h('input', { class: 'input', type: 'number', min: 1, max: 99, id: 'qtd-' + it.itemId, value: String(it.quantidade), required: true, inputmode: 'numeric', 'aria-label': 'Quantidade de ' + item.descricao, 'data-label': 'Quantidade de ' + item.descricao, disabled: !editavel });
        qtd.addEventListener('change', () => { it.quantidade = Number(qtd.value) || it.quantidade; marcaSujo(); atualizaTotais(); });
        let valorCel;
        if (tab || negociado) {
          valorCel = h('span', null, O.fmt.money(it.valorHospital), h('span', { class: 'cell-sub', text: tab ? 'Tabela vigente' : 'Já em negociação' }));
        } else {
          const inp = h('input', { class: 'input input--money', id: 'valor-' + it.itemId, 'data-mask': 'money', 'data-rules': 'money', inputmode: 'decimal', required: true, value: it.valorHospital ? O.fmt.decimal(it.valorHospital) : '', 'aria-label': 'Valor unitário pedido pelo hospital para ' + item.descricao, 'data-label': 'Valor pedido para ' + item.descricao, disabled: !editavel, placeholder: '0,00' });
          inp.addEventListener('change', () => { it.valorHospital = O.parseMoney(inp.value) || 0; marcaSujo(); atualizaTotais(); });
          valorCel = h('span', null, inp, h('span', { class: 'cell-sub' }, O.badge('Sem tabela', 'warning')));
        }
        const rem = editavel ? h('button', { type: 'button', class: 'btn btn--danger btn--sm btn--icon', 'aria-label': 'Remover ' + item.descricao }, O.icon('trash')) : null;
        if (rem) {
          rem.addEventListener('click', async () => {
            const ok = await O.confirmDialog({
              titulo: 'Remover este item?',
              descricao: item.descricao + (negociado ? '. O histórico de negociação dele também será apagado.' : '.'),
              confirmar: 'Remover item',
              tomBotao: 'danger'
            });
            if (!ok) return;
            sol.itens = sol.itens.filter((x) => x !== it);
            marcaSujo();
            desenhaItens();
            O.announce('Item removido.');
            itemSel.focus();
          });
        }
        tbody.appendChild(h('tr', null,
          h('th', { scope: 'row' }, h('span', { class: 'cell-title', text: item.descricao }), h('span', { class: 'cell-sub', text: 'TUSS ' + (item.tuss || 'sem código') + ' · ' + O.nome.marca(item.fabricante) + ' · ref. ' + item.refFabricante })),
          h('td', { class: 'num' }, qtd),
          h('td', { class: 'num' }, valorCel),
          h('td', { class: 'num', 'data-total': it.itemId, text: it.valorHospital ? O.fmt.money(it.valorHospital * it.quantidade) : '' }),
          h('td', null, O.statusBadge(it.situacao)),
          editavel ? h('td', { class: 'col-actions' }, rem) : null));
      });
      areaTabela.appendChild(h('div', { class: 'table-wrap', role: 'region', 'aria-labelledby': 'cap-itens', tabindex: '0' },
        h('table', { class: 'table' },
          h('caption', { class: 'visually-hidden', id: 'cap-itens', text: 'Itens da solicitação' }),
          h('thead', null, h('tr', null,
            h('th', { scope: 'col', text: 'Item' }), h('th', { scope: 'col', class: 'num', text: 'Qtd.' }), h('th', { scope: 'col', class: 'num', text: 'Valor unitário pedido' }),
            h('th', { scope: 'col', class: 'num', text: 'Total' }), h('th', { scope: 'col', text: 'Situação' }),
            editavel ? h('th', { scope: 'col', class: 'col-actions' }, h('span', { class: 'visually-hidden', text: 'Ações' })) : null)),
          tbody)));
      O.applyMasks(areaTabela);
      atualizaTotais();
    }

    function atualizaTotais() {
      sol.itens.forEach((it) => {
        const cel = areaTabela.querySelector('[data-total="' + it.itemId + '"]');
        if (cel) cel.textContent = it.valorHospital ? O.fmt.money(it.valorHospital * it.quantidade) : '';
      });
      const semTabela = sol.itens.filter((it) => !tabelaHospital(it.itemId)).length;
      const t = O.totaisSolicitacao(sol);
      totais.replaceChildren(
        h('div', null, h('dt', { text: 'Itens' }), h('dd', { text: sol.itens.length + ' (' + O.fmt.plural(t.qtd, 'unidade', 'unidades') + ')' })),
        h('div', null, h('dt', { text: 'Pedido pelo hospital' }), h('dd', { text: O.fmt.money(t.hospital) })),
        h('div', null, h('dt', { text: 'Itens sem valor tabelado' }), h('dd', { text: String(semTabela) })));
    }

    const addArea = editavel ? h('div', { class: 'form-grid' }, procSel, h('div', { class: 'span-4 align-end' }, addProc)) : null;
    form.appendChild(h('div', { class: 'stack' },
      cartao('Procedimentos', 'Pelo menos um procedimento, o principal primeiro.', addArea, listaProc, erroProc),
      cartao('Itens solicitados', 'Itens com registro na Anvisa vencido não podem ser incluídos.',
        editavel ? h('div', { class: 'form-grid' }, itemCampo, qtdCampo, h('div', { class: 'span-12 btn-row' }, addItem)) : null,
        h('div', { class: 'stack' }, areaTabela, totais))));
    desenhaItens();

    if (editavel) {
      form.appendChild(rodape(
        h('p', { text: 'Os valores sem tabela viram a proposta inicial do hospital na negociação.' }),
        h('button', { type: 'button', class: 'btn', id: 'salvar-itens' }, 'Salvar'),
        h('button', { type: 'submit', class: 'btn btn--primary' }, 'Salvar e negociar', O.icon('arrow-right'))));
    }
    area.appendChild(form);
    O.applyMasks(form);

    function valida() {
      return O.validateForm(form, {
        extra(addErro) {
          if (!sol.procedimentos.length) {
            addErro(procSel.control, 'Inclua pelo menos um procedimento.');
          }
          if (!sol.itens.length) addErro(itemSel, 'Inclua pelo menos um item.');
        }
      });
    }
    function persiste(proxima) {
      if (!valida()) return;
      sol.itens.forEach((it) => {
        if (!it.negociacao.length) {
          const tab = tabelaHospital(it.itemId);
          if (tab) it.valorHospital = tab.valor;
        }
      });
      if (proxima && sol.status === 'Rascunho') sol.status = 'Em negociação';
      salvar(proxima ? 'Itens conferidos e negociação iniciada' : 'Itens da solicitação alterados');
      O.toast(proxima ? 'Itens salvos. Vamos negociar!' : 'Itens salvos.');
      if (proxima) { etapaAtual = 'negociacao'; render(true); } else render(false);
    }
    if (editavel) {
      form.addEventListener('submit', (ev) => { ev.preventDefault(); persiste(true); });
      document.getElementById('salvar-itens').addEventListener('click', () => persiste(false));
    }
  }

  /* --------------------------------------------------- Etapa 3: negociação */

  function etapaNegociacao(area) {
    const editavel = ABERTAS.indexOf(sol.status) >= 0;
    if (!editavel) avisoSomenteLeitura(area);
    else {
      area.appendChild(h('div', { class: 'alert alert--info' }, O.icon('info'), h('div', { class: 'alert__body' },
        h('p', { text: 'Itens com valor tabelado podem ser aceitos de uma vez. Os outros você negocia um a um, registrando cada proposta e contraproposta.' }))));
    }

    const linhas = () => sol.itens.map((it) => {
      const item = O.db.get('itens', it.itemId);
      return { it, item, tab: tabelaHospital(it.itemId), ref: referenciaMercado(it.itemId) };
    });

    const areaTabela = h('div');
    const totais = h('dl', { class: 'totals' });

    function desenha() {
      areaTabela.replaceChildren();
      const tbody = h('tbody');
      linhas().forEach((l) => {
        const ultOp = ultima(l.it, 'Operadora');
        const negociar = h('button', { type: 'button', class: 'btn btn--sm' }, O.icon('handshake'), editavel ? 'Negociar' : 'Ver histórico');
        negociar.setAttribute('aria-label', (editavel ? 'Negociar ' : 'Ver histórico de ') + l.item.descricao);
        negociar.addEventListener('click', () => dialogoNegociacao(l));
        tbody.appendChild(h('tr', null,
          h('th', { scope: 'row' }, h('span', { class: 'cell-title', text: l.item.descricao }), h('span', { class: 'cell-sub', text: O.fmt.plural(l.it.quantidade, 'unidade', 'unidades') + (l.tab ? ' · tem valor tabelado' : ' · sem valor tabelado') })),
          h('td', { class: 'num' }, O.fmt.money(l.it.valorHospital)),
          h('td', { class: 'num' }, l.ref ? h('span', null, O.fmt.money(l.ref.valor), h('span', { class: 'cell-sub', text: l.ref.fornecedor })) : h('span', { class: 'muted', text: 'Sem referência' })),
          h('td', { class: 'num' }, ultOp ? O.fmt.money(ultOp.valor) : h('span', { class: 'muted', text: 'Nenhuma' })),
          h('td', { class: 'num' }, l.it.valorAcordado ? h('strong', { text: O.fmt.money(l.it.valorAcordado) }) : h('span', { class: 'muted', text: 'A definir' })),
          h('td', null, O.statusBadge(l.it.situacao)),
          h('td', { class: 'col-actions' }, negociar)));
      });
      areaTabela.appendChild(h('div', { class: 'table-wrap', role: 'region', 'aria-labelledby': 'cap-neg', tabindex: '0' },
        h('table', { class: 'table' },
          h('caption', { class: 'visually-hidden', id: 'cap-neg', text: 'Negociação dos itens (valores unitários)' }),
          h('thead', null, h('tr', null,
            h('th', { scope: 'col', text: 'Item' }), h('th', { scope: 'col', class: 'num', text: 'Pedido pelo hospital' }),
            h('th', { scope: 'col', class: 'num', text: 'Menor valor de fornecedor' }), h('th', { scope: 'col', class: 'num', text: 'Contraproposta da operadora' }),
            h('th', { scope: 'col', class: 'num', text: 'Acordado' }), h('th', { scope: 'col', text: 'Situação' }),
            h('th', { scope: 'col', class: 'col-actions' }, h('span', { class: 'visually-hidden', text: 'Ações' })))),
          tbody)));
      const t = O.totaisSolicitacao(sol);
      totais.replaceChildren(
        h('div', null, h('dt', { text: 'Pedido pelo hospital' }), h('dd', { text: O.fmt.money(t.hospital) })),
        h('div', null, h('dt', { text: 'Acordado até agora' }), h('dd', { text: O.fmt.money(t.acordado) })),
        h('div', { class: 'is-good' }, h('dt', { text: 'Economia nos itens acordados' }), h('dd', { text: t.economia > 0 ? O.fmt.money(t.economia) + ' (' + O.fmt.pct(t.economia / t.hospitalAcordados) + ')' : O.fmt.money(0) })));
      cabecalho();
    }

    const aceitarTab = h('button', { type: 'button', class: 'btn' }, O.icon('check'), 'Aceitar valores tabelados');
    aceitarTab.addEventListener('click', async () => {
      const pend = linhas().filter((l) => l.it.situacao === 'Pendente' || l.it.situacao === 'Em negociação');
      const comTab = pend.filter((l) => l.tab);
      const semTab = pend.filter((l) => !l.tab);
      if (!pend.length) { O.toast('Todos os itens já têm valor acordado.'); return; }
      if (!comTab.length) {
        await O.dialog({
          titulo: 'Nenhum item com valor tabelado',
          icone: 'info',
          montar(c) {
            c.append(h('p', { text: 'Esses itens não têm valor tabelado com o hospital. Negocie um a um pelo botão "Negociar":' }), h('ul', null, semTab.map((l) => h('li', { text: l.item.descricao }))));
          },
          somenteOk: true,
          confirmar: 'Entendi'
        });
        return;
      }
      const ok = await O.confirmDialog({
        titulo: 'Aceitar os valores tabelados?',
        icone: 'check',
        tom: 'success',
        montar(c) {
          c.append(h('p', { text: 'Estes itens vão ficar com o valor da tabela vigente do hospital:' }),
            h('ul', null, comTab.map((l) => h('li', { text: l.item.descricao + ': ' + O.fmt.money(l.tab.valor) }))));
          if (semTab.length) c.append(h('p', { text: 'Os itens sem tabela (' + semTab.length + ') continuam para negociação manual.' }));
        },
        confirmar: 'Aceitar valores',
        tomBotao: 'success'
      });
      if (!ok) return;
      comTab.forEach((l) => {
        l.it.valorAcordado = l.tab.valor;
        l.it.situacao = 'Acordado';
        l.it.negociacao.push({ data: new Date().toISOString(), origem: 'Operadora', condicao: 'Aceite', valor: l.tab.valor, nota: 'Aceito o valor da tabela vigente.', responsavel: u.nome });
      });
      salvar('Valores tabelados aceitos (' + O.fmt.plural(comTab.length, 'item', 'itens') + ')');
      desenha();
      O.toast(O.fmt.plural(comTab.length, 'item ficou', 'itens ficaram') + ' com o valor da tabela.');
    });

    const enviar = h('button', { type: 'button', class: 'btn btn--primary' }, 'Enviar para aprovação', O.icon('arrow-right'));
    const erroEnvio = h('div', { class: 'alert alert--error', role: 'alert', hidden: true });
    enviar.addEventListener('click', async () => {
      const faltam = sol.itens.filter((i) => i.situacao !== 'Acordado');
      if (faltam.length) {
        erroEnvio.hidden = false;
        erroEnvio.replaceChildren(O.icon('alert'), h('div', { class: 'alert__body' },
          h('p', { class: 'alert__title', text: 'Ainda ' + (faltam.length === 1 ? 'falta 1 item' : 'faltam ' + faltam.length + ' itens') + ' sem valor acordado:' }),
          h('ul', null, faltam.map((i) => h('li', { text: O.nome.item(i.itemId) })))));
        return;
      }
      erroEnvio.hidden = true;
      const t = O.totaisSolicitacao(sol);
      const ok = await O.confirmDialog({
        titulo: 'Enviar para aprovação?',
        icone: 'shield',
        tom: 'success',
        descricao: 'Valor acordado: ' + O.fmt.money(t.acordado) + '. Depois de enviar, os valores ficam travados até a aprovação.' + (t.acordado > ALCADA_DIRETORIA ? ' Pelo valor, vai precisar do aval da diretoria.' : ''),
        confirmar: 'Enviar',
        tomBotao: 'success'
      });
      if (!ok) return;
      sol.status = 'Em aprovação';
      salvar('Enviada para aprovação');
      O.toast('Solicitação enviada para aprovação.');
      etapaAtual = 'aprovacao';
      render(true);
    });

    area.appendChild(h('div', { class: 'stack' },
      cartao('Itens em negociação', 'Valores unitários. O menor valor entre fornecedores serve de referência para a contraproposta.',
        editavel ? h('div', { class: 'btn-row' }, aceitarTab) : null, areaTabela, totais),
      erroEnvio));
    if (editavel) area.appendChild(rodape(h('p', { text: 'Todos os itens precisam de valor acordado antes da aprovação.' }), enviar));
    desenha();

    async function dialogoNegociacao(l) {
      const it = l.it;
      const ultHosp = ultima(it, 'Hospital');
      const ultOp = ultima(it, 'Operadora');
      const OPCOES = [
        { value: 'contra', label: 'A operadora fez uma contraproposta' },
        { value: 'nova', label: 'O hospital fez uma nova proposta' },
        { value: 'aceiteHosp', label: 'O hospital aceitou a contraproposta' },
        { value: 'aceiteOp', label: 'A operadora aceitou a proposta do hospital' }
      ];
      const res = await O.dialog({
        titulo: l.item.descricao,
        wide: true,
        icone: 'handshake',
        confirmar: 'Registrar',
        cancelar: editavel ? 'Cancelar' : 'Fechar',
        somenteOk: false,
        montar(corpo, fechar, form) {
          corpo.appendChild(h('ul', { class: 'meta' },
            h('li', null, O.icon('package'), O.fmt.plural(it.quantidade, 'unidade', 'unidades')),
            h('li', null, O.icon('table'), l.tab ? 'Tabela do hospital: ' + O.fmt.money(l.tab.valor) : 'Sem valor tabelado'),
            h('li', null, O.icon('trending-down'), l.ref ? 'Menor valor de fornecedor: ' + O.fmt.money(l.ref.valor) + ' (' + l.ref.fornecedor + ')' : 'Sem referência de fornecedor')));
          const hist = h('div', { class: 'stack' });
          corpo.appendChild(h('h3', { text: 'Histórico de propostas' }));
          if (!it.negociacao.length) hist.appendChild(h('p', { class: 'muted', text: 'Nenhuma proposta registrada ainda.' }));
          else {
            hist.appendChild(h('div', { class: 'table-wrap', role: 'region', 'aria-label': 'Histórico de propostas', tabindex: '0' }, h('table', { class: 'table table--compact' },
              h('thead', null, h('tr', null, ['Data', 'Quem', 'O quê', 'Valor unitário', 'Observação'].map((t, i) => h('th', { scope: 'col', class: i === 3 ? 'num' : '', text: t })))),
              h('tbody', null, it.negociacao.map((n) => h('tr', null,
                h('td', { class: 'nowrap', text: O.fmt.dateTime(n.data) }),
                h('td', { text: n.origem }),
                h('td', { text: n.condicao }),
                h('td', { class: 'num', text: O.fmt.money(n.valor) }),
                h('td', { text: n.nota || '' })))))));
          }
          corpo.appendChild(hist);
          if (!editavel) {
            form.querySelector('[type="submit"]').hidden = true;
            return;
          }
          const tipo = O.choiceGroup({ id: 'neg-tipo', name: 'neg-tipo', label: 'O que aconteceu agora?', opcoes: OPCOES, required: true, box: true });
          const valor = O.field({ id: 'neg-valor', label: 'Valor unitário', mask: 'money', rules: 'money', required: true, inputmode: 'decimal', placeholder: '0,00', span: 6 });
          const nota = O.field({ id: 'neg-nota', label: 'Observação', tipo: 'textarea', max: 300, opcional: true });
          corpo.append(h('h3', { text: 'Registrar novidade' }), h('div', { class: 'form-grid' }, tipo, valor, nota));
          const atualiza = () => {
            const m = tipo.querySelector('input:checked');
            const v = m ? m.value : '';
            const aceite = v === 'aceiteHosp' || v === 'aceiteOp';
            valor.control.readOnly = aceite;
            if (v === 'aceiteHosp') valor.control.value = ultOp ? O.fmt.decimal(ultOp.valor) : '';
            if (v === 'aceiteOp') valor.control.value = ultHosp ? O.fmt.decimal(ultHosp.valor) : O.fmt.decimal(it.valorHospital);
          };
          tipo.addEventListener('change', atualiza);
        },
        aoConfirmar(form) {
          if (!editavel) return null;
          const tipoEl = form.querySelector('[name="neg-tipo"]:checked');
          const valorEl = form.querySelector('#neg-valor');
          const ok = O.validateForm(form, {
            resumoTitulo: 'Confira estes pontos:',
            extra(addErro) {
              if (!tipoEl) return;
              const v = O.parseMoney(valorEl.value);
              const refHosp = ultHosp ? ultHosp.valor : it.valorHospital;
              if (tipoEl.value === 'contra' && v && v >= refHosp) addErro(valorEl, 'A contraproposta precisa ser menor que a última proposta do hospital (' + O.fmt.money(refHosp) + ').');
              if (tipoEl.value === 'aceiteHosp' && !ultOp) addErro(tipoEl, 'Ainda não existe contraproposta da operadora para o hospital aceitar.');
            }
          });
          if (!ok) return false;
          return { tipo: tipoEl.value, valor: O.parseMoney(valorEl.value), nota: form.querySelector('#neg-nota').value.trim() };
        }
      });
      if (!res) return;
      const mapa = {
        contra: { origem: 'Operadora', condicao: 'Contraproposta' },
        nova: { origem: 'Hospital', condicao: 'Nova proposta' },
        aceiteHosp: { origem: 'Hospital', condicao: 'Aceite' },
        aceiteOp: { origem: 'Operadora', condicao: 'Aceite' }
      }[res.tipo];
      if (!it.negociacao.length) {
        it.negociacao.push({ data: new Date().toISOString(), origem: 'Hospital', condicao: 'Proposta inicial', valor: it.valorHospital, nota: '', responsavel: u.nome });
      }
      it.negociacao.push({ data: new Date().toISOString(), origem: mapa.origem, condicao: mapa.condicao, valor: res.valor, nota: res.nota, responsavel: u.nome });
      if (res.tipo === 'contra') it.valorOperadora = res.valor;
      if (mapa.condicao === 'Aceite') {
        it.valorAcordado = res.valor;
        it.situacao = 'Acordado';
      } else {
        it.valorAcordado = null;
        it.situacao = 'Em negociação';
      }
      salvar(mapa.condicao + (mapa.condicao === 'Aceite' ? ' registrado: ' : ' registrada: ') + l.item.descricao);
      desenha();
      O.toast(mapa.condicao === 'Aceite' ? 'Valor acordado: ' + O.fmt.money(res.valor) + ' por unidade.' : mapa.condicao + ' registrada.');
    }
  }

  /* ---------------------------------------------------- Etapa 4: aprovação */

  function etapaAprovacao(area) {
    const t = O.totaisSolicitacao(sol);
    const concluidaSol = ['Aprovada', 'Reprovada', 'Parcialmente aprovada'].indexOf(sol.status) >= 0;
    const precisaDiretoria = t.acordado > ALCADA_DIRETORIA;

    const diretoria = h('input', { type: 'checkbox', id: 'aval-diretoria', checked: !!sol.diretoria, disabled: concluidaSol });
    const avisoDir = precisaDiretoria ? h('div', { class: 'alert alert--warning' }, O.icon('shield'), h('div', { class: 'alert__body' },
      h('p', { class: 'alert__title', text: 'Essa solicitação precisa do aval da diretoria' }),
      h('p', { text: 'O valor acordado (' + O.fmt.money(t.acordado) + ') passa da alçada de ' + O.fmt.money(ALCADA_DIRETORIA) + '. Registre o aval antes de aprovar.' }),
      h('label', { class: 'choice', for: 'aval-diretoria' }, diretoria, 'Aval da diretoria registrado'))) : null;
    diretoria.addEventListener('change', () => {
      sol.diretoria = diretoria.checked;
      salvar(diretoria.checked ? 'Aval da diretoria registrado' : 'Aval da diretoria retirado');
      O.announce(diretoria.checked ? 'Aval da diretoria registrado.' : 'Aval da diretoria retirado.');
    });

    const linhas = sol.itens.map((it) => ({ it, item: O.db.get('itens', it.itemId) }));
    const areaTabela = h('div');
    const selInfo = h('p', { class: 'muted', 'aria-live': 'polite', text: 'Nenhum item selecionado.' });
    const tabela = O.dataTable({
      container: areaTabela,
      caption: 'Itens para aprovação',
      rows: linhas,
      rowKey: (l) => l.it.itemId,
      rowLabel: (l) => l.item.descricao,
      selectable: !concluidaSol,
      isSelectable: (l) => l.it.situacao === 'Acordado',
      paginate: false,
      columns: [
        { key: 'item', label: 'Item', render: (l) => h('span', null, h('span', { class: 'cell-title', text: l.item.descricao }), l.it.motivoReprovacao && l.it.situacao === 'Reprovado' ? h('span', { class: 'cell-sub', text: 'Motivo: ' + l.it.motivoReprovacao }) : null) },
        { key: 'qtd', label: 'Qtd.', num: true, render: (l) => String(l.it.quantidade) },
        { key: 'unit', label: 'Acordado (un.)', num: true, render: (l) => O.fmt.money(l.it.valorAcordado) },
        { key: 'total', label: 'Total acordado', num: true, render: (l) => O.fmt.money(l.it.valorAcordado * l.it.quantidade) },
        { key: 'eco', label: 'Economia', num: true, render: (l) => O.fmt.money((l.it.valorHospital - l.it.valorAcordado) * l.it.quantidade) },
        { key: 'sit', label: 'Situação', render: (l) => O.statusBadge(l.it.situacao) }
      ],
      onSelect(sel) {
        const total = linhas.filter((l) => sel.indexOf(l.it.itemId) >= 0).reduce((s, l) => s + l.it.valorAcordado * l.it.quantidade, 0);
        selInfo.textContent = sel.length ? O.fmt.plural(sel.length, 'item selecionado', 'itens selecionados') + ', somando ' + O.fmt.money(total) + '.' : 'Nenhum item selecionado.';
      }
    });

    const erro = h('div', { class: 'alert alert--error', role: 'alert', hidden: true });
    const mostraErro = (msg) => { erro.hidden = false; erro.replaceChildren(O.icon('alert'), h('div', { class: 'alert__body' }, h('p', { text: msg }))); };

    async function decidir(aprovar) {
      erro.hidden = true;
      const sel = tabela.selected();
      if (!sel.length) { mostraErro('Selecione pelo menos um item na tabela.'); return; }
      if (aprovar && precisaDiretoria && !sol.diretoria) { mostraErro('Antes de aprovar, registre o aval da diretoria no aviso acima.'); diretoria.focus(); return; }
      const escolhidos = linhas.filter((l) => sel.indexOf(l.it.itemId) >= 0);
      const total = escolhidos.reduce((s, l) => s + l.it.valorAcordado * l.it.quantidade, 0);
      const res = await O.dialog({
        titulo: aprovar ? 'Aprovar ' + O.fmt.plural(escolhidos.length, 'item', 'itens') + '?' : 'Reprovar ' + O.fmt.plural(escolhidos.length, 'item', 'itens') + '?',
        icone: aprovar ? 'check-circle' : 'x-circle',
        tom: aprovar ? 'success' : 'danger',
        confirmar: aprovar ? 'Aprovar' : 'Reprovar',
        tomBotao: aprovar ? 'success' : 'danger',
        montar(c) {
          c.append(h('ul', null, escolhidos.map((l) => h('li', { text: l.item.descricao + ' (' + O.fmt.money(l.it.valorAcordado * l.it.quantidade) + ')' }))),
            h('p', null, 'Total: ', h('strong', { text: O.fmt.money(total) })));
          if (!aprovar) c.append(h('div', { class: 'form-grid' }, O.field({ id: 'motivo-reprova', label: 'Motivo da reprovação', tipo: 'textarea', required: true, max: 300, dica: 'O hospital recebe esse motivo.' })));
        },
        aoConfirmar(form) {
          if (aprovar) return true;
          if (!O.validateForm(form)) return false;
          return form.querySelector('#motivo-reprova').value.trim();
        }
      });
      if (!res) return;
      escolhidos.forEach((l) => {
        l.it.situacao = aprovar ? 'Aprovado' : 'Reprovado';
        l.it.motivoReprovacao = aprovar ? '' : res;
      });
      const restantes = sol.itens.filter((i) => i.situacao === 'Acordado').length;
      if (!restantes) {
        const aprov = sol.itens.filter((i) => i.situacao === 'Aprovado').length;
        sol.status = aprov === sol.itens.length ? 'Aprovada' : aprov === 0 ? 'Reprovada' : 'Parcialmente aprovada';
      }
      salvar((aprovar ? 'Itens aprovados: ' : 'Itens reprovados: ') + escolhidos.length);
      O.toast(O.fmt.plural(escolhidos.length, 'item', 'itens') + (aprovar ? (escolhidos.length === 1 ? ' aprovado.' : ' aprovados.') : (escolhidos.length === 1 ? ' reprovado.' : ' reprovados.')) + (!restantes ? ' A solicitação ficou como "' + sol.status.toLowerCase() + '".' : ''));
      render(true);
    }

    const acoes = concluidaSol
      ? h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn', id: 'reabrir' }, O.icon('refresh'), 'Reabrir para negociação'))
      : h('div', { class: 'btn-row' },
        h('button', { type: 'button', class: 'btn btn--danger', onClick: () => decidir(false) }, O.icon('x-circle'), 'Reprovar selecionados'),
        h('button', { type: 'button', class: 'btn btn--success-solid', onClick: () => decidir(true) }, O.icon('check-circle'), 'Aprovar selecionados'));

    area.appendChild(h('div', { class: 'stack' },
      concluidaSol ? h('div', { class: 'alert alert--' + (sol.status === 'Aprovada' ? 'success' : sol.status === 'Reprovada' ? 'error' : 'warning') }, O.icon(sol.status === 'Reprovada' ? 'x-circle' : 'check-circle'),
        h('div', { class: 'alert__body' }, h('p', { class: 'alert__title', text: 'Solicitação ' + sol.status.toLowerCase() }), h('p', { text: 'Aprovado: ' + O.fmt.money(t.aprovado) + '. O mapa consolidado tem o resumo completo para imprimir.' }))) : null,
      avisoDir,
      cartao('Itens negociados', concluidaSol ? 'Decisão registrada para todos os itens.' : 'Selecione os itens e aprove ou reprove. Dá para decidir em partes.',
        areaTabela, concluidaSol ? null : selInfo),
      erro,
      acoes));

    const reabrir = document.getElementById('reabrir');
    if (reabrir) {
      reabrir.addEventListener('click', async () => {
        const ok = await O.confirmDialog({
          titulo: 'Reabrir para negociação?',
          descricao: 'As decisões de aprovação são desfeitas e a solicitação volta para "em negociação". O histórico continua guardado.',
          confirmar: 'Reabrir'
        });
        if (!ok) return;
        sol.itens.forEach((i) => { if (i.situacao === 'Aprovado' || i.situacao === 'Reprovado') { i.situacao = 'Acordado'; i.motivoReprovacao = ''; } });
        sol.status = 'Em negociação';
        sol.diretoria = false;
        salvar('Solicitação reaberta para negociação');
        O.toast('Solicitação reaberta. Ela voltou para a negociação.');
        etapaAtual = 'negociacao';
        render(true);
      });
    }
  }

  /* -------------------------------------------------- Etapa 5: mapa */

  function etapaMapa(area) {
    const t = O.totaisSolicitacao(sol);
    const linhas = sol.itens.map((it) => ({ it, item: O.db.get('itens', it.itemId) }));
    const areaTabela = h('div');
    const colunas = [
      { key: 'anvisa', label: 'Registro Anvisa', render: (l) => l.item.anvisa, csv: (l) => l.item.anvisa },
      { key: 'material', label: 'Material', class: 'col-item', render: (l) => h('span', null, h('span', { class: 'cell-title', text: l.item.descricao }), h('span', { class: 'cell-sub', text: O.nome.marca(l.item.fabricante) + ' · ref. ' + l.item.refFabricante })), csv: (l) => l.item.descricao },
      { key: 'qtd', label: 'Qtd.', num: true, render: (l) => String(l.it.quantidade), csv: (l) => l.it.quantidade },
      { key: 'hu', label: 'Hospital (un.)', num: true, render: (l) => O.fmt.money(l.it.valorHospital), csv: (l) => O.fmt.decimal(l.it.valorHospital) },
      { key: 'ht', label: 'Hospital (total)', num: true, render: (l) => O.fmt.money(l.it.valorHospital * l.it.quantidade), csv: (l) => O.fmt.decimal(l.it.valorHospital * l.it.quantidade) },
      { key: 'ou', label: 'Operadora (un.)', num: true, render: (l) => (l.it.valorOperadora ? O.fmt.money(l.it.valorOperadora) : 'Sem contraproposta'), csv: (l) => (l.it.valorOperadora ? O.fmt.decimal(l.it.valorOperadora) : '') },
      { key: 'au', label: 'Acordado (un.)', num: true, render: (l) => (l.it.valorAcordado ? O.fmt.money(l.it.valorAcordado) : 'A definir'), csv: (l) => (l.it.valorAcordado ? O.fmt.decimal(l.it.valorAcordado) : '') },
      { key: 'at', label: 'Acordado (total)', num: true, render: (l) => (l.it.valorAcordado ? O.fmt.money(l.it.valorAcordado * l.it.quantidade) : ''), csv: (l) => (l.it.valorAcordado ? O.fmt.decimal(l.it.valorAcordado * l.it.quantidade) : '') },
      { key: 'desc', label: 'Desconto', num: true, render: (l) => (l.it.valorAcordado ? O.fmt.pct(1 - l.it.valorAcordado / l.it.valorHospital) : ''), csv: (l) => (l.it.valorAcordado ? O.fmt.pct(1 - l.it.valorAcordado / l.it.valorHospital) : '') },
      { key: 'sit', label: 'Situação', render: (l) => O.statusBadge(l.it.situacao), csv: (l) => l.it.situacao }
    ];
    O.dataTable({
      container: areaTabela,
      caption: 'Mapa consolidado da solicitação ' + sol.numero,
      rows: linhas,
      rowKey: (l) => l.it.itemId,
      rowHeader: false,
      paginate: false,
      compact: true,
      columns: colunas,
      footer: () => h('tfoot', null, h('tr', null,
        h('th', { scope: 'row', colspan: '2', text: 'Total geral' }),
        h('td', { class: 'num', text: String(t.qtd) }),
        h('td'),
        h('td', { class: 'num', text: O.fmt.money(t.hospital) }),
        h('td'),
        h('td'),
        h('td', { class: 'num', text: O.fmt.money(t.acordado) }),
        h('td', { class: 'num', text: t.hospitalAcordados ? O.fmt.pct(t.economia / t.hospitalAcordados) : '' }),
        h('td')))
    });

    const hist = h('ol', { class: 'history' });
    (sol.historico || []).slice().reverse().forEach((x) => hist.appendChild(h('li', null, h('strong', { text: x.acao }), ' por ' + x.quem, h('time', { datetime: x.quando, text: O.fmt.dateTime(x.quando) }))));

    const imprimir = h('button', { type: 'button', class: 'btn btn--sm' }, O.icon('print'), 'Imprimir');
    imprimir.addEventListener('click', () => window.print());
    const exportar = h('button', { type: 'button', class: 'btn btn--sm' }, O.icon('download'), 'Exportar CSV');
    exportar.addEventListener('click', () => O.downloadCsv(sol.numero + '-mapa.csv', colunas, linhas));

    const tid = O.uid('sec');
    area.appendChild(h('div', { class: 'stack' },
      h('section', { class: 'card card--flush', 'aria-labelledby': tid },
        h('div', { class: 'table-toolbar' },
          h('div', null, h('h3', { id: tid, text: 'Mapa consolidado' }), h('p', { text: O.nome.hospital(sol.hospitalId) + ' · paciente ' + sol.pacienteNome + ' · ' + O.nome.cid(sol.cid) })),
          h('div', { class: 'btn-row' }, exportar, imprimir)),
        areaTabela),
      h('dl', { class: 'totals' },
        h('div', null, h('dt', { text: 'Pedido pelo hospital' }), h('dd', { text: O.fmt.money(t.hospital) })),
        h('div', null, h('dt', { text: 'Valor acordado' }), h('dd', { text: O.fmt.money(t.acordado) })),
        h('div', { class: 'is-good' }, h('dt', { text: 'Economia' }), h('dd', { text: O.fmt.money(t.economia) + (t.hospitalAcordados ? ' (' + O.fmt.pct(t.economia / t.hospitalAcordados) + ')' : '') })),
        h('div', null, h('dt', { text: 'Aprovado' }), h('dd', { text: O.fmt.money(t.aprovado) }))),
      cartao('Procedimentos', null, h('ul', null, sol.procedimentos.map((p) => h('li', { text: O.nome.procedimento(p) })))),
      cartao('Histórico da solicitação', 'Tudo o que aconteceu, do mais recente ao mais antigo.', hist)));
  }

  render(false);
})();
