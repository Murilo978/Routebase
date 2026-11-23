from models.ambiente import AmbienteTrabalho
from database import obter_conexao


class AmbienteDAO:
    def inserir(self, ambiente: AmbienteTrabalho) -> int:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO AmbienteTrabalho (nome, descricao, data_entrega, codigo_convite) VALUES (?, ?, ?, ?)",
            (ambiente.nome, ambiente.descricao, ambiente.data_entrega, ambiente.codigo_convite)
        )
        conn.commit()
        ambiente_id = cursor.lastrowid
        conn.close()
        return ambiente_id

    def buscar_por_codigo(self, codigo: str) -> AmbienteTrabalho:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM AmbienteTrabalho WHERE codigo_convite = ?", (codigo,))
        row = cursor.fetchone()
        conn.close()
        return AmbienteTrabalho(
            id=row["id"],
            nome=row["nome"],
            descricao=row["descricao"],
            data_entrega=row["data_entrega"],
            codigo_convite=row["codigo_convite"]
        ) if row else None

    def buscar_por_id(self, ambiente_id: int) -> AmbienteTrabalho:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM AmbienteTrabalho WHERE id = ?", (ambiente_id,))
        row = cursor.fetchone()
        conn.close()
        return AmbienteTrabalho(
            id=row["id"],
            nome=row["nome"],
            descricao=row["descricao"],
            data_entrega=row["data_entrega"],
            codigo_convite=row["codigo_convite"]
        ) if row else None

    def listar_por_usuario(self, usuario_id: int) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.* FROM AmbienteTrabalho a
            JOIN Participacao p ON a.id = p.ambiente_id
            WHERE p.usuario_id = ?
        """, (usuario_id,))
        rows = cursor.fetchall()
        conn.close()
        return [
            AmbienteTrabalho(
                id=r["id"],
                nome=r["nome"],
                descricao=r["descricao"],
                data_entrega=r["data_entrega"],
                codigo_convite=r["codigo_convite"]
            ) for r in rows
        ]

    def atualizar_codigo_convite(self, ambiente_id: int, novo_codigo: str) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE AmbienteTrabalho SET codigo_convite = ? WHERE id = ?",
            (novo_codigo, ambiente_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def listar_membros(self, ambiente_id: int) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.nome, u.email, u.foto_perfil, p.papel
            FROM Usuario u
            JOIN Participacao p ON u.id = p.usuario_id
            WHERE p.ambiente_id = ?
        """, (ambiente_id,))
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "id": r["id"],
                "nome": r["nome"],
                "email": r["email"],
                "foto_perfil": r["foto_perfil"],
                "papel": r["papel"]
            } for r in rows
        ]

    def excluir(self, ambiente_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM AmbienteTrabalho WHERE id = ?", (ambiente_id,))
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0
