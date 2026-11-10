class Tarefa:
    def __init__(self, titulo: str, data_limite: str, ambiente_id: int, descricao: str = None, status: str = 'A_FAZER', responsavel_id: int = None, indicado_id: int = None, id: int = None):
        self.id = id
        self.titulo = titulo
        self.descricao = descricao
        self.data_limite = data_limite
        self.status = status
        self.ambiente_id = ambiente_id
        self.responsavel_id = responsavel_id
        self.indicado_id = indicado_id

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "titulo": self.titulo,
            "descricao": self.descricao,
            "data_limite": self.data_limite,
            "status": self.status,
            "ambiente_id": self.ambiente_id,
            "responsavel_id": self.responsavel_id,
            "indicado_id": self.indicado_id
        }
