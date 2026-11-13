# Routebase - MVP (Full-Stack: Back-end + Front-end Institucional e Autenticação)

Plataforma web voltada para a organização e gestão colaborativa de trabalhos em grupo, com definição transparente de responsabilidades por aceite, ambientes compartilhados via código de convite e monitoramento de prazos.

## 🚀 Tecnologias Utilizadas

### Back-end
- **Python 3** (Micro-framework **Flask**)
- **SQLite** (Banco de dados relacional com suporte a chaves estrangeiras)
- **Arquitetura DAO** (Data Access Object para persistência e CRUD completo)
- **API RESTful** (Endpoints em JSON para usuários, ambientes, tarefas, avisos e links)

### Front-end
- **HTML5 Semântico** (Landing Page institucional e páginas dedicadas de acesso)
- **CSS3 Moderno** (Design orgânico, responsivo, variáveis CSS, Flexbox e CSS Grid)
- **JavaScript Puro (ES6+)** (Fetch API para integração com o Flask, validações, controle de modais e persistência de sessão via `localStorage`)

## 📁 Estrutura Atualizada do Projeto

```text
routebase/
├── app.py                      # Servidor Flask e rotas completas da API REST
├── database.py                 # Script de inicialização e tabelas do banco SQLite
├── requirements.txt            # Dependências do projeto Python
│
├── index.html                  # Landing Page institucional de apresentação da plataforma
├── style.css                   # Estilos da Landing Page e modais interativos
├── script.js                   # Lógica de navegação, modais e integração da Landing Page
│
├── pages/                      # Páginas exclusivas da aplicação
│   ├── login.html              # Tela exclusiva de Login ("Acessar Sua Rota")
│   └── cadastro.html           # Tela exclusiva de Cadastro ("Criar Nova Base")
│
├── estilos/                    # Folhas de estilo das páginas internas
│   ├── login.css               # Estilização da tela de Login
│   └── cadastro.css            # Estilização da tela de Cadastro
│
├── javascript/                 # Scripts de comportamento e consumo de API das páginas
│   ├── login.js                # Validação, consulta de usuário e redirecionamento do Login
│   └── cadastro.js             # Validação, trava contra e-mail duplicado e auto-login no Cadastro
│
├── assets/                     # Recursos visuais e mídias locais
│   ├── images/                 # Logotipo, prints do painel e ilustrações orgânicas
│   └── icons/                  # Ícones dos pilares e funcionalidades
│
├── docs/                       # Documentação do projeto, sitemap e wireframes
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
````
✨ O que foi implementado na etapa atual

Site Institucional (index.html, style.css, script.js): Vitrine pública da plataforma com identidade visual orgânica, menus dropdown interativos, seção Hero com demonstração do painel, pilares de valor, fluxo passo a passo e modais de acesso rápido.

Página Exclusiva de Login (pages/login.html): Interface dedicada conectada via fetch() ao back-end Flask para validar usuários cadastrados por nome e e-mail, armazenar a sessão no localStorage e redirecionar para pages/inicio.html.

Página Exclusiva de Cadastro (pages/cadastro.html): Formulário completo com aceite obrigatório dos Termos de Uso, trava contra contas duplicadas (verificando e-mails já existentes no banco antes de gravar) e auto-login imediato após o cadastro.

⚙️ Como Executar o Projeto
Clone o repositório ou faça o download dos arquivos.

Instale as dependências do back-end executando:

Bash
pip install -r requirements.txt
(Certifique-se de ter o flask-cors instalado caso abra o front-end via Live Server ou arquivo local).

Inicie o servidor Flask:

Bash
python app.py
O servidor estará rodando em http://127.0.0.1:5000. O banco de dados database.db será criado automaticamente na primeira execução com todas as tabelas inicializadas.

Acesse o Front-end:

Abra o arquivo index.html no navegador (ou via extensão Live Server) para visualizar a página institucional.

Navegue diretamente para pages/login.html ou pages/cadastro.html para testar o fluxo de autenticação conectado à API.

📄 Documentação do Projeto
Para consultar as regras de negócio, sitemap, wireframes e a modelagem conceitual/diagrama de classes:

Acesse a pasta /docs para os artefatos visuais e de design.

Consulte a Documentação de Especificação e Arquitetura completa.

👨‍🏫 Colaboradores e Avaliação
Professor: leonardo.stephan@eaportal.org
