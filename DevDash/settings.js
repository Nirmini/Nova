const express = require('express');
const path = require('path');
const app = express();
const cfg = require('../settings.json');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

if (require.main === module) {
    const PORT = cfg.ports.DevDash[4];
    app.listen(PORT, () => {
        console.log(`Settings dashboard running at http://localhost:${PORT}/`);
    });
}