const Database = require("better-sqlite3");
const db = new Database('filmlog.db');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year INTEGER NOT NULL,
        director TEXT NOT NULL,
        rating REAL NOT NULL,
        duration TEXT,
        synopsis TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        cast_members TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id INTEGER NOT NULL,
        genre_id INTEGER NOT NULL,
        PRIMARY KEY (movie_id, genre_id),
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watchlists (
        user_id INTEGER NOT NULL,
        movie_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, movie_id),
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (movie_id) REFERENCES movies (id) ON DELETE CASCADE
    );
`);

module.exports = db;