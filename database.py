import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")


def obter_conexao():
    """Retorna uma conexão com o banco de dados configurada com Row Factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def inicializar_banco():
    """Lê o arquivo schema.sql e cria todas as tabelas no database.db."""
    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Arquivo schema.sql não encontrado em: {SCHEMA_PATH}")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as arquivo_sql:
        script_sql = arquivo_sql.read()

    conn = obter_conexao()
    cursor = conn.cursor()
    cursor.executescript(script_sql)
    conn.commit()
    conn.close()
    print("Banco de dados inicializado com sucesso a partir de schema.sql!")


if __name__ == "__main__":
    inicializar_banco()