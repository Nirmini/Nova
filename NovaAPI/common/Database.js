const fetch = require("node-fetch"); // make sure node-fetch is installed
const {
  getGuildData, setGuildData, removeGuildData,
  getGuildConfig, setGuildConfig, removeGuildConfig,
  getUserData, setUserData, removeUserData
} = require('../../src/Database');
const cfg = require('../../settings.json');

// --- Workers KV via REST API ---
const KV_ENABLED = cfg.NovaAPI_Config.Workers_KV_Enabled && cfg.NovaAPI_Config.PerfStorage === "KV";
const KV_NAMESPACE = process.env.WORKERS_KV_ITEMID || "NovaAPI-Cache";
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;

async function kvSet(key, value) {
  if (!KV_ENABLED) {
    console.warn(`[KV] kvSet: KV is not enabled, skipping set for key "${key}"`);
    return;
  }
  try {
    const safeValue = value === undefined ? null : value; // never undefined
    const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE}/values/${encodeURIComponent(key)}`;
    console.log(`[KV] kvSet: PUT ${url} | Value:`, safeValue);

    const res = await fetch(url, {
      method: "PUT", // <-- Change PUT to POST
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(safeValue)
    });

    const resText = await res.text();
    console.log(`[KV] kvSet: Response status: ${res.status}, body: ${resText}`);

    if (!res.ok) {
      throw new Error(`KV set failed with status ${res.status}: ${resText}`);
    }
  } catch (err) {
    console.warn(`[KV] kvSet failed for key "${key}":`, err.message);
  }
}

async function kvGet(key) {
  if (!KV_ENABLED) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE}/values/${encodeURIComponent(key)}`,
      { headers: { Authorization: `Bearer ${CF_API_TOKEN}` } }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`KV fetch failed with status ${res.status}`);
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    console.warn(`KV get failed for key "${key}":`, err.message);
    return null;
  }
}

async function kvDelete(key) {
  if (!KV_ENABLED) return;
  try {
    await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE}/values/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` }
    });
  } catch {
    // silently fail
  }
}

// --- API Cache Helpers ---
async function setAPIData(path, value) {
  await kvSet(path, value);
}

async function removeAPIData(path) {
  await kvDelete(path);
}

// --- Public API Wrappers with KV + Fallback ---
// Guild Config
async function getGuildConfigWrapper(guildId, path) {
  const kvData = await kvGet(`guildconfig/${guildId}${path ? `/${path}` : ''}`);
  if (kvData) return kvData;
  return getGuildConfig(guildId, path);
}

async function setGuildConfigWrapper(guildId, config, path) {
  await setGuildConfig(guildId, config, path);
  await kvSet(`guildconfig/${guildId}${path ? `/${path}` : ''}`, config);
}

async function removeGuildConfigWrapper(guildId, path) {
  await removeGuildConfig(guildId, path);
  await kvDelete(`guildconfig/${guildId}${path ? `/${path}` : ''}`);
}

// Guild Data
async function getGuildDataWrapper(guildId, path) {
  const kvData = await kvGet(`guilddata/${guildId}${path ? `/${path}` : ''}`);
  if (kvData) return kvData;
  return getGuildData(guildId, path);
}

async function setGuildDataWrapper(guildId, data, path) {
  await setGuildData(guildId, data, path);
  await kvSet(`guilddata/${guildId}${path ? `/${path}` : ''}`, data);
}

async function removeGuildDataWrapper(guildId, path) {
  await removeGuildData(guildId, path);
  await kvDelete(`guilddata/${guildId}${path ? `/${path}` : ''}`);
}

// User Data
async function getUserDataWrapper(userId, path) {
  const kvData = await kvGet(`userdata/${userId}${path ? `/${path}` : ''}`);
  if (kvData) return kvData;
  return getUserData(userId, path);
}

async function setUserDataWrapper(userId, data, path) {
  await setUserData(userId, data, path);
  await kvSet(`userdata/${userId}${path ? `/${path}` : ''}`, data);
}

async function removeUserDataWrapper(userId, path) {
  await removeUserData(userId, path);
  await kvDelete(`userdata/${userId}${path ? `/${path}` : ''}`);
}

// --- Export API ---
module.exports = {
  getGuildConfig: getGuildConfigWrapper,
  setGuildConfig: setGuildConfigWrapper,
  removeGuildConfig: removeGuildConfigWrapper,
  getGuildData: getGuildDataWrapper,
  setGuildData: setGuildDataWrapper,
  removeGuildData: removeGuildDataWrapper,
  getUserData: getUserDataWrapper,
  setUserData: setUserDataWrapper,
  removeUserData: removeUserDataWrapper,
  // New API cache functions
  setAPIData,
  removeAPIData
};
