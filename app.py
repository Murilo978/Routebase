from flask import Flask, request, jsonify
from models.usuario import Usuario
from daos.usuario_dao import UsuarioDAO
from database import inicializar_banco

app = Flask(__name__)

# Garante que o banco e todas as tabelas do script SQL sejam criados ao iniciar a aplicação
inicializar_banco()

usuario_dao = UsuarioDAO()

@app.route('/api/usuarios', methods=['POST'])
def cadastrar_ou_recuperar_usuario():
    """
    Identificação Simplificada de Usuário por Nome e E-mail.
    Se o e-mail já estiver cadastrado, recupera os dados. Caso contrário, cadastra.
    """
    dados = request.get_json()
    if not dados or 'nome' not in dados or 'email' not in dados:
        return jsonify({"erro": "Nome e e-mail são obrigatórios"}), 400

    nome = dados['nome']
    email = dados['email']
    foto_perfil = dados.get('foto_perfil', 'default.png')

    usuario_existente = usuario_dao.buscar_por_email(email)
    if usuario_existente:
        return jsonify({
            "mensagem": "Usuário já cadastrado. Dados recuperados com sucesso.",
            "usuario": usuario_existente.to_dict()
        }), 200

    novo_usuario = Usuario(nome=nome, email=email, foto_perfil=foto_perfil)
    usuario_id = usuario_dao.inserir(novo_usuario)
    novo_usuario.id = usuario_id

    return jsonify({
        "mensagem": "Usuário cadastrado com sucesso.",
        "usuario": novo_usuario.to_dict()
    }), 201

@app.route('/api/usuarios', methods=['GET'])
def listar_usuarios():
    """Lista todos os usuários cadastrados."""
    usuarios = usuario_dao.listar_todos()
    return jsonify([u.to_dict() for u in usuarios]), 200

@app.route('/api/usuarios/<int:usuario_id>', methods=['GET'])
def buscar_usuario(usuario_id):
    """Busca um usuário específico pelo ID."""
    usuario = usuario_dao.buscar_por_id(usuario_id)
    if not usuario:
        return jsonify({"erro": "Usuário não encontrado"}), 404
    return jsonify(usuario.to_dict()), 200

if __name__ == '__main__':
    app.run(debug=True)
