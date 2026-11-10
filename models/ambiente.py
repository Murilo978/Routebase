class AmbienteTrabalho:
    def __init__(self, nome: str, data_entrega: str, codigo_convite: str, descricao: str = None, id: int = None):
        self.id = id
        self.nome = nome
        self.descricao = descricao
        self.data_entrega = data_entrega
        self.codigo_convite = codigo_convite

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "descricao": self.descricao,
            "data_entrega": self.data_entrega,
            "codigo_convite": self.codigo_convite
        }
