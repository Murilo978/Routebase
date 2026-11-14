# Routebase — Plataforma de Gestão Colaborativa e Ambientes de Trabalho

> 🌐 **Acesse o sistema rodando online:** [https://pythonanywhere.com](https://pythonanywhere.com)

Plataforma web full-stack voltada para a organização e gestão colaborativa de trabalhos em grupo, com definição transparente de responsabilidades por aceite, ambientes compartilhados via código de convite, quadro Kanban interativo e monitoramento automático de prazos.

---

## 🚀 Tecnologias Utilizadas

### Back-end & Banco de Dados
- **Python 3** (Micro-framework **Flask**)
- **SQLite** (Banco de dados relacional com suporte a chaves estrangeiras e integridade referencial)
- **POO & Arquitetura DAO** (Classes de modelo em `models/` e objetos de acesso a dados em `daos/` para persistência e CRUD completo)
- **API RESTful** (Endpoints em JSON para usuários, ambientes, participações, tarefas, links e painel de avisos)

### Front-end
- **HTML5 Semântico** (Landing Page institucional, telas de autenticação, lobby de ambientes e quadro Kanban)
- **CSS3 Moderno** (Design orgânico, responsivo, Flexbox, CSS Grid, modais e popovers interativos)
- **JavaScript Puro (ES6+)** (Fetch API para consumo assíncrono das rotas Flask, manipulação dinâmica do DOM e persistência de sessão via `localStorage`)

---

## 📁 Estrutura Atualizada do Projeto

```text
Routebase/
├── app.py                      # Servidor Flask e rotas completas da API REST
├── database.py                 # Script de inicialização e criação das tabelas no SQLite
├── requirements.txt            # Dependências do projeto Python
│
├── index.html                  # Landing Page institucional de apresentação da plataforma
├── style.css                   # Estilos da Landing Page
├── script.js                   # Lógica de navegação e interatividade da Landing Page
│
├── pages/                      # Páginas exclusivas da aplicação
│   ├── login.html              # Tela de Login ("Acessar Sua Rota")
│   ├── cadastro.html           # Tela de Cadastro ("Criar Nova Base")
│   ├── inicio.html             # Lobby inicial (Criar ambiente, entrar por código, perfil e avisos)
│   └── ambiente.html           # Painel interno do ambiente (Quadro Kanban e gestão de tarefas)
│
├── estilos/                    # Folhas de estilo das páginas internas
│   ├── login.css               # Estilização da tela de Login
│   ├── cadastro.css            # Estilização da tela de Cadastro
│   ├── inicio.css              # Estilização do lobby, popovers de perfil/notificações e modais
│   └── ambiente.css            # Estilização da sidebar, colunas Kanban e cartões de tarefas
│
├── javascript/                 # Scripts de comportamento e integração com a API (Fetch)
│   ├── login.js                # Autenticação de usuário e gravação de sessão no localStorage
│   ├── cadastro.js             # Cadastro com trava contra duplicidade e auto-login
│   ├── inicio.js               # Criação/entrada em ambientes, troca de avatar e painel de avisos
│   └── ambiente.js             # Carregamento do Kanban, criação, movimentação, aceite e exclusão de tarefas
│
├── assets/                     # Recursos visuais, logotipo e ilustrações orgânicas
├── docs/                       # Documentação do projeto, diagramas UML, sitemap e wireframes
│
├── models/                     # Classes de modelo (POO) das entidades
│   ├── usuario.py
│   ├── ambiente.py
│   ├── participacao.py
│   ├── tarefa.py
│   └── link_tarefa.py
│
└── daos/                       # Classes de acesso e persistência no banco (CRUD)
    ├── usuario_dao.py
    ├── ambiente_dao.py
    ├── participacao_dao.py
    ├── tarefa_dao.py
    └── link_tarefa_dao.py
```

---

## ✨ Funcionalidades Implementadas (Sistema Completo)

- **Site Institucional (`index.html`):** Vitrine pública de apresentação da plataforma com identidade visual orgânica e acesso rápido para cadastro ou login.
- **Autenticação e Cadastro (`pages/login.html` e `pages/cadastro.html`):** Criação de conta com validação contra e-mails duplicados, auto-login imediato e persistência de sessão via `localStorage`.
- **Lobby e Gestão de Ambientes (`pages/inicio.html`):**
  - Criação de novos ambientes de trabalho com geração automática de **código de convite** único de 6 caracteres.
  - Entrada em ambientes existentes através do código de convite.
  - Listagem dinâmica dos ambientes vinculados ao usuário.
  - **Perfil e Notificações:** Menu de perfil com alteração de foto (avatar) e painel de **Meus Avisos** (indicações pendentes com aceite/recusa, tarefas a vencer e atrasadas).
- **Quadro Kanban e Tarefas (`pages/ambiente.html`):**
  - Visualização organizada em colunas (**A Fazer**, **Em Andamento** e **Concluída**).
  - Criação, atualização de status, indicação de colegas, vínculo de links/anexos e exclusão de tarefas integrada em tempo real ao banco de dados SQLite.

---

## ⚙️ Como Executar o Projeto Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com
   cd Routebase
   ```

2. **Instale as dependências do back-end:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Inicialize o banco de dados SQLite:**
   ```bash
   python database.py
   ```
   *(Este comando cria o arquivo `database.db` com todas as tabelas e relacionamentos prontos).*

4. **Inicie o servidor Flask:**
   ```bash
   python app.py
   ```

5. **Acesse a aplicação:**
   Abra o navegador e acesse **`http://127.0.0.1:5000`**.

---

## 📄 Documentação do Projeto

Para consultar as regras de negócio, diagramas de classes (UML), modelagem do banco de dados, sitemap e wireframes:
- Acesse a pasta **`/docs`** neste repositório.

---

## 👨‍🏫 Projeto Integrado — DWS + POO + BD

- **Avaliação e Colaboração:** `leonardo.stephan@eaportal.org`
- **Deploy em Produção (PythonAnywhere):** [https://murilo564.pythonanywhere.com]
