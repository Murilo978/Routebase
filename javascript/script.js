document.addEventListener('DOMContentLoaded', () => {
  // URL base da API Flask (ajuste caso rode em outra porta ou domínio)
  const API_BASE_URL = 'http://127.0.0.1:5000/api';

  /* ==========================================================================
     1. MENU MOBILE (HAMBÚRGUER) E DROPDOWNS INTERATIVOS
     ========================================================================== */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const dropdownItems = document.querySelectorAll('.has-dropdown');

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
    });
  }

  dropdownItems.forEach((item) => {
    const toggle = item.querySelector('.dropdown-toggle');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isCurrentlyActive = item.classList.contains('active');

      // Fecha outros dropdowns abertos
      dropdownItems.forEach((other) => {
        other.classList.remove('active');
        other.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
      });

      if (!isCurrentlyActive) {
        item.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Fecha dropdowns ao clicar fora
  document.addEventListener('click', () => {
    dropdownItems.forEach((item) => {
      item.classList.remove('active');
      item.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
    });
  });

  // Fecha menu mobile ao clicar em qualquer link interno
  document.querySelectorAll('.nav-menu a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ==========================================================================
     2. CONTROLE DE MODAIS (ABRIR, FECHAR E ALTERNAR)
     ========================================================================== */
  const openModalButtons = document.querySelectorAll('.open-modal');
  const closeModalButtons = document.querySelectorAll('.modal-close');
  const switchModalButtons = document.querySelectorAll('[data-switch-modal]');
  const allModals = document.querySelectorAll('.modal-overlay');

  function openModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (!targetModal) return;

    closeAllModals();
    targetModal.classList.add('open');
    targetModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    allModals.forEach((modal) => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  openModalButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = btn.getAttribute('data-modal');
      openModal(modalId);
    });
  });

  closeModalButtons.forEach((btn) => {
    btn.addEventListener('click', closeAllModals);
  });

  switchModalButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-switch-modal');
      openModal(targetId);
    });
  });

  // Fechar clicando fora do card do modal
  allModals.forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });

  // Fechar com a tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  /* ==========================================================================
     3. VALIDAÇÃO E INTEGRAÇÃO COM A API FLASK (POST /api/usuarios)
     ========================================================================== */
  function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async function autenticarOuCadastrarUsuario({ nome, email, feedbackEl, submitBtn }) {
    feedbackEl.className = 'form-feedback';
    feedbackEl.textContent = '';
    submitBtn.disabled = true;
    const textoOriginal = submitBtn.textContent;
    submitBtn.textContent = 'Conectando...';

    try {
      // Conecta diretamente à rota de Identificação Simplificada do seu app.py
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome, email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível concluir o acesso.');
      }

      // Salva o usuário autenticado no localStorage para uso no painel da aplicação
      localStorage.setItem('routebase_usuario', JSON.stringify(data.usuario));

      feedbackEl.classList.add('success');
      feedbackEl.textContent = `${data.mensagem} Redirecionando para o painel...`;

      // Redireciona para a página interna do sistema após 1 segundo
      setTimeout(() => {
        // Ajuste o caminho abaixo para o HTML do seu dashboard/painel interno
        window.location.href = 'painel.html';
      }, 1000);

    } catch (error) {
      feedbackEl.classList.add('error');
      feedbackEl.textContent = error.message.includes('Failed to fetch')
        ? 'Servidor Flask offline ou bloqueado por CORS. Verifique se o app.py está rodando.'
        : error.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = textoOriginal;
    }
  }

  // Formulário de Cadastro ("Criar conta grátis")
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nomeInput = document.getElementById('regNome');
      const emailInput = document.getElementById('regEmail');
      const nomeError = document.getElementById('regNomeError');
      const emailError = document.getElementById('regEmailError');
      const feedback = document.getElementById('registerFeedback');
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      let valido = true;
      nomeError.textContent = '';
      emailError.textContent = '';

      if (nomeInput.value.trim().length < 2) {
        nomeError.textContent = 'Por favor, informe seu nome completo.';
        valido = false;
      }

      if (!validarEmail(emailInput.value.trim())) {
        emailError.textContent = 'Digite um endereço de e-mail válido.';
        valido = false;
      }

      if (valido) {
        autenticarOuCadastrarUsuario({
          nome: nomeInput.value.trim(),
          email: emailInput.value.trim(),
          feedbackEl: feedback,
          submitBtn
        });
      }
    });
  }

  // Formulário de Login ("Entrar")
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nomeInput = document.getElementById('loginNome');
      const emailInput = document.getElementById('loginEmail');
      const nomeError = document.getElementById('loginNomeError');
      const emailError = document.getElementById('loginEmailError');
      const feedback = document.getElementById('loginFeedback');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      let valido = true;
      nomeError.textContent = '';
      emailError.textContent = '';

      if (!nomeInput.value.trim()) {
        nomeError.textContent = 'Informe seu nome.';
        valido = false;
      }

      if (!validarEmail(emailInput.value.trim())) {
        emailError.textContent = 'Digite um endereço de e-mail válido.';
        valido = false;
      }

      if (valido) {
        autenticarOuCadastrarUsuario({
          nome: nomeInput.value.trim(),
          email: emailInput.value.trim(),
          feedbackEl: feedback,
          submitBtn
        });
      }
    });
  }
});