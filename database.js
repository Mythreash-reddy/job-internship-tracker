const Database = require("better-sqlite3");

const db = new Database("jobs.db");

db.prepare(`
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL,
        deadline TEXT,
        notes TEXT,
        priority TEXT DEFAULT 'Medium',
        job_url TEXT,
        follow_up_date TEXT
    )
`).run();

module.exports = db;