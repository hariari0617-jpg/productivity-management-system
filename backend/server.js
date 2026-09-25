const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();

// Render provides PORT automatically
const PORT = process.env.PORT || 5000;

app.use(express.json());

// ===============================
// SQLite Database
// ===============================

const dbPath = path.join(__dirname, "tasks.db");

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("SQLite database connected");
    }
});

// ===============================
// Create Database Tables + User
// ===============================

db.serialize(() => {

    // Tasks table
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            priority TEXT,
            category TEXT,
            dueDate TEXT,
            completed INTEGER DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.log("Tasks table error:", err.message);
        } else {
            console.log("Tasks table ready");
        }
    });

    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.log("Users table error:", err.message);
        } else {
            console.log("Users table ready");
        }
    });

    // Create demo login user
    db.run(
        `INSERT OR IGNORE INTO users (username, password)
         VALUES (?, ?)`,
        ["admin", "admin123"],
        function (err) {

            if (err) {
                console.log("User creation error:", err.message);
            } else {
                console.log(
                    "Admin user ready. Changes:",
                    this.changes
                );
            }
        }
    );
});

// ===============================
// GET ALL TASKS
// ===============================

app.get("/api/tasks", (req, res) => {

    db.all(
        "SELECT * FROM tasks ORDER BY id DESC",
        [],
        (err, rows) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json(rows);
        }
    );
});

// ===============================
// ADD TASK
// ===============================

app.post("/api/tasks", (req, res) => {

    const {
        title,
        priority,
        category,
        dueDate
    } = req.body;

    if (!title || title.trim() === "") {
        return res.status(400).json({
            error: "Task title is required"
        });
    }

    db.run(
        `INSERT INTO tasks
        (title, priority, category, dueDate, completed)
        VALUES (?, ?, ?, ?, 0)`,
        [
            title,
            priority,
            category,
            dueDate
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                id: this.lastID,
                title,
                priority,
                category,
                dueDate,
                completed: 0
            });
        }
    );
});

// ===============================
// COMPLETE / UNDO TASK
// ===============================

app.put("/api/tasks/:id", (req, res) => {

    const { id } = req.params;
    const { completed } = req.body;

    db.run(
        "UPDATE tasks SET completed = ? WHERE id = ?",
        [completed, id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Task updated successfully"
            });
        }
    );
});

// ===============================
// EDIT TASK
// ===============================

app.put("/api/tasks/:id/edit", (req, res) => {

    const { id } = req.params;

    const {
        title,
        priority,
        category,
        dueDate
    } = req.body;

    db.run(
        `UPDATE tasks
         SET title = ?,
             priority = ?,
             category = ?,
             dueDate = ?
         WHERE id = ?`,
        [
            title,
            priority,
            category,
            dueDate,
            id
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Task edited successfully"
            });
        }
    );
});

// ===============================
// DELETE TASK
// ===============================

app.delete("/api/tasks/:id", (req, res) => {

    const { id } = req.params;

    db.run(
        "DELETE FROM tasks WHERE id = ?",
        [id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                message: "Task deleted successfully"
            });
        }
    );
});

// ===============================
// REGISTER API
// ===============================

app.post("/api/register", (req, res) => {

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password are required"
        });
    }

    if (username.trim().length < 3) {
        return res.status(400).json({
            message: "Username must be at least 3 characters"
        });
    }

    if (password.length < 4) {
        return res.status(400).json({
            message: "Password must be at least 4 characters"
        });
    }

    db.run(
        `INSERT INTO users (username, password)
         VALUES (?, ?)`,
        [username.trim(), password],
        function (err) {

            if (err) {

                if (err.message.includes("UNIQUE")) {
                    return res.status(409).json({
                        message: "Username already exists"
                    });
                }

                return res.status(500).json({
                    message: "Registration failed"
                });
            }

            res.json({
                message: "Registration successful"
            });
        }
    );
});

// ===============================
// LOGIN API
// ===============================

app.post("/api/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    db.get(
        `SELECT * FROM users
         WHERE username = ?
         AND password = ?`,
        [
            username,
            password
        ],
        (err, user) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!user) {
                return res.status(401).json({
                    message: "Invalid username or password"
                });
            }

            res.json({
                message: "Login successful",

                user: {
                    id: user.id,
                    username: user.username
                }
            });
        }
    );
});

// ===============================
// SERVE FRONTEND
// ===============================

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);

// ===============================
// START SERVER
// ===============================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Server running on port ${PORT}`
    );

});
