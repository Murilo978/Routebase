# Documentação de Especificação do Projeto: Routebase

## 1. Apresentação do Projeto
O **Routebase** é uma plataforma web voltada para a organização e gestão colaborativa de trabalhos em grupo. A proposta do sistema é reunir integrantes em um ambiente compartilhado, permitindo cadastrar projetos, atribuir responsabilidades, acompanhar o progresso das atividades e registrar prazos de entrega.

O diferencial da plataforma é a colaboração na definição de responsabilidades: os participantes podem assumir tarefas disponíveis voluntariamente ou aceitar/recusar indicações feitas por outros colegas, tornando os compromissos claros e acordados por todos.

---

## 2. Problema e Objetivo
Em trabalhos coletivos, as informações frequentemente ficam espalhadas em aplicativos de mensagens e anotações, gerando dúvidas sobre prazos, responsabilidades e andamento.

O **Routebase** resolve esse problema ao centralizar:
* A organização do trabalho em espaços próprios de cada grupo.
* A definição transparente de responsabilidades com aceite dos participantes.
* O acompanhamento de prazos, tarefas pendentes, em andamento, concluídas e atrasadas.
* O compartilhamento de links de materiais externos relacionados às tarefas.

---

## 3. Identificação e Acesso ao Sistema
Para manter a plataforma enxuta e focada na entrega funcional das regras de negócio no prazo do MVP, o sistema utiliza a **Identificação Simplificada de Usuário por Nome e E-mail**:

* **Acesso Inicial:** O usuário informa seu nome e e-mail no primeiro acesso. Se o e-mail já estiver cadastrado no banco de dados, o sistema recupera seus dados e ambientes associados.
* **Entrada em Ambientes:** A entrada em um grupo de trabalho ocorre via código de convite. O criador compartilha o código por fora da plataforma, e o novo integrante digita o código no painel para confirmar sua participação.

---

## 4. Estrutura de Domínio e Modelagem de Dados
A arquitetura de dados da aplicação é composta por 5 entidades principais no banco relacional:

### 4.1. Entidades Principais
* **`Usuario`**: Armazena a identificação das pessoas cadastradas na plataforma (`id`, `nome`, `email`).
* **`AmbienteTrabalho`**: Representa o espaço compartilhado do grupo (`id`, `nome`, `descricao`, `data_entrega`, `codigo_convite`).
* **`Participacao`**: Tabela associativa que vincula um `Usuario` a um `AmbienteTrabalho`, definindo seu papel (`criador` ou `participante`).
* **`Tarefa`**: Armazena as atividades do grupo (`id`, `titulo`, `descricao`, `data_limite`, `status`).
* **`LinkTarefa`**: Guarda os endereços e títulos de materiais externos vinculados a uma tarefa (`id`, `titulo`, `url`).

### 4.2. Relacionamentos e Regras de Associação
* Um `Usuario` possui uma ou várias `Participacoes` (`1` para `0..*`).
* Um `AmbienteTrabalho` possui uma ou várias `Participacoes` (`1` para `1..*`).
* Um `AmbienteTrabalho` contém zero ou várias `Tarefas` (`1` para `0..*`).
* Uma `Tarefa` pode possuir no máximo 1 `Participacao` associada como **indicado** (aguardando aceite) **OU** 1 `Participacao` associada como **responsável** (compromisso confirmado), mas nunca ambas simultaneamente (`0..1` para `0..*`).
* Uma `Tarefa` pode conter zero ou vários `LinkTarefa` (`1` para `0..*`).

### 4.3. Diagramas do Sistema
<!-- Substitua os caminhos abaixo pelos nomes reais das suas imagens na pasta docs/imagens/ -->
![Diagrama de Classes](imagens/diagrama-classes.png)

---

## 5. Regras de Negócio e Funcionamento das Tarefas

### 5.1. Situações de Responsabilidade
* **Disponível:** Tarefa sem indicação pendente e sem responsável confirmado. Qualquer participante pode assumi-la ou indicar um colega.
* **Aguardando Aceite:** Tarefa com um integrante indicado. Apenas a pessoa indicada pode aceitar ou recusar a indicação.
* **Responsável Confirmado:** Situação estabelecida quando o integrante assume a tarefa ou aceita uma indicação recebida.

### 5.2. Andamento das Tarefas
O andamento da tarefa é tratado de forma independente da responsabilidade, assumindo os valores:
* `A_FAZER`: Status inicial padrão de toda nova tarefa.
* `EM_ANDAMENTO`: Atualizado pelo responsável confirmado durante a execução.
* `CONCLUIDA`: Finalizado pelo responsável quando a atividade é entregue.

> **Nota:** Uma tarefa sem responsável confirmado não pode ser iniciada ou concluída. O status *"Atrasada"* é uma condição calculada quando a data atual ultrapassa o prazo da tarefa e ela não está concluída.

---

## 6. Papéis e Permissões
* **Usuário Identificado:** Pode criar novos ambientes, entrar em ambientes existentes por código e consultar a seção *"Meus Avisos"* na tela inicial.
* **Participante:** Pode criar tarefas, assumir tarefas disponíveis, indicar integrantes, aceitar/recusar indicações direcionadas a si, atualizar o andamento de suas tarefas e vincular links externos.
* **Criador:** Herda todas as permissões de Participante e possui autoridade administrativa para gerenciar o código de convite do ambiente, remover integrantes sem tarefas vinculadas e excluir o ambiente.

---

## 7. Seção "Meus Avisos"
A área de avisos pessoais é gerada dinamicamente na tela inicial do usuário e lista:
* Indicações de tarefas aguardando o seu aceite.
* Suas tarefas com vencimento no dia atual.
* Suas tarefas com vencimento nos próximos 2 dias.
* Suas tarefas em atraso.

---

## 8. Arquitetura Técnica
A aplicação é construída com a seguinte pilha tecnológica:
* **Back-end:** Python com micro-framework Flask.
* **Persistência:** Banco de Dados Relacional acessado via classes DAO.
* **Front-end:** Interface web construída com HTML, CSS e JavaScript (Fetch API para consumo de endpoints em formato JSON).
