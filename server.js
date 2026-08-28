const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 3000;


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


// ==========================================
// GET - GET ALL APPLICATIONS
// ==========================================

app.get("/api/applications", (req, res) => {

    try {

        const applications = db
            .prepare(`
                SELECT *
                FROM applications
                ORDER BY id DESC
            `)
            .all();

        res.json(applications);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to get applications."
        });

    }

});


// ==========================================
// POST - ADD APPLICATION
// ==========================================

app.post("/api/applications", (req, res) => {

    try {

        const {
            company,
            role,
            status,
            priority,
            deadline,
            notes,
            job_url
        } = req.body;


        if (!company || !role || !status) {

            return res.status(400).json({
                message:
                    "Company, role and status are required."
            });

        }


        const selectedPriority =
            priority || "Medium";


        const result = db
            .prepare(`
                INSERT INTO applications
                (
                    company,
                    role,
                    status,
                    priority,
                    deadline,
                    notes,
                    job_url
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .run(
                company,
                role,
                status,
                selectedPriority,
                deadline || null,
                notes || null,
                job_url || null
            );


        const application = db
            .prepare(`
                SELECT *
                FROM applications
                WHERE id = ?
            `)
            .get(result.lastInsertRowid);


        res.status(201).json(application);


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to add application."
        });

    }

});


// ==========================================
// PUT - EDIT APPLICATION
// ==========================================

app.put("/api/applications/:id", (req, res) => {

    try {

        const { id } = req.params;


        const {
            company,
            role,
            status,
            priority,
            deadline,
            notes,
            job_url
        } = req.body;


        if (!company || !role || !status) {

            return res.status(400).json({
                message:
                    "Company, role and status are required."
            });

        }


        const selectedPriority =
            priority || "Medium";


        const result = db
            .prepare(`
                UPDATE applications

                SET
                    company = ?,
                    role = ?,
                    status = ?,
                    priority = ?,
                    deadline = ?,
                    notes = ?,
                    job_url = ?

                WHERE id = ?
            `)
            .run(
                company,
                role,
                status,
                selectedPriority,
                deadline || null,
                notes || null,
                job_url || null,
                id
            );


        if (result.changes === 0) {

            return res.status(404).json({
                message:
                    "Application not found."
            });

        }


        const application = db
            .prepare(`
                SELECT *
                FROM applications
                WHERE id = ?
            `)
            .get(id);


        res.json(application);


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to update application."
        });

    }

});


// ==========================================
// DELETE - DELETE APPLICATION
// ==========================================

app.delete("/api/applications/:id", (req, res) => {

    try {

        const { id } = req.params;


        const result = db
            .prepare(`
                DELETE FROM applications
                WHERE id = ?
            `)
            .run(id);


        if (result.changes === 0) {

            return res.status(404).json({
                message:
                    "Application not found."
            });

        }


        res.json({
            message:
                "Application deleted successfully."
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            message:
                "Failed to delete application."
        });

    }

});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

    console.log(
        `Server running at http://localhost:${PORT}`
    );

});