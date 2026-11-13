import datetime
import random
import string
from flask import Flask, request, jsonify, render_template

from models.ambiente import AmbienteTrabalho
from models.participacao import Participacao
from models.tarefa import Tarefa
from models.link_tarefa import LinkTarefa

from daos.usuario_dao import UsuarioDAO
from daos.ambiente_dao import AmbienteDAO
from daos.participacao_dao import ParticipacaoDAO
from daos.tarefa_dao import TarefaDAO
from daos.link_tarefa_dao import LinkTarefaDAO
from database import obter_conexao, inicializar_banco

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

# Cria todas as tabelas automaticamente se ainda não existirem
inicializar_banco()



usuario_dao = UsuarioDAO()
ambiente_dao = AmbienteDAO()
participacao_dao = ParticipacaoDAO()
tarefa_dao = TarefaDAO()
link_tarefa_dao = LinkTarefaDAO()

def gerar_codigo_convite(tamanho=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=tamanho))

def executar_query(sql, parametros=(), fetch=None):
    conn = obter_conexao()
    cursor = conn.cursor()
    cursor.execute(sql, parametros)
    res = cursor.fetchall() if fetch == 'all' else cursor.fetchone() if fetch == 'one' else None
    conn.commit()
    conn.close()
    return res

# ==========================================
# 1. ROTAS DE AMBIENTES DE TRABALHO
# ==========================================

@app.route('/api/ambientes', methods=['POST'])
def criar_ambiente():
    dados = request.get_json() or {}
    if not dados.get('usuario_id') or not dados.get('nome'):
        return jsonify({"erro": "usuario_id e nome são obrigatórios"}), 400

    codigo = gerar_codigo_convite()
    ambiente = AmbienteTrabalho(
        nome=dados.get('nome'), 
        descricao=dados.get('descricao'), 
        data_entrega=dados.get('data_entrega'), 
        codigo_convite=codigo
    )
    a_id = ambiente_dao.inserir(ambiente)
    participacao_dao.inserir(Participacao(papel='criador', usuario_id=dados['usuario_id'], ambiente_id=a_id))

    return jsonify({"mensagem": "Ambiente criado", "ambiente_id": a_id, "codigo_convite": codigo}), 201


@app.route('/api/ambientes/entrar', methods=['POST'])
def entrar_ambiente():
    dados = request.get_json() or {}
    usuario_id, codigo = dados.get('usuario_id'), dados.get('codigo_convite')
    
    if not usuario_id or not codigo:
        return jsonify({"erro": "usuario_id e codigo_convite são obrigatórios"}), 400

    ambiente = ambiente_dao.buscar_por_codigo(codigo)
    if not ambiente:
        return jsonify({"erro": "Ambiente não encontrado"}), 404

    if participacao_dao.buscar_por_usuario_e_ambiente(usuario_id, ambiente.id):
        return jsonify({"erro": "Usuário já participa deste ambiente"}), 400

    participacao_dao.inserir(Participacao(papel='participante', usuario_id=usuario_id, ambiente_id=ambiente.id))
    return jsonify({"mensagem": "Entrada realizada", "ambiente": ambiente.to_dict()}), 200


@app.route('/api/ambientes/usuario/<int:usuario_id>', methods=['GET'])
def listar_ambientes_usuario(usuario_id):
    rows = executar_query("""
        SELECT a.* FROM AmbienteTrabalho a
        JOIN Participacao p ON a.id = p.ambiente_id
        WHERE p.usuario_id = ?
    """, (usuario_id,), fetch='all')

    ambientes = [
        AmbienteTrabalho(
            id=r['id'], nome=r['nome'], descricao=r['descricao'], 
            data_entrega=r['data_entrega'], codigo_convite=r['codigo_convite']
        ).to_dict() for r in rows
    ]
    return jsonify(ambientes), 200


@app.route('/api/ambientes/<int:ambiente_id>', methods=['DELETE'])
def excluir_ambiente(ambiente_id):
    usuario_id = request.args.get('usuario_id', type=int)
    participacao = participacao_dao.buscar_por_usuario_e_ambiente(usuario_id, ambiente_id)
    
    if not participacao or participacao.papel != 'criador':
        return jsonify({"erro": "Apenas o criador pode excluir o ambiente"}), 403

    executar_query("DELETE FROM AmbienteTrabalho WHERE id = ?", (ambiente_id,))
    return jsonify({"mensagem": "Ambiente excluído"}), 200


@app.route('/api/ambientes/<int:ambiente_id>/gerar-codigo', methods=['POST'])
def regenerar_codigo_convite(ambiente_id):
    novo_codigo = gerar_codigo_convite()
    executar_query("UPDATE AmbienteTrabalho SET codigo_convite = ? WHERE id = ?", (novo_codigo, ambiente_id))
    return jsonify({"mensagem": "Código atualizado", "novo_codigo": novo_codigo}), 200

# ==========================================
# 2. ROTAS DE TAREFAS
# ==========================================

@app.route('/api/tarefas', methods=['POST'])
def criar_tarefa():
    dados = request.get_json() or {}
    if not dados.get('titulo') or not dados.get('ambiente_id'):
        return jsonify({"erro": "titulo e ambiente_id são obrigatórios"}), 400

    tarefa = Tarefa(
        titulo=dados.get('titulo'),
        descricao=dados.get('descricao'),
        data_limite=dados.get('data_limite'),
        ambiente_id=dados.get('ambiente_id'),
        responsavel_id=dados.get('responsavel_id'),
        indicado_id=dados.get('indicado_id')
    )
    return jsonify({"mensagem": "Tarefa criada", "tarefa_id": tarefa_dao.inserir(tarefa)}), 201


@app.route('/api/tarefas/<int:tarefa_id>/assumir', methods=['POST'])
def assumir_tarefa(tarefa_id):
    usuario_id = (request.get_json() or {}).get('usuario_id')
    executar_query("UPDATE Tarefa SET responsavel_id = ?, status = 'EM_ANDAMENTO' WHERE id = ?", (usuario_id, tarefa_id))
    return jsonify({"mensagem": "Tarefa assumida"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/indicar', methods=['POST'])
def indicar_colega(tarefa_id):
    indicado_id = (request.get_json() or {}).get('indicado_id')
    executar_query("UPDATE Tarefa SET indicado_id = ? WHERE id = ?", (indicado_id, tarefa_id))
    return jsonify({"mensagem": "Indicação realizada"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/aceitar', methods=['POST'])
def aceitar_indicacao(tarefa_id):
    usuario_id = (request.get_json() or {}).get('usuario_id')
    executar_query("UPDATE Tarefa SET responsavel_id = ?, indicado_id = NULL, status = 'EM_ANDAMENTO' WHERE id = ? AND indicado_id = ?", (usuario_id, tarefa_id, usuario_id))
    return jsonify({"mensagem": "Indicação aceita"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/recusar', methods=['POST'])
def recusar_indicacao(tarefa_id):
    usuario_id = (request.get_json() or {}).get('usuario_id')
    executar_query("UPDATE Tarefa SET indicado_id = NULL WHERE id = ? AND indicado_id = ?", (tarefa_id, usuario_id))
    return jsonify({"mensagem": "Indicação recusada"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/status', methods=['PUT'])
def atualizar_status_tarefa(tarefa_id):
    status = (request.get_json() or {}).get('status')
    if status not in ['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA']:
        return jsonify({"erro": "Status inválido"}), 400

    executar_query("UPDATE Tarefa SET status = ? WHERE id = ?", (status, tarefa_id))
    return jsonify({"mensagem": "Status atualizado"}), 200

# ==========================================
# 3. ROTAS DA SEÇÃO "MEUS AVISOS"
# ==========================================

@app.route('/api/avisos/<int:usuario_id>', methods=['GET'])
def obter_meus_avisos(usuario_id):
    hoje = datetime.date.today().isoformat()

    def serializar(query, params):
        rows = executar_query(query, params, fetch='all')
        return [Tarefa(
            id=r['id'], titulo=r['titulo'], descricao=r['descricao'], 
            data_limite=r['data_limite'], status=r['status'], 
            ambiente_id=r['ambiente_id'], responsavel_id=r['responsavel_id'], 
            indicado_id=r['indicado_id']
        ).to_dict() for r in rows]

    return jsonify({
        "indicacoes_pendentes": serializar("SELECT * FROM Tarefa WHERE indicado_id = ?", (usuario_id,)),
        "tarefas_a_vencer": serializar("SELECT * FROM Tarefa WHERE responsavel_id = ? AND data_limite = ? AND status != 'CONCLUIDA'", (usuario_id, hoje)),
        "tarefas_atrasadas": serializar("SELECT * FROM Tarefa WHERE responsavel_id = ? AND data_limite < ? AND status != 'CONCLUIDA'", (usuario_id, hoje))
    }), 200

# ==========================================
# 4. ROTAS DE LINKS E PARTICIPANTES
# ==========================================

@app.route('/api/tarefas/<int:tarefa_id>/links', methods=['POST'])
def adicionar_link(tarefa_id):
    dados = request.get_json() or {}
    if not dados.get('titulo') or not dados.get('url'):
        return jsonify({"erro": "titulo e url são obrigatórios"}), 400

    link_id = link_tarefa_dao.inserir(LinkTarefa(titulo=dados['titulo'], url=dados['url'], tarefa_id=tarefa_id))
    return jsonify({"mensagem": "Link adicionado", "link_id": link_id}), 201


@app.route('/api/tarefas/links/<int:link_id>', methods=['DELETE'])
def remover_link(link_id):
    executar_query("DELETE FROM LinkTarefa WHERE id = ?", (link_id,))
    return jsonify({"mensagem": "Link removido"}), 200


@app.route('/api/ambientes/<int:ambiente_id>/participantes/<int:usuario_id>', methods=['DELETE'])
def remover_participante(ambiente_id, usuario_id):
    executar_query("DELETE FROM Participacao WHERE ambiente_id = ? AND usuario_id = ?", (ambiente_id, usuario_id))
    return jsonify({"mensagem": "Participante removido"}), 200

@app.route('/')
def home():
    return render_template('index.html')

# ==========================================
# 4. ROTAS DE USUÁRIOS (CADASTRO E LOGIN)
# ==========================================

@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    rows = executar_query("SELECT id, nome, email, foto_perfil FROM Usuario", fetch='all')
    usuarios = [
        {
            "id": r['id'],
            "nome": r['nome'],
            "email": r['email'],
            "foto_perfil": r['foto_perfil']
        } for r in rows
    ]
    return jsonify(usuarios), 200


@app.route('/api/usuarios', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json() or {}
    nome = dados.get('nome')
    email = dados.get('email')
    foto_perfil = dados.get('foto_perfil', 'default.png')

    if not nome or not email:
        return jsonify({"erro": "Nome e e-mail são obrigatórios"}), 400

    # Verifica se o e-mail já está no banco
    existente = executar_query(
        "SELECT id, nome, email, foto_perfil FROM Usuario WHERE email = ?", 
        (email,), 
        fetch='one'
    )
    if existente:
        return jsonify({
            "mensagem": "Usuário já cadastrado",
            "usuario": {
                "id": existente['id'],
                "nome": existente['nome'],
                "email": existente['email'],
                "foto_perfil": existente['foto_perfil']
            }
        }), 200

    # Insere o novo usuário no banco
    executar_query(
        "INSERT INTO Usuario (nome, email, foto_perfil) VALUES (?, ?, ?)",
        (nome, email, foto_perfil)
    )

    # Busca o usuário recém-criado para retornar com o ID
    novo = executar_query(
        "SELECT id, nome, email, foto_perfil FROM Usuario WHERE email = ?", 
        (email,), 
        fetch='one'
    )

    return jsonify({
        "mensagem": "Usuário criado com sucesso",
        "usuario": {
            "id": novo['id'],
            "nome": novo['nome'],
            "email": novo['email'],
            "foto_perfil": novo['foto_perfil']
        }
    }), 201

if __name__ == '__main__':
    app.run(debug=True)
