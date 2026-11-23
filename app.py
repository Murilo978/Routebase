import datetime
import random
import string
from flask import Flask, request, jsonify, render_template

from models.usuario import Usuario
from models.ambiente import AmbienteTrabalho
from models.participacao import Participacao
from models.tarefa import Tarefa
from models.link_tarefa import LinkTarefa

from daos.usuario_dao import UsuarioDAO
from daos.ambiente_dao import AmbienteDAO
from daos.participacao_dao import ParticipacaoDAO
from daos.tarefa_dao import TarefaDAO
from daos.link_tarefa_dao import LinkTarefaDAO
from database import inicializar_banco

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
    ambientes = ambiente_dao.listar_por_usuario(usuario_id)
    return jsonify([a.to_dict() if hasattr(a, 'to_dict') else a for a in ambientes]), 200


@app.route('/api/ambientes/<int:ambiente_id>', methods=['DELETE'])
def excluir_ambiente(ambiente_id):
    usuario_id = request.args.get('usuario_id', type=int)
    participacao = participacao_dao.buscar_por_usuario_e_ambiente(usuario_id, ambiente_id)

    if not participacao or participacao.papel != 'criador':
        return jsonify({"erro": "Apenas o criador pode excluir o ambiente"}), 403

    ambiente_dao.excluir(ambiente_id)
    return jsonify({"mensagem": "Ambiente excluído"}), 200


@app.route('/api/ambientes/<int:ambiente_id>', methods=['GET'])
def obter_ambiente(ambiente_id):
    ambiente = ambiente_dao.buscar_por_id(ambiente_id)
    if not ambiente:
        return jsonify({"erro": "Ambiente não encontrado"}), 404

    return jsonify(ambiente.to_dict()), 200


@app.route('/api/ambientes/<int:ambiente_id>/gerar-codigo', methods=['POST'])
def regenerar_codigo_convite(ambiente_id):
    novo_codigo = gerar_codigo_convite()
    ambiente_dao.atualizar_codigo_convite(ambiente_id, novo_codigo)
    return jsonify({"mensagem": "Código atualizado", "novo_codigo": novo_codigo}), 200


@app.route('/api/ambientes/<int:ambiente_id>/membros', methods=['GET'])
def listar_membros_ambiente(ambiente_id):
    membros = ambiente_dao.listar_membros(ambiente_id)
    return jsonify(membros), 200


# ==========================================
# 2. ROTAS DE TAREFAS
# ==========================================

@app.route('/api/tarefas/ambiente/<int:ambiente_id>', methods=['GET'])
def listar_tarefas_ambiente(ambiente_id):
    tarefas = tarefa_dao.listar_por_ambiente(ambiente_id)
    return jsonify([t.to_dict() if hasattr(t, 'to_dict') else t for t in tarefas]), 200


@app.route('/api/tarefas', methods=['POST'])
def criar_tarefa():
    dados = request.get_json() or {}
    if not dados.get('titulo') or not dados.get('ambiente_id'):
        return jsonify({"erro": "titulo e ambiente_id são obrigatórios"}), 400

    tarefa = Tarefa(
        titulo=dados.get('titulo'),
        descricao=dados.get('descricao'),
        data_limite=dados.get('data_limite'),
        status=dados.get('status', 'A_FAZER'),
        ambiente_id=dados.get('ambiente_id'),
        responsavel_id=dados.get('responsavel_id'),
        indicado_id=dados.get('indicado_id')
    )
    return jsonify({"mensagem": "Tarefa criada", "tarefa_id": tarefa_dao.inserir(tarefa)}), 201


@app.route('/api/tarefas/<int:tarefa_id>/assumir', methods=['POST'])
def assumir_tarefa(tarefa_id):
    usuario_id = (request.get_json() or {}).get('usuario_id')
    tarefa_dao.assumir(tarefa_id, usuario_id)
    return jsonify({"mensagem": "Tarefa assumida"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/indicar', methods=['POST'])
def indicar_colega(tarefa_id):
    indicado_id = (request.get_json() or {}).get('indicado_id')
    tarefa_dao.indicar(tarefa_id, indicado_id)
    return jsonify({"mensagem": "Indicação realizada"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/aceitar', methods=['POST'])
def aceitar_indicacao(tarefa_id):
    usuario_id = (request.get_json() or {}).get('usuario_id')
    tarefa_dao.aceitar_indicacao(tarefa_id, usuario_id)
    return jsonify({"mensagem": "Indicação aceita"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/recusar', methods=['POST'])
def recusar_indicacao(tarefa_id):
    usuario_id = (request.get_json() or {}).get('usuario_id')
    tarefa_dao.recusar_indicacao(tarefa_id, usuario_id)
    return jsonify({"mensagem": "Indicação recusada"}), 200


@app.route('/api/tarefas/<int:tarefa_id>/status', methods=['PUT'])
def atualizar_status_tarefa(tarefa_id):
    status = (request.get_json() or {}).get('status')
    if status not in ['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDA']:
        return jsonify({"erro": "Status inválido"}), 400

    tarefa_dao.atualizar_status(tarefa_id, status)
    return jsonify({"mensagem": "Status atualizado"}), 200


@app.route('/api/tarefas/<int:tarefa_id>', methods=['DELETE'])
def excluir_tarefa(tarefa_id):
    link_tarefa_dao.remover_por_tarefa(tarefa_id)
    tarefa_dao.excluir(tarefa_id)
    return jsonify({"mensagem": "Tarefa excluída com sucesso"}), 200


# ==========================================
# 3. ROTAS DA SEÇÃO "MEUS AVISOS"
# ==========================================

@app.route('/api/avisos/<int:usuario_id>', methods=['GET'])
def obter_meus_avisos(usuario_id):
    hoje = datetime.date.today().isoformat()

    indicacoes = tarefa_dao.listar_indicacoes_pendentes(usuario_id)
    a_vencer = tarefa_dao.listar_a_vencer(usuario_id, hoje)
    atrasadas = tarefa_dao.listar_atrasadas(usuario_id, hoje)

    return jsonify({
        "indicacoes_pendentes": [t.to_dict() if hasattr(t, 'to_dict') else t for t in indicacoes],
        "tarefas_a_vencer": [t.to_dict() if hasattr(t, 'to_dict') else t for t in a_vencer],
        "tarefas_atrasadas": [t.to_dict() if hasattr(t, 'to_dict') else t for t in atrasadas]
    }), 200


# ==========================================
# 4. ROTAS DE LINKS E PARTICIPANTES
# ==========================================

@app.route('/api/tarefas/<int:tarefa_id>/links', methods=['GET'])
def listar_links_tarefa(tarefa_id):
    links = link_tarefa_dao.listar_por_tarefa(tarefa_id)
    return jsonify([l.to_dict() if hasattr(l, 'to_dict') else l for l in links]), 200


@app.route('/api/tarefas/<int:tarefa_id>/links', methods=['POST'])
def adicionar_link(tarefa_id):
    dados = request.get_json() or {}
    if not dados.get('titulo') or not dados.get('url'):
        return jsonify({"erro": "titulo e url são obrigatórios"}), 400

    link_id = link_tarefa_dao.inserir(LinkTarefa(titulo=dados['titulo'], url=dados['url'], tarefa_id=tarefa_id))
    return jsonify({"mensagem": "Link adicionado", "link_id": link_id}), 201


@app.route('/api/tarefas/links/<int:link_id>', methods=['DELETE'])
def remover_link(link_id):
    link_tarefa_dao.remover(link_id)
    return jsonify({"mensagem": "Link removido"}), 200


@app.route('/api/ambientes/<int:ambiente_id>/participantes/<int:usuario_id>', methods=['DELETE'])
def remover_participante(ambiente_id, usuario_id):
    participacao_dao.remover(ambiente_id, usuario_id)
    return jsonify({"mensagem": "Participante removido"}), 200


@app.route('/')
def home():
    return render_template('index.html')


# ==========================================
# 5. ROTAS DE USUÁRIOS (CADASTRO E LOGIN)
# ==========================================

@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    usuarios = usuario_dao.listar_todos()
    return jsonify([u.to_dict() if hasattr(u, 'to_dict') else u for u in usuarios]), 200


@app.route('/api/usuarios', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json() or {}
    nome = dados.get('nome')
    email = dados.get('email')
    foto_perfil = dados.get('foto_perfil', 'default.png')

    if not nome or not email:
        return jsonify({"erro": "Nome e e-mail são obrigatórios"}), 400

    existente = usuario_dao.buscar_por_email(email)
    if existente:
        return jsonify({
            "mensagem": "Usuário já cadastrado",
            "usuario": existente.to_dict() if hasattr(existente, 'to_dict') else existente
        }), 200

    novo_usuario = Usuario(nome=nome, email=email, foto_perfil=foto_perfil)
    novo_id = usuario_dao.inserir(novo_usuario)
    novo_usuario.id = novo_id

    return jsonify({
        "mensagem": "Usuário criado com sucesso",
        "usuario": novo_usuario.to_dict() if hasattr(novo_usuario, 'to_dict') else {
            "id": novo_id,
            "nome": nome,
            "email": email,
            "foto_perfil": foto_perfil
        }
    }), 201


@app.route('/api/usuarios/<int:usuario_id>/foto', methods=['PUT'])
def atualizar_foto_usuario(usuario_id):
    dados = request.get_json() or {}
    foto = dados.get('foto_perfil')
    if not foto:
        return jsonify({"erro": "Imagem inválida"}), 400

    usuario_dao.atualizar_foto(usuario_id, foto)
    return jsonify({"mensagem": "Foto atualizada no banco"}), 200


if __name__ == '__main__':
    app.run(debug=True)