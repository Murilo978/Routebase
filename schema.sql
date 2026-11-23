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