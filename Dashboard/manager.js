const cfg = require('../settings.json');
const path = require('path');
const express = require('express');
const fs = require('fs');
const os = require('os');
const app = express();
let PORT = cfg.ports.LocalDash;

// CORS middleware to allow API calls to local backend ports
app.use((req, res, next) => {
    const allowedOrigins = [
        `http://localhost:${PORT}`
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
    }
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Serve static files (including HTML) from DevDash directory
app.use(express.static(__dirname));

// Route for root (/) to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Always start the server (even if required)
if (!global.__REMOTE_DASHBOARD) {
    app.listen(PORT, () => {
        console.log(`Dashboard remote running at http://localhost:${PORT}/`);
    });
    global.__REMOTE_DASHBOARD = true;
}

module.exports = app;