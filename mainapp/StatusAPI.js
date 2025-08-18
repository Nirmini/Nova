const dotenv = require('dotenv');
dotenv.config();

const cfg = require('../settings.json');
const express = require('express');
const app = express();
require('../core/global/statuspage'); // hypothetical module

const shardTotal = cfg.shardingcfg.shardcount;
const port = cfg.ports.StatusAPI;

app.use(express.json());

const shards = {}; // { [shardId]: { ready: true/false, healthy: true/false, updatedAt: Date } }

// Simple health JSON
app.get('/test', async (req, res) => {
  const readyCount = Object.values(shards).filter(s => s.ready).length;
  const healthyCount = Object.values(shards).filter(s => s.healthy).length;
  const unhealthy = shardTotal - healthyCount;

  return res.json({
    ready: readyCount,
    healthy: healthyCount,
    unhealthy,
    total: shardTotal
  });
});

// Called by shards when they are initialized and ready
app.post('/post', async (req, res) => {
  const { shardId, healthy = true } = req.body;

  if (typeof shardId !== 'number' || shardId < 0 || shardId >= shardTotal) {
    return res.status(400).json({ error: 'Invalid shardId' });
  }

  shards[shardId] = {
    ready: true,
    healthy,
    updatedAt: new Date()
  };

  return res.json({ status: 'Registered', shardId });
});

// Called by shards to see if *all shards* are ready
app.post('/ready', async (req, res) => {
  const readyCount = Object.values(shards).filter(s => s.ready).length;
  const allReady = readyCount === shardTotal;

  return res.json({ allReady, readyCount, total: shardTotal });
});

// Manual dashboard route to get full stats
app.post('/status', async (req, res) => {
  const healthyCount = Object.values(shards).filter(s => s.healthy).length;
  const readyCount = Object.values(shards).filter(s => s.ready).length;

  return res.json({
    shards,
    totalShards: shardTotal,
    readyShards: readyCount,
    healthyShards: healthyCount,
    unhealthyShards: shardTotal - healthyCount,
    allReady: readyCount === shardTotal
  });
});

// Public API route for Novaworks/devs/browser
app.get('/app', async (req, res) => {
  const list = [];
  for (let i = 0; i < shardTotal; i++) {
    const shard = shards[i] || { ready: false, healthy: false };
    list.push({
      id: i,
      ...shard
    });
  }

  return res.json({
    timestamp: new Date(),
    shards: list
  });
});
if (require.main === module) {
  app.listen(port, () => {
    console.log(`[StatusAPI] Express server running on port ${port}`);
  });
}
