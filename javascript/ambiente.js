document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = '/api';

  /* ==========================================================================
     1. VALIDAÇÃO DE SESSÃO E IDENTIFICAÇÃO DO AMBIENTE PELA URL
     ========================================================================== */
  const params = new URLSearchParams(window.location.search);
  const ambienteId = params.get('id') || localStorage.getItem('routebase_ambiente_atual_id');

  const usuarioIdRaw = localStorage.getItem('routebase_usuario_id');
  const usuarioJsonRaw = localStorage.getItem('routebase_usuario');

  let usuarioLogado = null;
  try {
    usuarioLogado = usuarioJsonRaw ? JSON.parse(usuarioJsonRaw) : null;
  } catch (_) {
    usuarioLogado = null;
  }

  const usuarioId = usuarioIdRaw || (usuarioLogado && usuarioLogado.id ? String(usuarioLogado.id) : null);

  if (!usuarioId || !usuarioLogado || !usuarioLogado.nome) {
    window.location.href = 'login.html';
    return;
  }

  if (!ambienteId) {
    window.location.href = 'inicio.html';
    return;
  }

  localStorage.setItem('routebase_ambiente_atual_id', String(ambienteId));

  /* ==========================================================================
     2. TOPBAR: PERFIL (FOTO + DADOS) E NOTIFICAÇÕES
     ========================================================================== */
  function gerarIniciais(nomeCompleto) {
    const partes = String(nomeCompleto || '').trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'RB';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  const iniciais = gerarIniciais(usuarioLogado.nome);
  document.getElementById('userInitials').textContent = iniciais;
  document.getElementById('dropdownUserInitials').textContent = iniciais;
  document.getElementById('dropdownUserName').textContent = usuarioLogado.nome;
  document.getElementById('dropdownUserEmail').textContent = usuarioLogado.email || '';

  const headerAvatarImg = document.getElementById('headerAvatarImg');
  const dropdownAvatarImg = document.getElementById('dropdownAvatarImg');
  const triggerPhotoUploadBtn = document.getElementById('triggerPhotoUploadBtn');
  const profilePhotoInput = document.getElementById('profilePhotoInput');
  const FOTO_STORAGE_KEY = `routebase_foto_perfil_${usuarioId}`;

  function aplicarFotoPerfil(dataUrl) {
    if (dataUrl && dataUrl !== 'default.png') {
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

  const fotoInicialCache =
    localStorage.getItem(FOTO_STORAGE_KEY) ||
    (usuarioLogado.foto_perfil && usuarioLogado.foto_perfil !== 'default.png' ? usuarioLogado.foto_perfil : null) ||
    usuarioLogado.foto_data_url ||
    null;

  aplicarFotoPerfil(fotoInicialCache);

  triggerPhotoUploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profilePhotoInput.click();
  });

  profilePhotoInput.addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imagemBase64 = e.target.result;

      try {
        localStorage.setItem(FOTO_STORAGE_KEY, imagemBase64);
        usuarioLogado.foto_perfil = imagemBase64;
        usuarioLogado.foto_data_url = imagemBase64;
        localStorage.setItem('routebase_usuario', JSON.stringify(usuarioLogado));
        aplicarFotoPerfil(imagemBase64);

        const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}/foto`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto_perfil: imagemBase64 })
        });

        if (!response.ok) {
          throw new Error('Falha ao sincronizar foto com o servidor.');
        }

        mostrarToast('Foto de perfil atualizada!');
        await carregarMembrosAmbiente();
      } catch (err) {
        mostrarToast(
          err.message && err.message.includes('servidor')
            ? 'Foto salva localmente, mas houve erro ao enviar ao servidor.'
            : 'Imagem muito grande para salvar no navegador.'
        );
      }
    };
    reader.readAsDataURL(file);
    profilePhotoInput.value = '';
  });

  // Popovers do Header
  const notificationsWrapper = document.getElementById('notificationsWrapper');
  const openNotificationsBtn = document.getElementById('openNotificationsBtn');
  const notificationsPopover = document.getElementById('notificationsPopover');

  const profileWrapper = document.getElementById('profileWrapper');
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const profilePopover = document.getElementById('profilePopover');
  const logoutBtn = document.getElementById('logoutBtn');

  function fecharPopoversHeader() {
    notificationsPopover.classList.remove('open');
    openNotificationsBtn.setAttribute('aria-expanded', 'false');
    profilePopover.classList.remove('open');
    userAvatarBtn.setAttribute('aria-expanded', 'false');
  }

  openNotificationsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const estavaAberto = notificationsPopover.classList.contains('open');
    fecharPopoversHeader();
    if (!estavaAberto) {
      notificationsPopover.classList.add('open');
      openNotificationsBtn.setAttribute('aria-expanded', 'true');
    }
  });

  userAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const estavaAberto = profilePopover.classList.contains('open');
    fecharPopoversHeader();
    if (!estavaAberto) {
      profilePopover.classList.add('open');
      userAvatarBtn.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (!notificationsWrapper.contains(e.target) && !profileWrapper.contains(e.target)) {
      fecharPopoversHeader();
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('routebase_usuario_id');
    localStorage.removeItem('routebase_usuario');
    window.location.href = 'login.html';
  });

  /* ==========================================================================
     3. ESTADO GLOBAL DA SALA E UTILITÁRIOS
     ========================================================================== */
  let ambienteAtual = null;
  let tarefasAmbiente = [];
  let membrosAmbiente = [];
  const CORES_DISPONIVEIS = ['indigo', 'teal', 'amber', 'sage', 'terracotta', 'blue', 'purple'];
  const MAPA_CORES_STORAGE_KEY = `routebase_cores_tarefas_${ambienteId}`;

  function getMapaCores() {
    try {
      return JSON.parse(localStorage.getItem(MAPA_CORES_STORAGE_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function salvarCorTarefa(tarefaId, cor) {
    const mapa = getMapaCores();
    mapa[String(tarefaId)] = cor;
    localStorage.setItem(MAPA_CORES_STORAGE_KEY, JSON.stringify(mapa));
  }

  const toastEl = document.getElementById('toastNotification');
  let toastTimer = null;

  function mostrarToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  function abrirModal(el) {
    fecharPopoversHeader();
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
  }

  function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach((m) => {
      m.classList.remove('open');
      m.setAttribute('aria-hidden', 'true');
    });
  }

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', fecharTodosModais);
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fecharTodosModais();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharPopoversHeader();
      fecharTodosModais();
    }
  });

  function formatarDataCurta(dataStr) {
    if (!dataStr) return 'Sem prazo';
    const limpa = String(dataStr).split('T')[0];
    const partes = limpa.split('-');
    if (partes.length === 3) {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesNome = meses[parseInt(partes[1], 10) - 1] || partes[1];
      return `${partes[2]} ${mesNome}`;
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
     4. CARREGAR DADOS DO AMBIENTE, MEMBROS, TAREFAS E AVISOS
     ========================================================================== */
  const ambienteTituloEl = document.getElementById('ambienteTitulo');
  const ambientePrazoBadge = document.getElementById('ambientePrazoBadge');
  const boardLoading = document.getElementById('boardLoading');

  function normalizarPapelMembro(membro) {
    const papelRaw = String(membro.papel || '').toLowerCase();
    const ehCriador =
      papelRaw === 'criador' ||
      (ambienteAtual && String(ambienteAtual.criador_id || ambienteAtual.usuario_id) === String(membro.id));
    return ehCriador ? 'Criador' : 'Participante';
  }

  function obterFotoValidaMembro(membro) {
    if (
      membro &&
      membro.foto_perfil &&
      String(membro.foto_perfil).trim() !== '' &&
      String(membro.foto_perfil).trim() !== 'default.png'
    ) {
      return membro.foto_perfil;
    }
    if (membro && String(membro.id) === String(usuarioId)) {
      const cacheLocal = localStorage.getItem(FOTO_STORAGE_KEY);
      if (cacheLocal && cacheLocal !== 'default.png') return cacheLocal;
    }
    return null;
  }

  function renderizarAvataresToolbar() {
    const container = document.getElementById('toolbarMembersAvatars');
    if (!container) return;

    if (!Array.isArray(membrosAmbiente) || membrosAmbiente.length === 0) {
      container.innerHTML = '';
      return;
    }

    const avataresHtml = membrosAmbiente
      .map((m) => {
        const papel = normalizarPapelMembro(m);
        const iniciaisMembro = gerarIniciais(m.nome);
        const foto = obterFotoValidaMembro(m);

        return `
          <div
            class="toolbar-member-avatar ${papel === 'Criador' ? 'is-creator' : ''}"
            title="${escaparHTML(m.nome)} — ${papel}"
            aria-label="${escaparHTML(m.nome)} (${papel})"
          >
            ${foto ? `<img src="${escaparHTML(foto)}" alt="${escaparHTML(m.nome)}">` : `<span>${escaparHTML(iniciaisMembro)}</span>`}
          </div>
        `;
      })
      .join('');

    const totalTexto = `${membrosAmbiente.length} ${membrosAmbiente.length === 1 ? 'membro' : 'membros'}`;
    container.innerHTML = `${avataresHtml}<span class="toolbar-members-count-tag">${totalTexto}</span>`;
  }

  function preencherSelectsMembros() {
    const respSelect = document.getElementById('taskResponsavelSelect');
    const indSelect = document.getElementById('taskIndicadoSelect');
    if (!respSelect || !indSelect) return;

    respSelect.innerHTML = '<option value="">Sem responsável</option>';
    indSelect.innerHTML = '<option value="">Ninguém indicado</option>';

    membrosAmbiente.forEach((m) => {
      const papel = normalizarPapelMembro(m);
      const label = `${m.nome} (${papel})`;

      const optResp = document.createElement('option');
      optResp.value = m.id;
      optResp.textContent = label;
      respSelect.appendChild(optResp);

      const optInd = document.createElement('option');
      optInd.value = m.id;
      optInd.textContent = label;
      indSelect.appendChild(optInd);
    });
  }

  function renderizarAbaMembros() {
    if (!Array.isArray(membrosAmbiente) || membrosAmbiente.length === 0) {
      return `
        <div class="members-view-header">
          <div>
            <h2>Membros da Equipe</h2>
            <p>Nenhum integrante retornado pelo servidor.</p>
          </div>
        </div>
      `;
    }

    const cardsHtml = membrosAmbiente
      .map((m) => {
        const papel = normalizarPapelMembro(m);
        const ehCriador = papel === 'Criador';
        const iniciaisMembro = gerarIniciais(m.nome);
        const foto = obterFotoValidaMembro(m);

        return `
          <div class="member-directory-card">
            <div class="member-directory-left">
              <div class="member-directory-avatar">
                ${foto ? `<img src="${escaparHTML(foto)}" alt="${escaparHTML(m.nome)}">` : `<span>${escaparHTML(iniciaisMembro)}</span>`}
              </div>
              <div class="member-directory-info">
                <strong>${escaparHTML(m.nome)}</strong>
                <span>${escaparHTML(m.email || 'E-mail não informado')}</span>
              </div>
            </div>
            <span class="member-role-pill ${ehCriador ? 'role-criador' : 'role-participante'}">
              ${papel}
            </span>
          </div>
        `;
      })
      .join('');

    return `
      <div class="members-view-header">
        <div>
          <h2>Membros da Equipe (${membrosAmbiente.length})</h2>
          <p>Todos os integrantes ativos nesta sala de trabalho.</p>
        </div>
      </div>
      <div class="members-cards-list">
        ${cardsHtml}
      </div>
    `;
  }

  async function carregarMembrosAmbiente() {
    try {
      const resMembros = await fetch(`${API_BASE_URL}/ambientes/${ambienteId}/membros`);
      if (!resMembros.ok) return;

      const data = await resMembros.json();
      membrosAmbiente = Array.isArray(data) ? data : (data.membros || []);

      renderizarAvataresToolbar();
      preencherSelectsMembros();
    } catch (_) {
      // Mantém lista atual caso ocorra falha de rede
    }
  }

  async function carregarAmbienteETarefas() {
    boardLoading.hidden = false;

    try {
      const [resAmb, resListaUser] = await Promise.all([
        fetch(`${API_BASE_URL}/ambientes/${ambienteId}`).catch(() => null),
        fetch(`${API_BASE_URL}/ambientes/usuario/${usuarioId}`).catch(() => null)
      ]);

      if (resListaUser && resListaUser.ok) {
        const listaData = await resListaUser.json();
        const listaAmb = Array.isArray(listaData) ? listaData : (listaData.ambientes || []);
        document.getElementById('dropdownEnvCount').textContent = `${listaAmb.length} ${listaAmb.length === 1 ? 'ambiente' : 'ambientes'}`;
        if (!ambienteAtual) {
          ambienteAtual = listaAmb.find((a) => String(a.id) === String(ambienteId)) || null;
        }
      }

      if (resAmb && resAmb.ok) {
        const ambData = await resAmb.json();
        ambienteAtual = ambData.ambiente || ambData;
      } else if (!ambienteAtual) {
        try {
          ambienteAtual = JSON.parse(localStorage.getItem('routebase_ambiente_atual'));
        } catch (_) {
          ambienteAtual = null;
        }
      }

      if (ambienteAtual) {
        ambienteTituloEl.textContent = ambienteAtual.nome || `Ambiente #${ambienteId}`;
        document.title = `${ambienteAtual.nome || 'Ambiente'} — Routebase`;
        ambientePrazoBadge.textContent = `Entrega: ${formatarDataCurta(ambienteAtual.data_entrega)}`;
        document.getElementById('modalInviteCodeText').textContent = ambienteAtual.codigo_convite || '------';
      } else {
        ambienteTituloEl.textContent = `Ambiente #${ambienteId}`;
      }

      await carregarMembrosAmbiente();

      const resTarefas = await fetch(`${API_BASE_URL}/tarefas/ambiente/${ambienteId}`);
      if (resTarefas.ok) {
        const tData = await resTarefas.json();
        tarefasAmbiente = Array.isArray(tData) ? tData : (tData.tarefas || []);
      } else {
        tarefasAmbiente = [];
      }

      renderizarQuadroKanban();
    } catch (error) {
      mostrarToast('Erro ao carregar dados do ambiente.');
    } finally {
      boardLoading.hidden = true;
    }
  }

  async function carregarNotificacoesHeader() {
    try {
      const res = await fetch(`${API_BASE_URL}/avisos/${usuarioId}`);
      if (!res.ok) return;
      const data = await res.json();
      const indicacoes = data.indicacoes_pendentes || data.indicacoes || [];
      const hoje = data.vencer_hoje || data.tarefas_hoje || [];
      const atrasadas = data.atrasadas || data.tarefas_atrasadas || [];
      const total = indicacoes.length + hoje.length + atrasadas.length;

      const badge = document.getElementById('bellBadge');
      const countBadge = document.getElementById('notifTotalBadge');
      const body = document.getElementById('notificationsBody');

      countBadge.textContent = total;
      badge.hidden = total === 0;

      if (total > 0) {
        const itens = [
          ...indicacoes.map((i) => ({ titulo: i.titulo || i.nome, desc: 'Indicação pendente' })),
          ...hoje.map((h) => ({ titulo: h.titulo || h.nome, desc: 'Vence hoje' })),
          ...atrasadas.map((a) => ({ titulo: a.titulo || a.nome, desc: 'Tarefa atrasada' }))
        ];
        body.innerHTML = itens
          .map(
            (item) => `
            <div class="notif-mini-item">
              <strong>${escaparHTML(item.titulo)}</strong>
              <span>${escaparHTML(item.desc)}</span>
            </div>`
          )
          .join('');
      }
    } catch (_) {
      // Silencioso se offline
    }
  }

  /* ==========================================================================
     5. RENDERIZAÇÃO DO QUADRO KANBAN E PROGRESSO
     ========================================================================== */
  const colAFazer = document.getElementById('colAFazer');
  const colEmAndamento = document.getElementById('colEmAndamento');
  const colConcluida = document.getElementById('colConcluida');

  function normalizarStatus(status) {
    const s = String(status || 'A_FAZER').toUpperCase().trim();
    if (s === 'EM_ANDAMENTO' || s === 'ANDAMENTO') return 'EM_ANDAMENTO';
    if (s === 'CONCLUIDA' || s === 'CONCLUIDO') return 'CONCLUIDA';
    return 'A_FAZER';
  }

  function atualizarProgresso() {
    const total = tarefasAmbiente.length;
    const concluidas = tarefasAmbiente.filter((t) => normalizarStatus(t.status) === 'CONCLUIDA').length;
    const pct = total === 0 ? 0 : Math.round((concluidas / total) * 100);

    document.getElementById('progressBarFill').style.width = `${pct}%`;
    document.getElementById('progressPercentText').textContent = `${pct}% (${concluidas}/${total})`;
  }

  function renderizarQuadroKanban() {
    colAFazer.innerHTML = '';
    colEmAndamento.innerHTML = '';
    colConcluida.innerHTML = '';

    const grupos = {
      A_FAZER: [],
      EM_ANDAMENTO: [],
      CONCLUIDA: []
    };

    tarefasAmbiente.forEach((tarefa) => {
      const st = normalizarStatus(tarefa.status);
      grupos[st].push(tarefa);
    });

    document.getElementById('countAFazer').textContent = grupos.A_FAZER.length;
    document.getElementById('countEmAndamento').textContent = grupos.EM_ANDAMENTO.length;
    document.getElementById('countConcluida').textContent = grupos.CONCLUIDA.length;

    atualizarProgresso();

    const mapaCores = getMapaCores();

    Object.entries(grupos).forEach(([statusKey, lista]) => {
      const container =
        statusKey === 'A_FAZER' ? colAFazer : statusKey === 'EM_ANDAMENTO' ? colEmAndamento : colConcluida;

      if (lista.length === 0) {
        container.innerHTML = `<div class="column-empty-placeholder">Nenhuma tarefa nesta coluna</div>`;
        return;
      }

      lista.forEach((tarefa, idx) => {
        const cor =
          tarefa.cor ||
          mapaCores[String(tarefa.id)] ||
          CORES_DISPONIVEIS[(Number(tarefa.id) || idx) % CORES_DISPONIVEIS.length];

        const membroResp = membrosAmbiente.find((m) => String(m.id) === String(tarefa.responsavel_id));
        const responsavelNome =
          tarefa.responsavel_nome ||
          (membroResp ? membroResp.nome : (tarefa.responsavel_id ? `ID #${tarefa.responsavel_id}` : 'Sem responsável'));

        const iniciaisResp =
          tarefa.responsavel_nome || membroResp
            ? gerarIniciais(responsavelNome)
            : tarefa.responsavel_id
            ? `#${tarefa.responsavel_id}`
            : '?';

        const tagTexto =
          statusKey === 'CONCLUIDA'
            ? 'Concluída'
            : statusKey === 'EM_ANDAMENTO'
            ? 'Em execução'
            : tarefa.indicado_id && !tarefa.responsavel_id
            ? 'Aguardando aceite'
            : 'Planejada';

        const card = document.createElement('article');
        card.className = `task-card task-color-${cor}`;
        card.setAttribute('draggable', 'true');
        card.dataset.tarefaId = tarefa.id;

        card.innerHTML = `
          <div class="task-card-top">
            <span class="task-pill-tag">${tagTexto}</span>
            <div class="task-top-controls">
              <select class="task-status-select" aria-label="Mover status da tarefa">
                <option value="A_FAZER" ${statusKey === 'A_FAZER' ? 'selected' : ''}>A Fazer</option>
                <option value="EM_ANDAMENTO" ${statusKey === 'EM_ANDAMENTO' ? 'selected' : ''}>Em andamento</option>
                <option value="CONCLUIDA" ${statusKey === 'CONCLUIDA' ? 'selected' : ''}>Concluído</option>
              </select>
              <button type="button" class="btn-delete-task" title="Excluir tarefa" aria-label="Excluir tarefa">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>

          <h3 class="task-card-title">${escaparHTML(tarefa.titulo)}</h3>
          ${tarefa.descricao ? `<p class="task-card-desc">${escaparHTML(tarefa.descricao)}</p>` : ''}

          <div class="task-card-meta-row">
            <div class="task-assignee-chip" title="Responsável: ${escaparHTML(responsavelNome)}">
              <span class="task-mini-avatar">${escaparHTML(iniciaisResp)}</span>
              <span class="task-assignee-name">${escaparHTML(responsavelNome)}</span>
            </div>

            <span class="task-deadline-tag" title="Data Limite">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              ${formatarDataCurta(tarefa.data_limite)}
            </span>
          </div>

          <div class="task-card-footer">
            <div class="task-quick-actions">
              <button type="button" class="btn-card-action btn-assumir">Assumir</button>
              <button type="button" class="btn-card-action btn-indicar">Indicar</button>
            </div>

            <button type="button" class="btn-card-link" title="Gerenciar Links da Tarefa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
              <span>Links</span>
            </button>
          </div>
        `;

        // Eventos do Cartão
        const selectStatus = card.querySelector('.task-status-select');
        selectStatus.addEventListener('change', (e) => {
          atualizarStatusTarefa(tarefa.id, e.target.value);
        });

        card.querySelector('.btn-delete-task').addEventListener('click', (e) => {
          e.stopPropagation();
          excluirTarefa(tarefa.id);
        });

        card.querySelector('.btn-assumir').addEventListener('click', (e) => {
          e.stopPropagation();
          assumirTarefa(tarefa.id);
        });

        card.querySelector('.btn-indicar').addEventListener('click', (e) => {
          e.stopPropagation();
          abrirModalIndicar(tarefa);
        });

        card.querySelector('.btn-card-link').addEventListener('click', (e) => {
          e.stopPropagation();
          abrirModalLinks(tarefa);
        });

        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', String(tarefa.id));
          e.dataTransfer.effectAllowed = 'move';
          card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('dragging');
        });

        container.appendChild(card);
      });
    });
  }

  // Configura Drop Zones das 3 colunas
  [colAFazer, colEmAndamento, colConcluida].forEach((colEl) => {
    const statusMap = {
      colAFazer: 'A_FAZER',
      colEmAndamento: 'EM_ANDAMENTO',
      colConcluida: 'CONCLUIDA'
    };
    colEl.dataset.status = statusMap[colEl.id] || 'A_FAZER';

    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      colEl.classList.add('drag-over');
    });

    colEl.addEventListener('dragleave', () => {
      colEl.classList.remove('drag-over');
    });

    colEl.addEventListener('drop', (e) => {
      e.preventDefault();
      colEl.classList.remove('drag-over');
      const tarefaId = e.dataTransfer.getData('text/plain');
      const novoStatus = colEl.dataset.status;
      if (tarefaId && novoStatus) {
        atualizarStatusTarefa(tarefaId, novoStatus);
      }
    });
  });

  /* ==========================================================================
     6. AÇÕES REAIS DA API DE TAREFAS (CRIAR, STATUS, ASSUMIR, INDICAR, LINKS)
     ========================================================================== */
 // 6.1 Modal Criar Tarefa
  const createTaskModal = document.getElementById('createTaskModal');
  const createTaskForm = document.getElementById('createTaskForm');
  const createTaskAlert = document.getElementById('createTaskAlert');
  let corSelecionada = 'indigo';

  document.querySelectorAll('#taskColorSwatches .swatch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#taskColorSwatches .swatch-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      corSelecionada = btn.dataset.color || 'indigo';
    });
  });

  function abrirModalCriarTarefa(statusPadrao = 'A_FAZER') {
    if (!createTaskForm) return;
    createTaskForm.reset();
    preencherSelectsMembros();

    const statusEl = document.getElementById('taskStatusInput');
    if (statusEl) statusEl.value = statusPadrao;

    const tituloErrEl = document.getElementById('taskTituloError');
    if (tituloErrEl) tituloErrEl.textContent = '';

    const dataErrEl = document.getElementById('taskDataError');
    if (dataErrEl) dataErrEl.textContent = '';

    if (createTaskAlert) createTaskAlert.className = 'alert-box';

    abrirModal(createTaskModal);
    setTimeout(() => document.getElementById('taskTituloInput')?.focus(), 80);
  }

  document.getElementById('openCreateTaskModalBtn')?.addEventListener('click', () => abrirModalCriarTarefa('A_FAZER'));
  document.querySelectorAll('[data-quick-status]').forEach((btn) => {
    btn.addEventListener('click', () => abrirModalCriarTarefa(btn.dataset.quickStatus));
  });

  createTaskForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tituloError = document.getElementById('taskTituloError');
    const dataError = document.getElementById('taskDataError');
    if (tituloError) tituloError.textContent = '';
    if (dataError) dataError.textContent = '';
    if (createTaskAlert) createTaskAlert.className = 'alert-box';

    const tituloVal = (document.getElementById('taskTituloInput')?.value || '').trim();
    const descricaoVal = (document.getElementById('taskDescInput')?.value || '').trim();
    const dataLimiteVal = document.getElementById('taskDataInput')?.value || '';
    const statusVal = document.getElementById('taskStatusInput')?.value || 'A_FAZER';
    const responsavelVal = document.getElementById('taskResponsavelSelect')?.value || '';
    const indicadoVal = document.getElementById('taskIndicadoSelect')?.value || '';

    if (!tituloVal) {
      if (tituloError) tituloError.textContent = 'O título da tarefa é obrigatório.';
      document.getElementById('taskTituloInput')?.focus();
      return;
    }

    if (!dataLimiteVal) {
      if (dataError) dataError.textContent = 'A data limite é obrigatória.';
      document.getElementById('taskDataInput')?.focus();
      return;
    }

    const submitBtn = document.getElementById('createTaskSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Salvando...';
    }

    const payload = {
      titulo: tituloVal,
      descricao: descricaoVal || null,
      data_limite: dataLimiteVal,
      status: statusVal,
      ambiente_id: Number(ambienteId),
      responsavel_id: responsavelVal ? Number(responsavelVal) : null,
      indicado_id: indicadoVal ? Number(indicadoVal) : null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/tarefas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível criar a tarefa.');
      }

      const novaTarefa = data.tarefa || data;
      const novaId = novaTarefa?.id || data?.tarefa_id || data?.id;
      if (novaId) {
        salvarCorTarefa(novaId, corSelecionada);
      }

      fecharTodosModais();
      mostrarToast('Tarefa criada com sucesso!');
      await carregarAmbienteETarefas();
    } catch (error) {
      if (createTaskAlert) {
        createTaskAlert.textContent = error.message || 'Erro ao criar tarefa.';
        createTaskAlert.classList.add('show-error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Criar Tarefa';
      }
    }
  });
  // 6.2 Atualizar Status (PUT /api/tarefas/<tarefa_id>/status)
  async function atualizarStatusTarefa(tarefaId, novoStatus) {
    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao atualizar status.');
      }

      mostrarToast('Status atualizado!');
      await carregarAmbienteETarefas();
    } catch (error) {
      mostrarToast(error.message);
      await carregarAmbienteETarefas();
    }
  }

  // 6.2.1 Excluir Tarefa (DELETE /api/tarefas/<tarefa_id>)
  async function excluirTarefa(tarefaId) {
    const confirmou = window.confirm('Tem certeza que deseja excluir esta tarefa?');
    if (!confirmou) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: Number(usuarioId) })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.erro || 'Não foi possível excluir a tarefa.');
      }

      mostrarToast('Tarefa excluída!');
      await carregarAmbienteETarefas();
    } catch (error) {
      mostrarToast(error.message);
    }
  }

  // 6.3 Assumir Tarefa (POST /api/tarefas/<tarefa_id>/assumir)
  async function assumirTarefa(tarefaId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}/assumir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: Number(usuarioId) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível assumir a tarefa.');
      }

      mostrarToast('Você assumiu esta tarefa!');
      await carregarAmbienteETarefas();
    } catch (error) {
      mostrarToast(error.message);
    }
  }

  // 6.4 Indicar Colega (POST /api/tarefas/<tarefa_id>/indicar)
  const indicarModal = document.getElementById('indicarModal');
  const indicarForm = document.getElementById('indicarForm');
  const indicarTarefaIdInput = document.getElementById('indicarTarefaId');
  const indicarUsuarioIdInput = document.getElementById('indicarUsuarioIdInput');
  const indicarAlert = document.getElementById('indicarAlert');

  function abrirModalIndicar(tarefa) {
    indicarForm.reset();
    indicarAlert.className = 'alert-box';
    indicarTarefaIdInput.value = tarefa.id;
    document.getElementById('indicarTaskSubtitle').textContent = `Tarefa: "${tarefa.titulo}"`;

    const chipsBox = document.getElementById('membrosRapidosLista');
    chipsBox.innerHTML = '';
    if (membrosAmbiente.length > 0) {
      membrosAmbiente.forEach((m) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'member-chip-btn';
        btn.textContent = `${m.nome} (ID ${m.id})`;
        btn.addEventListener('click', () => {
          indicarUsuarioIdInput.value = m.id;
        });
        chipsBox.appendChild(btn);
      });
    }

    abrirModal(indicarModal);
    setTimeout(() => indicarUsuarioIdInput.focus(), 80);
  }

  indicarForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    indicarAlert.className = 'alert-box';

    const tarefaId = indicarTarefaIdInput.value;
    const indicadoId = Number(indicarUsuarioIdInput.value);

    if (!indicadoId) {
      indicarAlert.textContent = 'Informe um ID de usuário válido.';
      indicarAlert.classList.add('show-error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}/indicar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indicado_id: indicadoId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível indicar o colega.');
      }

      fecharTodosModais();
      mostrarToast('Indicação enviada com sucesso!');
      await carregarAmbienteETarefas();
    } catch (error) {
      indicarAlert.textContent = error.message;
      indicarAlert.classList.add('show-error');
    }
  });

  // 6.5 Gerenciar Links da Tarefa (/api/tarefas/<tarefa_id>/links)
  const linksModal = document.getElementById('linksModal');
  const addLinkForm = document.getElementById('addLinkForm');
  const linksTarefaIdInput = document.getElementById('linksTarefaId');
  const taskLinksList = document.getElementById('taskLinksList');
  const linksAlert = document.getElementById('linksAlert');

  async function carregarLinksTarefa(tarefaId) {
    taskLinksList.innerHTML = '<p class="links-empty-msg">Carregando links...</p>';
    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}/links`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const links = Array.isArray(data) ? data : (data.links || []);

      if (links.length === 0) {
        taskLinksList.innerHTML = '<p class="links-empty-msg">Nenhum link anexado a esta tarefa.</p>';
        return;
      }

      taskLinksList.innerHTML = links
        .map(
          (l) => `
          <div class="task-link-item">
            <a href="${escaparHTML(l.url)}" target="_blank" rel="noopener noreferrer">
              🔗 ${escaparHTML(l.titulo || l.url)}
            </a>
          </div>`
        )
        .join('');
    } catch (_) {
      taskLinksList.innerHTML = '<p class="links-empty-msg">Não foi possível carregar os links.</p>';
    }
  }

  function abrirModalLinks(tarefa) {
    addLinkForm.reset();
    linksAlert.className = 'alert-box';
    linksTarefaIdInput.value = tarefa.id;
    document.getElementById('linksTaskSubtitle').textContent = `Tarefa: "${tarefa.titulo}"`;
    abrirModal(linksModal);
    carregarLinksTarefa(tarefa.id);
  }

  addLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    linksAlert.className = 'alert-box';

    const tarefaId = linksTarefaIdInput.value;
    const titulo = document.getElementById('linkTituloInput').value.trim();
    const url = document.getElementById('linkUrlInput').value.trim();

    if (!titulo || !url) {
      linksAlert.textContent = 'Preencha o título e a URL do link.';
      linksAlert.classList.add('show-error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          url,
          usuario_id: Number(usuarioId)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || 'Erro ao adicionar link.');
      }

      addLinkForm.reset();
      mostrarToast('Link adicionado!');
      await carregarLinksTarefa(tarefaId);
    } catch (error) {
      linksAlert.textContent = error.message;
      linksAlert.classList.add('show-error');
    }
  });

  /* ==========================================================================
     7. MODAL CHAVE (CÓDIGO DE CONVITE E GERAR NOVO CÓDIGO)
     ========================================================================== */
  const inviteCodeModal = document.getElementById('inviteCodeModal');
  const modalInviteCodeText = document.getElementById('modalInviteCodeText');
  const inviteCodeAlert = document.getElementById('inviteCodeAlert');

  document.getElementById('openInviteCodeModalBtn').addEventListener('click', () => {
    inviteCodeAlert.className = 'alert-box';
    modalInviteCodeText.textContent = (ambienteAtual && ambienteAtual.codigo_convite) || '------';
    abrirModal(inviteCodeModal);
  });

  document.getElementById('copyRoomCodeBtn').addEventListener('click', async () => {
    const code = modalInviteCodeText.textContent.trim();
    if (!code || code === '------') return;
    try {
      await navigator.clipboard.writeText(code);
      mostrarToast('Código de convite copiado!');
    } catch (_) {
      mostrarToast(`Código: ${code}`);
    }
  });

  document.getElementById('regenerateCodeBtn').addEventListener('click', async () => {
    inviteCodeAlert.className = 'alert-box';
    try {
      const response = await fetch(`${API_BASE_URL}/ambientes/${ambienteId}/gerar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: Number(usuarioId) })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.erro || 'Não foi possível gerar um novo código.');
      }

      const novoCodigo = data.codigo_convite || (data.ambiente && data.ambiente.codigo_convite);
      if (novoCodigo) {
        modalInviteCodeText.textContent = novoCodigo;
        if (ambienteAtual) ambienteAtual.codigo_convite = novoCodigo;
      }

      inviteCodeAlert.textContent = 'Novo código gerado com sucesso!';
      inviteCodeAlert.classList.add('show-success');
    } catch (error) {
      inviteCodeAlert.textContent = error.message;
      inviteCodeAlert.classList.add('show-error');
    }
  });

  /* ==========================================================================
     8. NAVEGAÇÃO DA SIDEBAR (TAREFAS / PROJETOS / MEMBROS / CONFIGURAÇÕES)
     ========================================================================== */
  const sidebarEl = document.getElementById('appSidebar');
  const kanbanView = document.getElementById('kanbanView');
  const secondaryView = document.getElementById('secondaryView');

  document.getElementById('toggleSidebarBtn').addEventListener('click', () => {
    sidebarEl.classList.toggle('open');
  });

  document.querySelectorAll('.sidebar-nav .nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav .nav-item').forEach((n) => n.classList.remove('active'));
      btn.classList.add('active');
      sidebarEl.classList.remove('open');

      const view = btn.dataset.view;
      if (view === 'tarefas') {
        kanbanView.hidden = false;
        secondaryView.hidden = true;
        return;
      }

      kanbanView.hidden = true;
      secondaryView.hidden = false;

      if (view === 'projetos') {
        secondaryView.innerHTML = `
          <h2>Sobre o Projeto</h2>
          <p><strong>Nome:</strong> ${escaparHTML((ambienteAtual && ambienteAtual.nome) || '')}</p>
          <p style="margin-top:8px;"><strong>Descrição:</strong> ${escaparHTML((ambienteAtual && ambienteAtual.descricao) || 'Nenhuma descrição informada.')}</p>
          <p style="margin-top:8px;"><strong>Data de Entrega:</strong> ${formatarDataCurta(ambienteAtual && ambienteAtual.data_entrega)}</p>
        `;
      } else if (view === 'membros') {
        secondaryView.innerHTML = renderizarAbaMembros();
      } else if (view === 'configuracoes') {
        secondaryView.innerHTML = `
          <h2>Configurações do Ambiente</h2>
          <p><strong>ID da Sala:</strong> #${escaparHTML(ambienteId)}</p>
          <p style="margin-top:8px;"><strong>Código de Convite Atual:</strong> ${escaparHTML((ambienteAtual && ambienteAtual.codigo_convite) || '------')}</p>
        `;
      }
    });
  });

  // Inicialização
  carregarAmbienteETarefas();
  carregarNotificacoesHeader();
});
