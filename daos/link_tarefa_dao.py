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
