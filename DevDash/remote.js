const path = require('path');
const express = require('express');
const fs = require('fs');
const os = require('os');
const app = express();
const cfg = require('../settings.json');
const { getPort } = require('../mainappmodules/ports.js');

// CORS middleware to allow API calls to local backend ports
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:65520',
        'http://localhost:65521',
        'http://localhost:65522',
        'http://localhost:65523',
        'http://localhost:65524',
        'http://localhost:65525'
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

// Only shard 0 should spawn the Express server
const portArray = getPort('devdash');
const PORT = portArray[0];
const shardId = process.env.SHARD_ID ? parseInt(process.env.SHARD_ID) : 0;
if (!global.__DEVDASH_REMOTE_STARTED && shardId === 0) {
    app.listen(PORT, () => {
        console.log(`DevDash remote running at http://localhost:${PORT}/`);
    });
    global.__DEVDASH_REMOTE_STARTED = true;
}

module.exports = app;