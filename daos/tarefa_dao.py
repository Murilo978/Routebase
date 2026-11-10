from models.tarefa import Tarefa
from database import obter_conexao

class TarefaDAO:
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
        return Tarefa(id=row["id"], titulo=row["titulo"], descricao=row["descricao"], data_limite=row["data_limite"], status=row["status"], ambiente_id=row["ambiente_id"], responsavel_id=row["responsavel_id"], indicado_id=row["indicado_id"]) if row else None
