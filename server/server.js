import 'dotenv/config';
import express from "express";
import cors from "cors";
import pkg from "pg"; // PostgreSQL
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432
});

pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("DB Connection Error:", err));

// ROUTES
app.get('/tasks', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post('/tasks', async (req, res) => {
    const { title, date, priority } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO tasks (title, date, priority, completed) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, date, priority, false]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.put('/tasks/:id', async (req, res) => {
    const { title, date, completed } = req.body;
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE tasks SET title=$1, date=$2, completed=$3 WHERE id=$4 RETURNING *",
            [title, date, completed, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json(err);
    }
});

app.delete('/tasks/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM tasks WHERE id=$1", [id]);
        res.json({ message: "Task deleted" });
    } catch (err) {
        res.status(500).json(err);
    }
});

// START SERVER
const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
