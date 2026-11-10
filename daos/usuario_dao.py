from models.usuario import Usuario
from database import obter_conexao

class UsuarioDAO:
    def inserir(self, usuario: Usuario) -> int:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Usuario (nome, email, foto_perfil) VALUES (?, ?, ?)",
            (usuario.nome, usuario.email, usuario.foto_perfil)
        )
        conn.commit()
        usuario_id = cursor.lastrowid
        conn.close()
        return usuario_id

    def buscar_por_id(self, usuario_id: int) -> Usuario:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Usuario WHERE id = ?", (usuario_id,))
        row = cursor.fetchone()
        conn.close()
        return Usuario(id=row["id"], nome=row["nome"], email=row["email"], foto_perfil=row["foto_perfil"]) if row else None

    def buscar_por_email(self, email: str) -> Usuario:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Usuario WHERE email = ?", (email,))
        row = cursor.fetchone()
        conn.close()
        return Usuario(id=row["id"], nome=row["nome"], email=row["email"], foto_perfil=row["foto_perfil"]) if row else None

    def listar_todos(self) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Usuario")
        rows = cursor.fetchall()
        conn.close()
        return [Usuario(id=row["id"], nome=row["nome"], email=row["email"], foto_perfil=row["foto_perfil"]) for row in rows]

    def atualizar(self, usuario: Usuario) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("UPDATE Usuario SET nome = ?, email = ?, foto_perfil = ? WHERE id = ?", (usuario.nome, usuario.email, usuario.foto_perfil, usuario.id))
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def excluir(self, usuario_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Usuario WHERE id = ?", (usuario_id,))
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0
