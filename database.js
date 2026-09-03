require("dotenv").config();

const { Pool } = require("pg");

// ==========================================
// STARTUP CHECK
// ==========================================

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing.");
}

// ==========================================
// POSTGRESQL CONNECTION POOL
// ==========================================

const db = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Render's managed Postgres uses a self-signed cert chain,
    // so we disable strict verification rather than skip SSL entirely.
    ssl: {
        rejectUnauthorized: false
    },

    max: 10,                      // max simultaneous connections
    idleTimeoutMillis: 30000,     // close idle clients after 30s
    connectionTimeoutMillis: 5000 // fail fast if a connection can't be made
});

// Catches errors on idle clients in the pool (e.g. the DB restarting)
// so a background issue doesn't crash the whole process.
db.on("error", (error) => {
    console.error("Unexpected PostgreSQL error:", error);
});

// ==========================================
// INITIALIZE DATABASE
// ==========================================

async function initializeDatabase() {

    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS applications (
            id SERIAL PRIMARY KEY,
            company TEXT NOT NULL,
            role TEXT NOT NULL,
            status TEXT NOT NULL,
            deadline DATE,
            notes TEXT,
            priority TEXT NOT NULL DEFAULT 'Medium',
            job_url TEXT,
            follow_up_date DATE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

            CONSTRAINT priority_check CHECK (priority IN ('Low', 'Medium', 'High'))
        )
    `);

    // Speeds up "get all applications for this user" — the app's
    // most frequent query — instead of a full table scan.
    await db.query(`
        CREATE INDEX IF NOT EXISTS idx_applications_user_id
        ON applications(user_id)
    `);

    console.log("PostgreSQL tables ready.");
}

// ==========================================
// CLOSE DATABASE
// ==========================================

async function closeDatabase() {
    await db.end();
    console.log("PostgreSQL connection pool closed.");
}

// ==========================================
// EXPORTS
// ==========================================

// Export the pool itself as `db`.
// This matches server.js:
// const db = require("./database");

module.exports = db;

// Attach helper functions to the pool object.
module.exports.initializeDatabase = initializeDatabase;
module.exports.closeDatabase = closeDatabase;