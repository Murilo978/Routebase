class Usuario:
    def __init__(self, nome: str, email: str, id: int = None, foto_perfil: str = "default.png"):
        self.id = id
        self.nome = nome
        self.email = email
        self.foto_perfil = foto_perfil

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nome": self.nome,
            "email": self.email,
            "foto_perfil": self.foto_perfil
        }
