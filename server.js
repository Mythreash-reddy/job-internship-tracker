const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ===============================
// GET - Get all applications
// ===============================
app.get("/api/applications", (req, res) => {
    const applications = db
        .prepare("SELECT * FROM applications ORDER BY id DESC")
        .all();

    res.json(applications);
});

// ===============================
// POST - Add an application
// ===============================
app.post("/api/applications", (req, res) => {
    const { company, role, status, deadline } = req.body;

    if (!company || !role || !status) {
        return res.status(400).json({
            message: "Company, role and status are required."
        });
    }

    const result = db
        .prepare(`
            INSERT INTO applications
            (company, role, status, deadline)
            VALUES (?, ?, ?, ?)
        `)
        .run(company, role, status, deadline || null);

    const application = db
        .prepare("SELECT * FROM applications WHERE id = ?")
        .get(result.lastInsertRowid);

    res.status(201).json(application);
});

// ===============================
// PUT - Edit an application
// ===============================
app.put("/api/applications/:id", (req, res) => {
    const { id } = req.params;
    const { company, role, status, deadline } = req.body;

    if (!company || !role || !status) {
        return res.status(400).json({
            message: "Company, role and status are required."
        });
    }

    const result = db
        .prepare(`
            UPDATE applications
            SET company = ?,
                role = ?,
                status = ?,
                deadline = ?
            WHERE id = ?
        `)
        .run(
            company,
            role,
            status,
            deadline || null,
            id
        );

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Application not found."
        });
    }

    const application = db
        .prepare("SELECT * FROM applications WHERE id = ?")
        .get(id);

    res.json(application);
});

// ===============================
// DELETE - Delete an application
// ===============================
app.delete("/api/applications/:id", (req, res) => {
    const { id } = req.params;

    const result = db
        .prepare("DELETE FROM applications WHERE id = ?")
        .run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            message: "Application not found."
        });
    }

    res.json({
        message: "Application deleted successfully."
    });
});

// ===============================
// Start server
// ===============================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});