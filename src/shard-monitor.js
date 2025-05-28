const { ShardingManager } = require('discord.js');
const { setData, updateShardStatus, restartShards, webhookClient } = require('./statusrtdb');
require('dotenv').config();

const manager = new ShardingManager('./src/index.js', {
    totalShards: 'auto',
    token: process.env.DISCORD_TOKEN
});

const RESHARD_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

function waitForAllShardsReady() {
    return new Promise((resolve) => {
        let readyCount = 0;
        manager.on('shardReady', shardId => {
            console.log(`[Shard Monitor]: Shard ${shardId} is ready.`);
            webhookClient.send(`[[DEVB] Shard Monitor]: Shard ${shardId} is ready.`);
            readyCount++;
            if (readyCount === manager.totalShards) resolve();
        });
    });
}

manager.spawn({ timeout: -1 }).then(async (shards) => {
    console.log('[Shard Monitor]: All shards launched. Waiting for readiness...');
    webhookClient.send("[[DEVB] Shard Monitor]: All shards launched. Waiting for readiness...");

    await waitForAllShardsReady();

    console.log('[Shard Monitor]: All shards are now ready.');
    webhookClient.send("[[DEVB] Shard Monitor]: All shards are now ready.");

    await setData('/devshards', {});
    console.log('[Shard Monitor]: Cleared previous devshard status in Firebase.');

    shards.forEach(shard => {
        updateShardStatus(shard.id, 'BOOTING', null, null);
    });

    setInterval(() => restartShards(manager), RESHARD_INTERVAL);
}).catch(error => {
    console.error('[Shard Monitor]: Error while launching shards:', error);
    webhookClient.send(`[[DEVB] Shard Monitor]: Error while launching shards: ${error}`);
});