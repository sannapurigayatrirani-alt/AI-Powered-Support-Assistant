const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./chat.db');

// Promisify database methods for async/await usage
const runQuery = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
        if (err) reject(err); else resolve(this);
    });
});

const getQuery = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err); else resolve(rows);
    });
});

// Initialize Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        last_updated DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT,
        content TEXT,
        created_at DATETIME,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
    )`);
});

module.exports = { runQuery, getQuery };
