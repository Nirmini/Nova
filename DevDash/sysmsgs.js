const express = require('express');
const path = require('path');
const app = express();
const cfg = require('../settings.json');

app.use(express.json());

app.use(express.static(__dirname));

// Add at the top of sysmsgs.js
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

const PORT = cfg.ports.DevDash[3];
if (!global.__DEVDASH_SYSMSGS_STARTED) {
    app.listen(PORT, () => {
        console.log(`DevDash sysmssgs running at http://localhost:${PORT}/`);
    });
    global.__DEVDASH_SYSMSGS_STARTED = true;
}

const userMessaging = require('../src/services/usermessaging');
app.use(userMessaging);

app.get('/api/guilds', async (req, res) => {
    const guilds = [];
    for (const guild of require('../core/global/Client').guilds.cache.values()) {
        guilds.push({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ size: 64, dynamic: true }) // or null
        });
    }
    res.json(guilds);
});

// Endpoint to get channels for a guild
app.get('/api/guilds/:guildId/channels', async (req, res) => {
    const client = require('../core/global/Client');
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.json([]);
    const channels = [];
    for (const channel of guild.channels.cache.values()) {
        if (channel.isTextBased && channel.isTextBased()) {
            channels.push({ id: channel.id, name: channel.name, type: channel.type });
        }
    }
    res.json(channels);
});