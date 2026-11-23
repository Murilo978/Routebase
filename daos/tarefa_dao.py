from models.tarefa import Tarefa
from database import obter_conexao


class TarefaDAO:
    def _row_to_tarefa(self, row) -> Tarefa:
        return Tarefa(
            id=row["id"],
            titulo=row["titulo"],
            descricao=row["descricao"],
            data_limite=row["data_limite"],
            status=row["status"],
            ambiente_id=row["ambiente_id"],
            responsavel_id=row["responsavel_id"],
            indicado_id=row["indicado_id"]
        )

    def inserir(self, tarefa: Tarefa) -> int:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Tarefa (titulo, descricao, data_limite, status, ambiente_id, responsavel_id, indicado_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (tarefa.titulo, tarefa.descricao, tarefa.data_limite, tarefa.status, tarefa.ambiente_id, tarefa.responsavel_id, tarefa.indicado_id)
        )
        conn.commit()
        t_id = cursor.lastrowid
        conn.close()
        return t_id

    def buscar_por_id(self, tarefa_id: int) -> Tarefa:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Tarefa WHERE id = ?", (tarefa_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_tarefa(row) if row else None

    def listar_por_ambiente(self, ambiente_id: int) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Tarefa WHERE ambiente_id = ?", (ambiente_id,))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_tarefa(r) for r in rows]

    def assumir(self, tarefa_id: int, usuario_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Tarefa SET responsavel_id = ?, status = 'EM_ANDAMENTO' WHERE id = ?",
            (usuario_id, tarefa_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def indicar(self, tarefa_id: int, indicado_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Tarefa SET indicado_id = ? WHERE id = ?",
            (indicado_id, tarefa_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def aceitar_indicacao(self, tarefa_id: int, usuario_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Tarefa SET responsavel_id = ?, indicado_id = NULL, status = 'EM_ANDAMENTO' WHERE id = ? AND indicado_id = ?",
            (usuario_id, tarefa_id, usuario_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def recusar_indicacao(self, tarefa_id: int, usuario_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Tarefa SET indicado_id = NULL WHERE id = ? AND indicado_id = ?",
            (tarefa_id, usuario_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def atualizar_status(self, tarefa_id: int, status: str) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Tarefa SET status = ? WHERE id = ?",
            (status, tarefa_id)
        )
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def listar_indicacoes_pendentes(self, usuario_id: int) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Tarefa WHERE indicado_id = ?", (usuario_id,))
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_tarefa(r) for r in rows]

    def listar_a_vencer(self, usuario_id: int, hoje: str) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Tarefa WHERE responsavel_id = ? AND data_limite = ? AND status != 'CONCLUIDA'",
            (usuario_id, hoje)
        )
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_tarefa(r) for r in rows]

    def listar_atrasadas(self, usuario_id: int, hoje: str) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM Tarefa WHERE responsavel_id = ? AND data_limite < ? AND status != 'CONCLUIDA'",
            (usuario_id, hoje)
        )
        rows = cursor.fetchall()
        conn.close()
        return [self._row_to_tarefa(r) for r in rows]

    def excluir(self, tarefa_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Tarefa WHERE id = ?", (tarefa_id,))
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0
