document.addEventListener('DOMContentLoaded', () => {
  // Base da API Flask (ajuste para '/api' caso sirva pelo mesmo domínio do Flask)
  const API_BASE_URL = 'http://127.0.0.1:5000/api';

  const registerForm = document.getElementById('registerForm');
  const nomeInput = document.getElementById('nomeInput');
  const emailInput = document.getElementById('emailInput');
  const termosCheckbox = document.getElementById('termosCheckbox');

  const nomeError = document.getElementById('nomeError');
  const emailError = document.getElementById('emailError');
  const termosError = document.getElementById('termosError');
  const alertBox = document.getElementById('alertBox');
  const submitBtn = document.getElementById('submitBtn');

  function exibirAlerta(htmlMensagem, tipo = 'error') {
    alertBox.innerHTML = htmlMensagem;
    alertBox.className = 'alert-box';
    alertBox.classList.add(tipo === 'success' ? 'show-success' : 'show-error');
  }

  function limparFeedbacks() {
    alertBox.className = 'alert-box';
    alertBox.innerHTML = '';
    nomeError.textContent = '';
    emailError.textContent = '';
    termosError.textContent = '';
    nomeInput.classList.remove('input-invalid');
    emailInput.classList.remove('input-invalid');
  }

  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    limparFeedbacks();

    const nome = nomeInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const aceitouTermos = termosCheckbox.checked;
    let formularioValido = true;

    // 1. Validações obrigatórias antes da requisição
    if (!nome || nome.length < 3) {
      nomeError.textContent = 'Por favor, informe seu nome completo.';
      nomeInput.classList.add('input-invalid');
      formularioValido = false;
    }

    if (!email || !validarEmail(email)) {
      emailError.textContent = 'Por favor, informe um e-mail válido.';
      emailInput.classList.add('input-invalid');
      formularioValido = false;
    }

    if (!aceitouTermos) {
      termosError.textContent = 'Você precisa concordar com os Termos de Uso e Política de Privacidade.';
      formularioValido = false;
    }

    if (!formularioValido) return;

    // Estado de carregamento
    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Criando sua conta...';

    try {
      // 2. TRAVA CONTRA CONTAS DUPLICADAS:
      // Consulta GET /api/usuarios antes de disparar o POST /api/usuarios,
      // pois a rota POST do app.py recupera automaticamente se o e-mail já existir.
      const checkResponse = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!checkResponse.ok) {
        throw new Error('Não foi possível verificar disponibilidade do e-mail no servidor.');
      }

      const usuariosExistentes = await checkResponse.json();
      const emailJaCadastrado = usuariosExistentes.some(
        (u) => u.email && u.email.trim().toLowerCase() === email
      );

      if (emailJaCadastrado) {
        exibirAlerta(
          'Você já possui uma conta com este e-mail. Por favor, faça o login na <a href="login.html">área de login</a>.',
          'error'
        );
        return;
      }

      // 3. CRIAÇÃO DO NOVO USUÁRIO NO BANCO (POST /api/usuarios)
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nome,
          email: email,
          foto_perfil: 'default.png'
        })
      });

      const data = await response.json();

      // Caso o back-end retorne status 200 (recuperado) ou erro de duplicidade (400/409)
      if (response.status === 200 || response.status === 409) {
        exibirAlerta(
          'Você já possui uma conta com este e-mail. Por favor, faça o login na <a href="login.html">área de login</a>.',
          'error'
        );
        return;
      }

      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível concluir o cadastro.');
      }

      const novoUsuario = data.usuario;

      // 4. AUTO-LOGIN APÓS O PRIMEIRO CADASTRO:
      // Salva ID e dados completos no localStorage e redireciona direto para inicio.html
      localStorage.setItem('routebase_usuario_id', String(novoUsuario.id));
      localStorage.setItem('routebase_usuario', JSON.stringify(novoUsuario));

      exibirAlerta('Conta criada com sucesso! Preparando seu ambiente...', 'success');

      setTimeout(() => {
        window.location.href = 'inicio.html';
      }, 650);

    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        exibirAlerta(
          'Erro de conexão com o servidor Flask. Verifique se o back-end está ativo.',
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