const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5000;

app.use(express.json());

// SQLite database
const db = new sqlite3.Database("./tasks.db", (err) => {
    if (err) {
        console.error("Database error:", err.message);
    } else {
        console.log("SQLite database connected");
    }
});

// Create tasks table
db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        priority TEXT,
        category TEXT,
        dueDate TEXT,
        completed INTEGER DEFAULT 0
    )
`);

/* USERS TABLE */
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`);

// Add category column to existing database
db.run(
    "ALTER TABLE tasks ADD COLUMN category TEXT",
    (err) => {
        if (err && !err.message.includes("duplicate column")) {
            console.log("Category column:", err.message);
        }
    }
);

// Get all tasks
app.get("/api/tasks", (req, res) => {
    db.all("SELECT * FROM tasks ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(rows);
    });
});

// Add task
app.post("/api/tasks", (req, res) => {

    const { title, priority, category, dueDate } = req.body;

    db.run(
        `INSERT INTO tasks (title, priority, category, dueDate, completed)
         VALUES (?, ?, ?, ?, 0)`,
        [title, priority, category, dueDate],
        function (err) {

            if (err) {
                return res.status(500).json({ error: err.message });
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

// Update task - Complete / Undo
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

// Edit task
app.put("/api/tasks/:id/edit", (req, res) => {
    const { id } = req.params;
    const { title, priority, category, dueDate } = req.body;

    db.run(
        `UPDATE tasks
         SET title = ?, priority = ?, category = ?, dueDate = ?
         WHERE id = ?`,
        [title, priority, category, dueDate, id],
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

// Delete task
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

//Server frontend
app.use(express.static(path.join(__dirname, "../frontend")));

/* LOGIN API */
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password],
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


// Start server

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});