# Routebase - MVP (Back-end)

Plataforma web voltada para a organização e gestão colaborativa de trabalhos em grupo.

## 🚀 Tecnologias Utilizadas

- **Python** (Micro-framework **Flask**)
- **SQLite** (Banco de dados relacional com suporte a chaves estrangeiras)
- **Arquitetura DAO** (Data Access Object para persistência e CRUD completo)

## 📁 Estrutura do Projeto

```text
meu-projeto-backend/
├── app.py                  # Servidor Flask e rotas da API
├── database.py             # Script de inicialização e tabelas do banco SQLite
├── requirements.txt        # Dependências do projeto
│
├── docs/                   # Documentação do projeto, sitemap e wireframes
│
├── models/                 # Classes de modelo (POO) das entidades
│   ├── usuario.py
│   ├── ambiente.py
│   ├── participacao.py
│   ├── tarefa.py
│   └── link_tarefa.py
│
└── daos/                   # Classes de acesso e persistência no banco (CRUD)
    ├── usuario_dao.py
    ├── ambiente_dao.py
    ├── participacao_dao.py
    ├── tarefa_dao.py
    └── link_tarefa_dao.py
````
⚙️ Como Executar o Projeto
Clone o repositório ou faça o download dos arquivos.

Instale as dependências executando:

Bash
pip install -r requirements.txt
Inicie o servidor Flask:

Bash
python app.py
O servidor estará rodando em http://127.0.0.1:5000. O banco de dados database.db será criado automaticamente na primeira execução com todas as tabelas inicializadas.

📄 Documentação do Projeto
Para consultar as regras de negócio, sitemap, wireframes e a modelagem conceitual/diagrama de classes:

Acesse a pasta /docs para os artefatos visuais e de design.

Consulte a Documentação de Especificação e Arquitetura completa.

👨‍🏫 Colaboradores e Avaliação
Professor: leonardo.stephan@eaportal.org
