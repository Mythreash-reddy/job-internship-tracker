const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/applications", (req, res) => {
    const applications = db
        .prepare("SELECT * FROM applications ORDER BY id DESC")
        .all();

    res.json(applications);
});

app.post("/api/applications", (req, res) => {
    const { company, role, status, deadline } = req.body;

    const result = db.prepare(`
        INSERT INTO applications (company, role, status, deadline)
        VALUES (?, ?, ?, ?)
    `).run(company, role, status, deadline || null);

    const application = db
        .prepare("SELECT * FROM applications WHERE id = ?")
        .get(result.lastInsertRowid);

    res.status(201).json(application);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});