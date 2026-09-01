const Database = require("better-sqlite3");

const db = new Database("jobs.db");

// ==========================================
// USERS TABLE
// ==========================================

db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )
`).run();


// ==========================================
// APPLICATIONS TABLE
// ==========================================

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
        follow_up_date TEXT,
        user_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`).run();


// ==========================================
// CHECK EXISTING COLUMNS
// ==========================================

const columns = db
    .prepare("PRAGMA table_info(applications)")
    .all();


// ==========================================
// ADD priority IF MISSING
// ==========================================

const hasPriority = columns.some(
    column => column.name === "priority"
);

if (!hasPriority) {

    db.prepare(`
        ALTER TABLE applications
        ADD COLUMN priority TEXT DEFAULT 'Medium'
    `).run();

}


// ==========================================
// ADD job_url IF MISSING
// ==========================================

const hasJobUrl = columns.some(
    column => column.name === "job_url"
);

if (!hasJobUrl) {

    db.prepare(`
        ALTER TABLE applications
        ADD COLUMN job_url TEXT
    `).run();

}


// ==========================================
// ADD follow_up_date IF MISSING
// ==========================================

const hasFollowUpDate = columns.some(
    column => column.name === "follow_up_date"
);

if (!hasFollowUpDate) {

    db.prepare(`
        ALTER TABLE applications
        ADD COLUMN follow_up_date TEXT
    `).run();

}


// ==========================================
// ADD user_id IF MISSING
// ==========================================

const hasUserId = columns.some(
    column => column.name === "user_id"
);

if (!hasUserId) {

    db.prepare(`
        ALTER TABLE applications
        ADD COLUMN user_id INTEGER
    `).run();

}


// ==========================================
// EXPORT DATABASE
// ==========================================

module.exports = db;