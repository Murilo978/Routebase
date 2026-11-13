document.addEventListener('DOMContentLoaded', () => {
  // Base da API Flask (ajuste caso rode no mesmo domínio usando apenas '/api')
  const API_BASE_URL = 'http://127.0.0.1:5000/api';

  const loginForm = document.getElementById('loginForm');
  const nomeInput = document.getElementById('nomeInput');
  const emailInput = document.getElementById('emailInput');
  const nomeError = document.getElementById('nomeError');
  const emailError = document.getElementById('emailError');
  const alertBox = document.getElementById('alertBox');
  const submitBtn = document.getElementById('submitBtn');

  function exibirAlerta(mensagem, tipo = 'error') {
    alertBox.textContent = mensagem;
    alertBox.className = 'alert-box';
    alertBox.classList.add(tipo === 'success' ? 'show-success' : 'show-error');
  }

  function limparFeedbacks() {
    alertBox.className = 'alert-box';
    alertBox.textContent = '';
    nomeError.textContent = '';
    emailError.textContent = '';
    nomeInput.classList.remove('input-invalid');
    emailInput.classList.remove('input-invalid');
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    limparFeedbacks();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    let formularioValido = true;

    // 1. Validação dos campos obrigatórios
    if (!nome || nome.length < 2) {
      nomeError.textContent = 'Por favor, informe seu nome completo.';
      nomeInput.classList.add('input-invalid');
      formularioValido = false;
    }

    if (!email || !validarEmail(email)) {
      emailError.textContent = 'Por favor, informe um e-mail válido.';
      emailInput.classList.add('input-invalid');
      formularioValido = false;
    }

    if (!formularioValido) return;

    // Estado de carregamento no botão
    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Verificando acesso...';

    try {
      // Verifica primeiro na listagem de usuários (/api/usuarios) se o e-mail existe,
      // garantindo que a tela de Login não crie uma conta acidentalmente se o usuário não existir.
      const buscaResponse = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!buscaResponse.ok) {
        throw new Error('Não foi possível conectar ao servidor para validar o usuário.');
      }

      const listaUsuarios = await buscaResponse.json();
      const usuarioEncontrado = listaUsuarios.find(
        (u) => u.email && u.email.toLowerCase() === email
      );

      if (!usuarioEncontrado) {
        exibirAlerta(
          'Nenhuma conta encontrada com este e-mail. Verifique os dados ou clique em "Criar agora".',
          'error'
        );
        return;
      }

      // Valida também se o nome informado corresponde ao cadastro (ignorando maiúsculas/minúsculas)
      if (
        usuarioEncontrado.nome &&
        usuarioEncontrado.nome.trim().toLowerCase() !== nome.toLowerCase()
      ) {
        exibirAlerta(
          'O nome informado não confere com o cadastro deste e-mail.',
          'error'
        );
        return;
      }

      // Chama a rota oficial POST /api/usuarios para recuperar os dados completos conforme o app.py
      const authResponse = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: usuarioEncontrado.nome,
          email: usuarioEncontrado.email
        })
      });

      const data = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(data.erro || 'Erro ao recuperar os dados do usuário.');
      }

      const dadosUsuario = data.usuario || usuarioEncontrado;

      // 2. Salva ID e dados completos no localStorage
      localStorage.setItem('routebase_usuario_id', String(dadosUsuario.id));
      localStorage.setItem('routebase_usuario', JSON.stringify(dadosUsuario));

      exibirAlerta('Acesso confirmado! Entrando no seu painel...', 'success');

      // 3. Redireciona imediatamente para inicio.html dentro de pages/
      setTimeout(() => {
        window.location.href = 'inicio.html';
      }, 600);

    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        exibirAlerta(
          'Erro de conexão com o servidor Flask. Verifique se o back-end está em execução.',
          'error'
        );
      } else {
        exibirAlerta(error.message, 'error');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  });
});