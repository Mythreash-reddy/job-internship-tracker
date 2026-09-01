// ==========================================
// JOB APPLICATION TRACKER - SERVER
// ==========================================
// This file sets up a simple web server that lets users:
// 1. Register / Login / Logout
// 2. Add, view, edit, and delete job applications
// Each user only sees their own applications.

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./database");

const app = express();
const PORT = 3000;

// ==========================================
// MIDDLEWARE (runs before every request)
// ==========================================

// Allow the frontend (running on the same address) to talk to this server
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// Let us read JSON data sent in requests (like req.body)
app.use(express.json());

// Serve any files inside the "public" folder (HTML, CSS, images, etc.)
app.use(express.static("public"));

// Keep track of who is logged in using a session cookie
app.use(session({
    secret: "job-tracker-secret-change-this-later",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 // cookie lasts 1 day
    }
}));

// ==========================================
// HELPER: check if the user is logged in
// ==========================================
// We use this before any route that should only work for logged-in users.

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Please login first." });
    }
    next(); // user is logged in, continue to the actual route
}

// ==========================================
// REGISTER - create a new account
// ==========================================

app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic checks on the input
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Don't allow two accounts with the same email
        const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(cleanEmail);

        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        // Never store plain text passwords - hash it first
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the new user in the database
        const result = db.prepare(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)"
        ).run(cleanName, cleanEmail, hashedPassword);

        // Log the user in right away by saving their id in the session
        req.session.userId = result.lastInsertRowid;
        req.session.userName = cleanName;

        res.status(201).json({
            message: "Account created successfully.",
            user: {
                id: result.lastInsertRowid,
                name: cleanName,
                email: cleanEmail
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to create account." });
    }
});

// ==========================================
// LOGIN - check email/password and start a session
// ==========================================

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const cleanEmail = email.trim().toLowerCase();

        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(cleanEmail);

        // Same error message for "no user" and "wrong password"
        // so people can't guess which emails are registered
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
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

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to login." });
    }
});

// ==========================================
// LOGOUT - end the session
// ==========================================

app.post("/api/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to logout." });
        }
        res.json({ message: "Logged out successfully." });
    });
});

// ==========================================
// CURRENT USER - who is logged in right now?
// ==========================================

app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in." });
    }

    const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.session.userId);

    if (!user) {
        return res.status(401).json({ message: "User not found." });
    }

    res.json(user);
});

// ==========================================
// GET ALL APPLICATIONS (for the logged-in user)
// ==========================================

app.get("/api/applications", requireLogin, (req, res) => {
    try {
        const applications = db.prepare(
            "SELECT * FROM applications WHERE user_id = ? ORDER BY id DESC"
        ).all(req.session.userId);

        res.json(applications);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to get applications." });
    }
});

// ==========================================
// ADD A NEW APPLICATION
// ==========================================

app.post("/api/applications", requireLogin, (req, res) => {
    try {
        const {
            company,
            role,
            status,
            deadline,
            notes,
            priority,
            job_url,
            follow_up_date
        } = req.body;

        if (!company || !role || !status) {
            return res.status(400).json({ message: "Company, role and status are required." });
        }

        const result = db.prepare(`
            INSERT INTO applications
            (company, role, status, deadline, notes, priority, job_url, follow_up_date, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            company.trim(),
            role.trim(),
            status,
            deadline || null,
            notes || null,
            priority || "Medium",
            job_url || null,
            follow_up_date || null,
            req.session.userId
        );

        // Fetch the row we just created so we can send it back
        const newApplication = db.prepare(
            "SELECT * FROM applications WHERE id = ? AND user_id = ?"
        ).get(result.lastInsertRowid, req.session.userId);

        res.status(201).json(newApplication);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to add application." });
    }
});

// ==========================================
// EDIT AN EXISTING APPLICATION
// ==========================================

app.put("/api/applications/:id", requireLogin, (req, res) => {
    try {
        const { id } = req.params;

        const {
            company,
            role,
            status,
            deadline,
            notes,
            priority,
            job_url,
            follow_up_date
        } = req.body;

        if (!company || !role || !status) {
            return res.status(400).json({ message: "Company, role and status are required." });
        }

        const result = db.prepare(`
            UPDATE applications
            SET company = ?, role = ?, status = ?, deadline = ?,
                notes = ?, priority = ?, job_url = ?, follow_up_date = ?
            WHERE id = ? AND user_id = ?
        `).run(
            company.trim(),
            role.trim(),
            status,
            deadline || null,
            notes || null,
            priority || "Medium",
            job_url || null,
            follow_up_date || null,
            id,
            req.session.userId
        );

        // If nothing changed, either the id was wrong or it belongs to another user
        if (result.changes === 0) {
            return res.status(404).json({ message: "Application not found." });
        }

        const updatedApplication = db.prepare(
            "SELECT * FROM applications WHERE id = ? AND user_id = ?"
        ).get(id, req.session.userId);

        res.json(updatedApplication);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to update application." });
    }
});

// ==========================================
// DELETE AN APPLICATION
// ==========================================

app.delete("/api/applications/:id", requireLogin, (req, res) => {
    try {
        const { id } = req.params;

        const result = db.prepare(
            "DELETE FROM applications WHERE id = ? AND user_id = ?"
        ).run(id, req.session.userId);

        if (result.changes === 0) {
            return res.status(404).json({ message: "Application not found." });
        }

        res.json({ message: "Application deleted successfully." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to delete application." });
    }
});

// ==========================================
// START THE SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});