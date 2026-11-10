class Participacao:
    def __init__(self, papel: str, usuario_id: int, ambiente_id: int, id: int = None):
        self.id = id
        self.papel = papel  # 'criador' ou 'participante'
        self.usuario_id = usuario_id
        self.ambiente_id = ambiente_id

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "papel": self.papel,
            "usuario_id": self.usuario_id,
            "ambiente_id": self.ambiente_id
        }
