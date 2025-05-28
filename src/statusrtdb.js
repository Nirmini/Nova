const admin = require('firebase-admin');
const { WebhookClient } = require('discord.js');

admin.initializeApp({
    credential: admin.credential.cert(require('../keys/status-serviceAccountKey.json')),
    databaseURL: "https://multi-guildcloud-default-rtdb.firebaseio.com"
});

const db = admin.database();
const webhookClient = new WebhookClient({ url: "https://ptb.discord.com/api/webhooks/1343348188316303482/DlvtFMJaIrP6qhK4t0Te7hyHj7kglja_ZwYEvvqBCilCadd3ZUFnFkYvQ9SHONL7vUzW" });

async function setData(path, value) {
    try {
        await db.ref(path).set(value);
    } catch (error) {
        console.error(`[Shard Monitor]: Failed to set data at ${path}:`, error);
        webhookClient.send(`[[DEVB] Shard Monitor]: Failed to set data at ${path}: ${error.message}`);
    }
}

async function updateShardStatus(shardId, status, guilds, users) {
    try {
        await db.ref(`/devshards/${shardId}`).set({
            status,
            guilds,
            users,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error(`[Shard Monitor]: Failed to update shard ${shardId} status:`, error);
        webhookClient.send(`[[DEVB] Shard Monitor]: Failed to update shard ${shardId} status: ${error.message}`);
    }
}

async function restartShards(manager) {
    console.log('[Shard Monitor]: Restarting all shards...');
    webhookClient.send('[[DEVB] Shard Monitor]: Restarting all shards...');

    for (const shard of manager.shards.values()) {
        try {
            await shard.respawn();
            console.log(`[Shard Monitor]: Shard ${shard.id} respawned.`);
            webhookClient.send(`[[DEVB] Shard Monitor]: Shard ${shard.id} respawned.`);
        } catch (error) {
            console.error(`[Shard Monitor]: Failed to respawn shard ${shard.id}:`, error);
            webhookClient.send(`[[DEVB] Shard Monitor]: Failed to respawn shard ${shard.id}: ${error.message}`);
        }
    }
}

module.exports = {
    setData,
    updateShardStatus,
    restartShards,
    webhookClient
};
