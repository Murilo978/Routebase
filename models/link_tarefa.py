class LinkTarefa:
    def __init__(self, titulo: str, url: str, tarefa_id: int, id: int = None):
        self.id = id
        self.titulo = titulo
        self.url = url
        self.tarefa_id = tarefa_id

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "titulo": self.titulo,
            "url": self.url,
            "tarefa_id": self.tarefa_id
        }
