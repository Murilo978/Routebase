from models.participacao import Participacao
from database import obter_conexao


class ParticipacaoDAO:
    def inserir(self, participacao: Participacao) -> int:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Participacao (papel, usuario_id, ambiente_id) VALUES (?, ?, ?)",
            (participacao.papel, participacao.usuario_id, participacao.ambiente_id)
        )
        conn.commit()
        p_id = cursor.lastrowid
        conn.close()
        return p_id

    def buscar_por_usuario_e_ambiente(self, usuario_id: int, ambiente_id: int) -> Participacao:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Participacao WHERE usuario_id = ? AND ambiente_id = ?",
            (usuario_id, ambiente_id)
        )
        row = cursor.fetchone()
        conn.close()
        return Participacao(
            id=row["id"],
            papel=row["papel"],
            usuario_id=row["usuario_id"],
            ambiente_id=row["ambiente_id"]
        ) if row else None

    def remover(self, ambiente_id: int, usuario_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM Participacao WHERE ambiente_id = ? AND usuario_id = ?",
            (ambiente_id, usuario_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0
