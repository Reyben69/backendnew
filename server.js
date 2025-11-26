require("dotenv").config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) console.log("DB Connection Error:", err);
    else console.log("Connected to MySQL");
});

// ROUTES
app.get('/tasks', (req, res) => {
    db.query("SELECT * FROM tasks", (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

app.post('/tasks', (req, res) => {
    const sql = "INSERT INTO tasks (title, date, priority, completed) VALUES (?)";
    const values = [req.body.title, req.body.date, req.body.priority, false];

    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, ...req.body, completed: false });
    });
});

app.put('/tasks/:id', (req, res) => {
    const sql = "UPDATE tasks SET title=?, date=?, completed=? WHERE id=?";
    db.query(sql, [req.body.title, req.body.date, req.body.completed, req.params.id], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

app.delete('/tasks/:id', (req, res) => {
    db.query("DELETE FROM tasks WHERE id=?", [req.params.id], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

const port = process.env.PORT || 8081;
app.listen(port, () => {
    console.log("Server running on port " + port);
});
