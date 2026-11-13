import sqlite3
import os

DB_PATH = "database.db"

def obter_conexao():
    """Retorna uma conexão com o banco de dados configurada com Row Factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def inicializar_banco():
    """Cria todas as tabelas do sistema se elas ainda não existirem."""
    conn = obter_conexao()
    cursor = conn.cursor()

    script_sql = """
    CREATE TABLE IF NOT EXISTS Usuario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        foto_perfil TEXT DEFAULT 'default.png'
    );

    CREATE TABLE IF NOT EXISTS AmbienteTrabalho (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        data_entrega DATE NOT NULL,
        codigo_convite TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Participacao (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        papel TEXT NOT NULL,
        usuario_id INTEGER NOT NULL,
        ambiente_id INTEGER NOT NULL,
        FOREIGN KEY (usuario_id) REFERENCES Usuario(id) ON DELETE CASCADE,
        FOREIGN KEY (ambiente_id) REFERENCES AmbienteTrabalho(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Tarefa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descricao TEXT,
        data_limite DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'A_FAZER',
        ambiente_id INTEGER NOT NULL,
        responsavel_id INTEGER,
        indicado_id INTEGER,
        FOREIGN KEY (ambiente_id) REFERENCES AmbienteTrabalho(id) ON DELETE CASCADE,
        FOREIGN KEY (responsavel_id) REFERENCES Usuario(id) ON DELETE SET NULL,
        FOREIGN KEY (indicado_id) REFERENCES Usuario(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS LinkTarefa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        url TEXT NOT NULL,
        tarefa_id INTEGER NOT NULL,
        FOREIGN KEY (tarefa_id) REFERENCES Tarefa(id) ON DELETE CASCADE
    );
    """

    cursor.executescript(script_sql)
    conn.commit()
    conn.close()
    print("Banco de dados inicializado com sucesso!")

if __name__ == "__main__":
    inicializar_banco()
