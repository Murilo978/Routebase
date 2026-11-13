document.addEventListener('DOMContentLoaded', () => {
  // Base da API Flask
  const API_BASE_URL = 'http://127.0.0.1:5000/api';

  /* ==========================================================================
     1. PROTEÇÃO DE ROTA E IDENTIFICAÇÃO DO USUÁRIO LOGADO (localStorage)
     ========================================================================== */
  const usuarioIdRaw = localStorage.getItem('routebase_usuario_id');
  const usuarioJsonRaw = localStorage.getItem('routebase_usuario');

  let usuarioLogado = null;
  try {
    usuarioLogado = usuarioJsonRaw ? JSON.parse(usuarioJsonRaw) : null;
  } catch (e) {
    usuarioLogado = null;
  }

  const usuarioId = usuarioIdRaw || (usuarioLogado && usuarioLogado.id ? String(usuarioLogado.id) : null);

  if (!usuarioId || !usuarioLogado || !usuarioLogado.nome) {
    window.location.href = 'login.html';
    return;
  }

  // Garante sincronismo das duas chaves no localStorage
  localStorage.setItem('routebase_usuario_id', String(usuarioId));

  function gerarIniciais(nomeCompleto) {
    const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'RB';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  // Preenche dados do usuário na Navbar, Janela de Perfil e Boas-vindas
  const iniciais = gerarIniciais(usuarioLogado.nome);
  document.getElementById('userInitials').textContent = iniciais;
  document.getElementById('dropdownUserInitials').textContent = iniciais;
  document.getElementById('dropdownUserName').textContent = usuarioLogado.nome;
  document.getElementById('dropdownUserEmail').textContent = usuarioLogado.email || '';
  document.getElementById('welcomeUserName').textContent = usuarioLogado.nome.split(' ')[0];

  /* ==========================================================================
     2. MENU DROPDOWN DO AVATAR, UPLOAD DE FOTO E LOGOUT
     ========================================================================== */
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const userDropdown = document.getElementById('userDropdown');
  const logoutBtn = document.getElementById('logoutBtn');

  const headerAvatarImg = document.getElementById('headerAvatarImg');
  const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
  const triggerPhotoUploadBtn = document.getElementById('triggerPhotoUploadBtn');
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const dropdownEnvCount = document.getElementById('dropdownEnvCount');

  const FOTO_STORAGE_KEY = `routebase_foto_perfil_${usuarioId}`;

  function aplicarFotoPerfil(dataUrl) {
    if (dataUrl) {
      headerAvatarImg.src = dataUrl;
      headerAvatarImg.hidden = false;
      document.getElementById('userInitials').hidden = true;

      dropdownAvatarImg.src = dataUrl;
      dropdownAvatarImg.hidden = false;
      document.getElementById('dropdownUserInitials').hidden = true;
    } else {
      headerAvatarImg.hidden = true;
      document.getElementById('userInitials').hidden = false;

      dropdownAvatarImg.hidden = true;
      document.getElementById('dropdownUserInitials').hidden = false;
    }
  }

  // Carrega foto salva no localStorage ao iniciar
  const fotoSalva = localStorage.getItem(FOTO_STORAGE_KEY) || usuarioLogado.foto_data_url || null;
  aplicarFotoPerfil(fotoSalva);

  // Abre seletor de arquivo ao clicar no lapizinho
  triggerPhotoUploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profilePhotoInput.click();
  });

  // Lê e aplica qualquer imagem escolhida pelo usuário
  profilePhotoInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToast('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target.result;
      try {
        localStorage.setItem(FOTO_STORAGE_KEY, base64Image);
        usuarioLogado.foto_data_url = base64Image;
        localStorage.setItem('routebase_usuario', JSON.stringify(usuarioLogado));
        aplicarFotoPerfil(base64Image);
        mostrarToast('Foto de perfil atualizada!');
      } catch (err) {
        mostrarToast('Imagem muito grande para salvar no navegador. Escolha uma menor.');
      }
    };
    reader.readAsDataURL(file);
    profilePhotoInput.value = '';
  });

  userAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = userDropdown.classList.toggle('open');
    userAvatarBtn.setAttribute('aria-expanded', isOpen);
  });

  document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userAvatarBtn.contains(e.target)) {
      userDropdown.classList.remove('open');
      userAvatarBtn.setAttribute('aria-expanded', 'false');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('routebase_usuario_id');
    localStorage.removeItem('routebase_usuario');
    window.location.href = 'login.html';
  });

  /* ==========================================================================
     3. UTILITÁRIOS DE UI (MODAIS, DRAWER E TOAST)
     ========================================================================== */
  const toastEl = document.getElementById('toastNotification');
  let toastTimeout = null;

  function mostrarToast(mensagem) {
    toastEl.textContent = mensagem;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }

  function abrirModal(modalEl) {
    modalEl.classList.add('open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach((m) => {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', fecharTodosModais);
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fecharTodosModais();
    });
  });

  // Drawer de Avisos
  const avisosDrawerOverlay = document.getElementById('avisosDrawerOverlay');
  const openAvisosBtn = document.getElementById('openAvisosBtn');
  const closeAvisosBtn = document.getElementById('closeAvisosBtn');

  function abrirDrawerAvisos() {
    avisosDrawerOverlay.classList.add('open');
    avisosDrawerOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function fecharDrawerAvisos() {
    avisosDrawerOverlay.classList.remove('open');
    avisosDrawerOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openAvisosBtn.addEventListener('click', () => {
    abrirDrawerAvisos();
    carregarAvisos();
  });

  closeAvisosBtn.addEventListener('click', fecharDrawerAvisos);

  avisosDrawerOverlay.addEventListener('click', (e) => {
    if (e.target === avisosDrawerOverlay) fecharDrawerAvisos();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      userDropdown.classList.remove('open');
      userAvatarBtn.setAttribute('aria-expanded', 'false');
      fecharTodosModais();
      fecharDrawerAvisos();
    }
  });

  function formatarDataBR(dataStr) {
    if (!dataStr) return 'Sem prazo definido';
    const limpa = String(dataStr).split('T')[0];
    const partes = limpa.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  }

  function escaparHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ==========================================================================
     4. LISTAR AMBIENTES DO USUÁRIO (GET /api/ambientes/usuario/<usuario_id>)
     ========================================================================== */
  const envLoading = document.getElementById('envLoading');
  const envEmpty = document.getElementById('envEmpty');
  const envGrid = document.getElementById('envGrid');
  const envCountPill = document.getElementById('envCountPill');

  function abrirSalaAmbiente(ambiente) {
    localStorage.setItem('routebase_ambiente_atual_id', String(ambiente.id));
    localStorage.setItem('routebase_ambiente_atual', JSON.stringify(ambiente));
    window.location.href = `ambiente.html?id=${ambiente.id}`;
  }

  async function carregarAmbientes() {
    envLoading.hidden = false;
    envEmpty.hidden = true;
    envGrid.innerHTML = '';

    try {
      const response = await fetch(`${API_BASE_URL}/ambientes/usuario/${usuarioId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar ambientes.');
      }

      const data = await response.json();
      const ambientes = Array.isArray(data) ? data : (data.ambientes || []);

      envLoading.hidden = true;
      envCountPill.textContent = `${ambientes.length} ${ambientes.length === 1 ? 'sala' : 'salas'}`;
      dropdownEnvCount.textContent = `${ambientes.length} ${ambientes.length === 1 ? 'ambiente' : 'ambientes'}`;

      if (ambientes.length === 0) {
        envEmpty.hidden = false;
        return;
      }

      ambientes.forEach((amb) => {
        const ehCriador = String(amb.criador_id || amb.usuario_id) === String(usuarioId) || amb.papel === 'criador';
        const card = document.createElement('article');
        card.className = 'env-card';
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        card.innerHTML = `
          <div>
            <div class="env-card-top">
              <span class="env-role-badge ${ehCriador ? 'role-creator' : 'role-member'}">
                ${ehCriador ? 'Criador' : 'Participante'}
              </span>
              ${amb.codigo_convite ? `<span class="env-code-chip">#${escaparHTML(amb.codigo_convite)}</span>` : ''}
            </div>
            <div class="env-card-body" style="margin-top: 12px;">
              <h3>${escaparHTML(amb.nome)}</h3>
              <p>${amb.descricao ? escaparHTML(amb.descricao) : 'Sem descrição cadastrada para este ambiente.'}</p>
            </div>
          </div>
          <div class="env-card-footer">
            <span class="env-deadline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${formatarDataBR(amb.data_entrega)}
            </span>
            <span class="env-enter-cta">Abrir sala &rarr;</span>
          </div>
        `;

        card.addEventListener('click', () => abrirSalaAmbiente(amb));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirSalaAmbiente(amb);
          }
        });

        envGrid.appendChild(card);
      });
    } catch (error) {
      envLoading.hidden = true;
      envEmpty.hidden = false;
      envEmpty.querySelector('.env-empty-title').textContent = 'Não foi possível conectar ao servidor.';
      envEmpty.querySelector('.env-empty-desc').textContent = 'Verifique se o back-end Flask (app.py) está rodando na porta 5000.';
    }
  }

  /* ==========================================================================
     5. CRIAR AMBIENTE DE TRABALHO (POST /api/ambientes)
     ========================================================================== */
  const createEnvModal = document.getElementById('createEnvModal');
  const openCreateModalBtn = document.getElementById('openCreateModalBtn');
  const createEnvForm = document.getElementById('createEnvForm');
  const envNomeInput = document.getElementById('envNomeInput');
  const envDescInput = document.getElementById('envDescInput');
  const envDataInput = document.getElementById('envDataInput');
  const envNomeError = document.getElementById('envNomeError');
  const createEnvAlert = document.getElementById('createEnvAlert');
  const createEnvSubmitBtn = document.getElementById('createEnvSubmitBtn');

  const createdCodeBox = document.getElementById('createdCodeBox');
  const generatedInviteCode = document.getElementById('generatedInviteCode');
  const copyInviteCodeBtn = document.getElementById('copyInviteCodeBtn');
  const copyFeedback = document.getElementById('copyFeedback');
  const goToCreatedEnvBtn = document.getElementById('goToCreatedEnvBtn');

  let ultimoAmbienteCriado = null;

  openCreateModalBtn.addEventListener('click', () => {
    createEnvForm.reset();
    createEnvForm.hidden = false;
    createdCodeBox.hidden = true;
    envNomeError.textContent = '';
    createEnvAlert.className = 'alert-box';
    copyFeedback.textContent = '';
    abrirModal(createEnvModal);
    setTimeout(() => envNomeInput.focus(), 100);
  });

  createEnvForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    envNomeError.textContent = '';
    createEnvAlert.className = 'alert-box';

    const nome = envNomeInput.value.trim();
    const descricao = envDescInput.value.trim();
    const dataEntrega = envDataInput.value || null;

    if (!nome || nome.length < 2) {
      envNomeError.textContent = 'Informe o nome do ambiente de trabalho.';
      envNomeInput.focus();
      return;
    }

    createEnvSubmitBtn.disabled = true;
    const textoOriginal = createEnvSubmitBtn.textContent;
    createEnvSubmitBtn.textContent = 'Criando ambiente...';

    try {
      const response = await fetch(`${API_BASE_URL}/ambientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: Number(usuarioId),
          nome: nome,
          descricao: descricao,
          data_entrega: dataEntrega
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível criar o ambiente.');
      }

      const ambienteCriado = data.ambiente || data;
      ultimoAmbienteCriado = ambienteCriado;

      // Exibe tela com o código de convite gerado
      generatedInviteCode.textContent = ambienteCriado.codigo_convite || '------';
      createEnvForm.hidden = true;
      createdCodeBox.hidden = false;

      // Atualiza a grade de ambientes no fundo
      await carregarAmbientes();
    } catch (error) {
      createEnvAlert.textContent = error.message.includes('Failed to fetch')
        ? 'Erro de conexão com o servidor Flask.'
        : error.message;
      createEnvAlert.classList.add('show-error');
    } finally {
      createEnvSubmitBtn.disabled = false;
      createEnvSubmitBtn.textContent = textoOriginal;
    }
  });

  copyInviteCodeBtn.addEventListener('click', async () => {
    const codigo = generatedInviteCode.textContent.trim();
    if (!codigo || codigo === '------') return;

    try {
      await navigator.clipboard.writeText(codigo);
      copyFeedback.textContent = 'Código copiado para a área de transferência!';
    } catch (_) {
      copyFeedback.textContent = `Código: ${codigo}`;
    }
  });

  goToCreatedEnvBtn.addEventListener('click', () => {
    if (ultimoAmbienteCriado && ultimoAmbienteCriado.id) {
      abrirSalaAmbiente(ultimoAmbienteCriado);
    } else {
      fecharTodosModais();
    }
  });

  /* ==========================================================================
     6. ENTRAR EM AMBIENTE POR CÓDIGO (POST /api/ambientes/entrar)
     ========================================================================== */
  const joinEnvModal = document.getElementById('joinEnvModal');
  const openJoinModalBtn = document.getElementById('openJoinModalBtn');
  const joinEnvForm = document.getElementById('joinEnvForm');
  const inviteCodeInput = document.getElementById('inviteCodeInput');
  const inviteCodeError = document.getElementById('inviteCodeError');
  const joinEnvAlert = document.getElementById('joinEnvAlert');
  const joinEnvSubmitBtn = document.getElementById('joinEnvSubmitBtn');

  openJoinModalBtn.addEventListener('click', () => {
    joinEnvForm.reset();
    inviteCodeError.textContent = '';
    joinEnvAlert.className = 'alert-box';
    abrirModal(joinEnvModal);
    setTimeout(() => inviteCodeInput.focus(), 100);
  });

  inviteCodeInput.addEventListener('input', () => {
    inviteCodeInput.value = inviteCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });

  joinEnvForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    inviteCodeError.textContent = '';
    joinEnvAlert.className = 'alert-box';

    const codigoConvite = inviteCodeInput.value.trim().toUpperCase();

    if (codigoConvite.length !== 6) {
      inviteCodeError.textContent = 'O código de convite deve ter exatamente 6 caracteres.';
      inviteCodeInput.focus();
      return;
    }

    joinEnvSubmitBtn.disabled = true;
    const textoOriginal = joinEnvSubmitBtn.textContent;
    joinEnvSubmitBtn.textContent = 'Entrando na sala...';

    try {
      const response = await fetch(`${API_BASE_URL}/ambientes/entrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: Number(usuarioId),
          codigo_convite: codigoConvite
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Código inválido ou ambiente não encontrado.');
      }

      joinEnvAlert.textContent = data.mensagem || 'Você entrou no ambiente com sucesso!';
      joinEnvAlert.classList.add('show-success');

      await carregarAmbientes();

      setTimeout(() => {
        fecharTodosModais();
        mostrarToast('Ambiente adicionado à sua lista!');
      }, 750);
    } catch (error) {
      joinEnvAlert.textContent = error.message.includes('Failed to fetch')
        ? 'Erro de conexão com o servidor Flask.'
        : error.message;
      joinEnvAlert.classList.add('show-error');
    } finally {
      joinEnvSubmitBtn.disabled = false;
      joinEnvSubmitBtn.textContent = textoOriginal;
    }
  });

  /* ==========================================================================
     7. MEUS AVISOS E AÇÕES DE ACEITAR/RECUSAR INDICAÇÃO (GET /api/avisos/<id>)
     ========================================================================== */
  const bellBadge = document.getElementById('bellBadge');
  const countIndicacoes = document.getElementById('countIndicacoes');
  const countHoje = document.getElementById('countHoje');
  const countAtrasadas = document.getElementById('countAtrasadas');

  const listaIndicacoes = document.getElementById('listaIndicacoes');
  const listaVencerHoje = document.getElementById('listaVencerHoje');
  const listaAtrasadas = document.getElementById('listaAtrasadas');

  async function responderIndicacao(tarefaId, acao, cardEl) {
    const botoes = cardEl.querySelectorAll('button');
    botoes.forEach((b) => (b.disabled = true));

    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}/${acao}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: Number(usuarioId) })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || `Não foi possível ${acao} a indicação.`);
      }

      mostrarToast(acao === 'aceitar' ? 'Tarefa aceita com sucesso!' : 'Indicação recusada.');
      await carregarAvisos();
    } catch (error) {
      mostrarToast(error.message);
      botoes.forEach((b) => (b.disabled = false));
    }
  }

  async function carregarAvisos() {
    try {
      const response = await fetch(`${API_BASE_URL}/avisos/${usuarioId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) return;

      const data = await response.json();

      // Suporta diferentes chaves possíveis retornadas pelo app.py
      const indicacoes = data.indicacoes_pendentes || data.indicacoes || [];
      const vencerHoje = data.vencer_hoje || data.tarefas_hoje || data.hoje || [];
      const atrasadas = data.atrasadas || data.tarefas_atrasadas || [];

      const totalPendencias = indicacoes.length + vencerHoje.length + atrasadas.length;

      // Acende ou oculta a bolinha no sino
      if (totalPendencias > 0) {
        bellBadge.hidden = false;
      } else {
        bellBadge.hidden = true;
      }

      // Atualiza contadores
      countIndicacoes.textContent = indicacoes.length;
      countHoje.textContent = vencerHoje.length;
      countAtrasadas.textContent = atrasadas.length;

      // Renderiza Lista 1: Indicações Pendentes
      listaIndicacoes.innerHTML = '';
      if (indicacoes.length === 0) {
        listaIndicacoes.innerHTML = '<p class="aviso-empty">Nenhuma indicação aguardando sua resposta.</p>';
      } else {
        indicacoes.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'aviso-item aviso-invite';
          div.innerHTML = `
            <span class="aviso-env-tag">${escaparHTML(item.ambiente_nome || 'Ambiente')}</span>
            <div class="aviso-title">${escaparHTML(item.titulo || item.nome)}</div>
            <div class="aviso-meta">
              ${item.indicado_por ? `Indicado por <strong>${escaparHTML(item.indicado_por)}</strong> • ` : ''}
              Prazo: ${formatarDataBR(item.data_limite || item.prazo)}
            </div>
            <div class="aviso-actions">
              <button type="button" class="btn-accept-task">Aceitar</button>
              <button type="button" class="btn-reject-task">Recusar</button>
            </div>
          `;

          const btnAceitar = div.querySelector('.btn-accept-task');
          const btnRecusar = div.querySelector('.btn-reject-task');
          btnAceitar.addEventListener('click', () => responderIndicacao(item.id, 'aceitar', div));
          btnRecusar.addEventListener('click', () => responderIndicacao(item.id, 'recusar', div));

          listaIndicacoes.appendChild(div);
        });
      }

      // Renderiza Lista 2: Tarefas a Vencer Hoje
      listaVencerHoje.innerHTML = '';
      if (vencerHoje.length === 0) {
        listaVencerHoje.innerHTML = '<p class="aviso-empty">Nenhuma entrega prevista para hoje.</p>';
      } else {
        vencerHoje.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'aviso-item aviso-today';
          div.innerHTML = `
            <span class="aviso-env-tag">${escaparHTML(item.ambiente_nome || 'Ambiente')}</span>
            <div class="aviso-title">${escaparHTML(item.titulo || item.nome)}</div>
            <div class="aviso-meta">Vence hoje (${formatarDataBR(item.data_limite || item.prazo)})</div>
          `;
          listaVencerHoje.appendChild(div);
        });
      }

      // Renderiza Lista 3: Tarefas Atrasadas
      listaAtrasadas.innerHTML = '';
      if (atrasadas.length === 0) {
        listaAtrasadas.innerHTML = '<p class="aviso-empty">Nenhuma tarefa em atraso. Tudo em dia!</p>';
      } else {
        atrasadas.forEach((item) => {
          const div = document.createElement('div');
          div.className = 'aviso-item aviso-danger';
          div.innerHTML = `
            <span class="aviso-env-tag">${escaparHTML(item.ambiente_nome || 'Ambiente')}</span>
            <div class="aviso-title">${escaparHTML(item.titulo || item.nome)}</div>
            <div class="aviso-meta">Prazo expirado em ${formatarDataBR(item.data_limite || item.prazo)}</div>
          `;
          listaAtrasadas.appendChild(div);
        });
      }
    } catch (_) {
      // Falha silenciosa na consulta inicial de avisos se offline
    }
  }

  // Inicialização da página
  carregarAmbientes();
  carregarAvisos();
});