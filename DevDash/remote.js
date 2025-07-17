const path = require('path');
const express = require('express');
const fs = require('fs');
const os = require('os');
const app = express();
const cfg = require('../settings.json');

// Serve static files (including HTML) from DevDash directory
app.use(express.static(__dirname));

// Route for root (/) to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Always start the server (even if required)
const PORT = cfg.ports.DevDash[0];
if (!global.__DEVDASH_REMOTE_STARTED) {
    app.listen(PORT, () => {
        console.log(`DevDash remote running at http://localhost:${PORT}/`);
    });
    global.__DEVDASH_REMOTE_STARTED = true;
}

module.exports = app;
