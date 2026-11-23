from models.link_tarefa import LinkTarefa
from database import obter_conexao


class LinkTarefaDAO:
    def inserir(self, link: LinkTarefa) -> int:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO LinkTarefa (titulo, url, tarefa_id) VALUES (?, ?, ?)",
            (link.titulo, link.url, link.tarefa_id)
        )
        conn.commit()
        l_id = cursor.lastrowid
        conn.close()
        return l_id

    def listar_por_tarefa(self, tarefa_id: int) -> list:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM LinkTarefa WHERE tarefa_id = ?", (tarefa_id,))
        rows = cursor.fetchall()
        conn.close()
        return [
            LinkTarefa(
                id=r["id"],
                titulo=r["titulo"],
                url=r["url"],
                tarefa_id=r["tarefa_id"]
            ) for r in rows
        ]

    def remover(self, link_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM LinkTarefa WHERE id = ?", (link_id,))
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0

    def remover_por_tarefa(self, tarefa_id: int) -> bool:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM LinkTarefa WHERE tarefa_id = ?", (tarefa_id,))
        conn.commit()
        afetadas = cursor.rowcount
        conn.close()
        return afetadas > 0
