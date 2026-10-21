/* Gestão OPME: tela de login (sem autenticação real). */
(function () {
  'use strict';

  const O = window.OPME;
  const form = document.getElementById('login-form');
  const matricula = document.getElementById('login-matricula');
  const senha = document.getElementById('login-senha');
  const verSenha = document.getElementById('login-ver-senha');

  O.applyMasks(form);

  // Quem já está com a sessão aberta vai direto para o início.
  if (O.usuario()) {
    window.location.replace('inicio.html');
    return;
  }

  const f = O.takeFlash();
  if (f) O.toast(f.mensagem, f.tipo);

  verSenha.addEventListener('click', () => {
    const mostrar = senha.type === 'password';
    senha.type = mostrar ? 'text' : 'password';
    verSenha.setAttribute('aria-pressed', String(mostrar));
    verSenha.setAttribute('aria-label', mostrar ? 'Esconder senha' : 'Mostrar senha');
    verSenha.querySelector('use').setAttribute('href', 'img/icons.svg#i-' + (mostrar ? 'eye-off' : 'eye'));
  });

  document.getElementById('login-demo').addEventListener('click', () => {
    matricula.value = 'G754632';
    senha.value = 'demo1234';
    O.clearErrors(form);
    O.announce('Matrícula e senha de demonstração preenchidas. Agora é só entrar.');
    form.querySelector('[type="submit"]').focus();
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    let usuario = null;
    const ok = O.validateForm(form, {
      resumoTitulo: 'Para entrar, confira estes pontos:',
      extra(addErro) {
        if (senha.value && senha.value.length < 6) {
          addErro(senha, 'A senha tem pelo menos 6 caracteres.');
          return;
        }
        if (!O.valida.matricula(matricula.value) || !senha.value) return;
        usuario = O.db.all('usuarios').find((u) => u.matricula === matricula.value.trim());
        if (!usuario) addErro(matricula, 'Não encontramos essa matrícula. Que tal usar o acesso de demonstração?');
        else if (usuario.status !== 'Ativo') addErro(matricula, 'Esse usuário está inativo. Fale com quem administra o sistema.');
      }
    });
    if (!ok) return;

    O.store.set('usuario', {
      id: usuario.id,
      nome: usuario.nome,
      matricula: usuario.matricula,
      perfil: O.nome.grupo(usuario.grupo)
    });
    window.location.href = 'inicio.html';
  });
})();
