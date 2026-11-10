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
        return AmbienteTrabalho(id=row["id"], nome=row["nome"], descricao=row["descricao"], data_entrega=row["data_entrega"], codigo_convite=row["codigo_convite"]) if row else None

    def buscar_por_id(self, ambiente_id: int) -> AmbienteTrabalho:
        conn = obter_conexao()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM AmbienteTrabalho WHERE id = ?", (ambiente_id,))
        row = cursor.fetchone()
        conn.close()
        return AmbienteTrabalho(id=row["id"], nome=row["nome"], descricao=row["descricao"], data_entrega=row["data_entrega"], codigo_convite=row["codigo_convite"]) if row else None
