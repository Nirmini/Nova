const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const cfgPath = path.join(__dirname, '../settings.json');

app.use(express.static(__dirname));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

// API: Get settings.json
app.get('/api/settings', (req, res) => {
    try {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        res.json(cfg);
    } catch (e) {
        res.status(500).json({ error: 'Failed to read settings.' });
    }
});

// API: Update settings.json
app.post('/api/settings', (req, res) => {
    try {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        Object.assign(cfg, req.body);
        fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save settings.' });
    }
});

if (require.main === module) {
    const PORT = cfg.ports.DevDash[4];
    app.listen(PORT, () => {
        console.log(`Settings dashboard running at http://localhost:${PORT}/`);
    });
}