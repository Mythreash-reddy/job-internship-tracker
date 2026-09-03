// ==========================================
// JOB APPLICATION TRACKER - SERVER
// ==========================================
// Features:
// 1. Register / Login / Logout
// 2. Add, view, edit, and delete applications
// 3. Each user only sees their own applications
// 4. PostgreSQL database
// 5. PostgreSQL-backed sessions
// 6. Deployment-ready for Render
// 7. Basic security hardening (helmet, rate limiting)
// 8. Centralized validation + error handling

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// database.js exports the pool itself as module.exports, with
// initializeDatabase/closeDatabase attached as properties on it —
// so `db` IS the pool, not a { pool } wrapper object.
const db = require("./database");
const { initializeDatabase, closeDatabase } = db;

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ==========================================
// STARTUP CHECKS
// ==========================================
// Fail fast and loudly if required config is missing,
// instead of limping along with insecure defaults.

const REQUIRED_ENV_VARS = ["SESSION_SECRET", "DATABASE_URL"];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
    process.exit(1);
}

// ==========================================
// MIDDLEWARE
// ==========================================

// Render sits behind a proxy — trust it in production so
// secure cookies and rate limiting see the real client IP.
if (IS_PRODUCTION) {
    app.set("trust proxy", 1);
}

// Sets a batch of sensible security-related HTTP headers
app.use(helmet());

// Read JSON request bodies (cap size to avoid abuse)
app.use(express.json({ limit: "50kb" }));

// Serve frontend files from the public folder
app.use(express.static("public"));

// ==========================================
// SESSION
// ==========================================

app.use(session({
    store: new pgSession({
        pool: db,
        tableName: "session",
        createTableIfMissing: true
    }),

    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: IS_PRODUCTION, // HTTPS only in production
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// ==========================================
// RATE LIMITING
// ==========================================
// Slows down brute-force login/register attempts without
// affecting normal usage.

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // 20 attempts per IP per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again later." }
});

// ==========================================
// HELPERS
// ==========================================

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Please login first." });
    }
    next();
}

// Wraps async route handlers so thrown errors reach the
// central error handler instead of crashing the process.
function asyncHandler(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
}

// Shared validation for the application create/edit forms.
function validateApplicationInput(body) {
    const { company, role, status } = body;

    if (!company || !company.trim() || !role || !role.trim() || !status) {
        return "Company, role and status are required.";
    }

    if (company.length > 200 || role.length > 200) {
        return "Company and role must be under 200 characters.";
    }

    return null;
}

function cleanApplicationInput(body) {
    const {
        company,
        role,
        status,
        deadline,
        notes,
        priority,
        job_url,
        follow_up_date
    } = body;

    return {
        company: company.trim(),
        role: role.trim(),
        status,
        deadline: deadline || null,
        notes: notes || null,
        priority: priority || "Medium",
        job_url: job_url || null,
        follow_up_date: follow_up_date || null
    };
}

// ==========================================
// REGISTER
// ==========================================

app.post("/api/register", authLimiter, asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !name.trim() || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters."
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [cleanEmail]
    );

    if (existingUser.rows.length > 0) {
        return res.status(409).json({
            message: "An account with this email already exists."
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
        `
        INSERT INTO users (name, email, password)
        VALUES ($1, $2, $3)
        RETURNING id, name, email
        `,
        [cleanName, cleanEmail, hashedPassword]
    );

    const user = result.rows[0];

    req.session.userId = user.id;
    req.session.userName = user.name;

    res.status(201).json({
        message: "Account created successfully.",
        user
    });
}));

// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", authLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required."
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [cleanEmail]
    );

    // Same message whether the email doesn't exist or the
    // password is wrong, so attackers can't enumerate accounts.
    const genericError = { message: "Invalid email or password." };

    if (result.rows.length === 0) {
        return res.status(401).json(genericError);
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json(genericError);
    }

    req.session.userId = user.id;
    req.session.userName = user.name;

    res.json({
        message: "Login successful.",
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
}));

// ==========================================
// LOGOUT
// ==========================================

app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout error:", error);
            return res.status(500).json({ message: "Failed to logout." });
        }

        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully." });
    });
});

// ==========================================
// CURRENT USER
// ==========================================

app.get("/api/me", asyncHandler(async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in." });
    }

    const result = await db.query(
        "SELECT id, name, email FROM users WHERE id = $1",
        [req.session.userId]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ message: "User not found." });
    }

    res.json(result.rows[0]);
}));

// ==========================================
// GET ALL APPLICATIONS
// ==========================================

app.get("/api/applications", requireLogin, asyncHandler(async (req, res) => {
    const result = await db.query(
        "SELECT * FROM applications WHERE user_id = $1 ORDER BY id DESC",
        [req.session.userId]
    );

    res.json(result.rows);
}));

// ==========================================
// ADD APPLICATION
// ==========================================

app.post("/api/applications", requireLogin, asyncHandler(async (req, res) => {
    const validationError = validateApplicationInput(req.body);

    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const appData = cleanApplicationInput(req.body);

    const result = await db.query(
        `
        INSERT INTO applications
        (company, role, status, deadline, notes, priority, job_url, follow_up_date, user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        `,
        [
            appData.company,
            appData.role,
            appData.status,
            appData.deadline,
            appData.notes,
            appData.priority,
            appData.job_url,
            appData.follow_up_date,
            req.session.userId
        ]
    );

    res.status(201).json(result.rows[0]);
}));

// ==========================================
// EDIT APPLICATION
// ==========================================

app.put("/api/applications/:id", requireLogin, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const validationError = validateApplicationInput(req.body);

    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const appData = cleanApplicationInput(req.body);

    const result = await db.query(
        `
        UPDATE applications
        SET
            company = $1,
            role = $2,
            status = $3,
            deadline = $4,
            notes = $5,
            priority = $6,
            job_url = $7,
            follow_up_date = $8
        WHERE id = $9
          AND user_id = $10
        RETURNING *
        `,
        [
            appData.company,
            appData.role,
            appData.status,
            appData.deadline,
            appData.notes,
            appData.priority,
            appData.job_url,
            appData.follow_up_date,
            id,
            req.session.userId
        ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Application not found." });
    }

    res.json(result.rows[0]);
}));

// ==========================================
// DELETE APPLICATION
// ==========================================

app.delete("/api/applications/:id", requireLogin, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await db.query(
        "DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, req.session.userId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ message: "Application not found." });
    }

    res.json({ message: "Application deleted successfully." });
}));

// ==========================================
// 404 HANDLER (for unmatched API routes)
// ==========================================

app.use("/api", (req, res) => {
    res.status(404).json({ message: "Route not found." });
});

// ==========================================
// CENTRAL ERROR HANDLER
// ==========================================
// Any error passed via next(error), or thrown inside an
// asyncHandler-wrapped route, ends up here.

app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);

    // Postgres unique constraint violation (e.g. duplicate email)
    if (error.code === "23505") {
        return res.status(409).json({
            message: "That record already exists."
        });
    }

    res.status(500).json({ message: "Something went wrong." });
});

// ==========================================
// START SERVER
// ==========================================

let server;

async function startServer() {
    try {
        // Creates tables/indexes if they don't exist yet, and
        // doubles as the initial connection check.
        await initializeDatabase();

        server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Could not start server:", error);
        process.exit(1);
    }
}

// Give in-flight requests a chance to finish before shutting down,
// which matters on platforms like Render that send SIGTERM on deploy.
async function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully.`);

    if (!server) {
        return process.exit(0);
    }

    server.close(async () => {
        console.log("HTTP server closed.");

        try {
            await closeDatabase();
        } catch (error) {
            console.error("Error closing database pool:", error);
        }

        process.exit(0);
    });

    // Force exit if it hasn't closed within 10 seconds
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();