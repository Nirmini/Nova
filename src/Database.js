const fs = require('fs');
const path = require('path');
const settings = require('../settings.json');
const mutex = require('../core/APIs/Mutex');
require('../mainapp/sentry');
const fetch = require('node-fetch');

// ============ CONFIG ============
const useLocalDb = (typeof settings.local_database === 'undefined') ? true : settings.local_database;
const useRemoteDb = settings.useremotedb && !useLocalDb;

// Cloudflare Workers KV API details
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.WKV_API_TKN;

// Map each DB category → Cloudflare KV IDs and names
const WKV_MAP = {
  guildsettings: { id: process.env.WKV_GCONFIG_ID, name: process.env.WKV_GCONFIG_NM },
  guilddata: { id: process.env.WKV_GDATA_ID, name: process.env.WKV_GDATA_NM },
  userdata: { id: process.env.WKV_UDATA_ID, name: process.env.WKV_UDATA_NM },
  birthdays: { id: process.env.WKV_BDYS_ID, name: process.env.WKV_BDYS_NM },
  subscriptions: { id: process.env.WKV_SUBS_ID, name: process.env.WKV_SUBS_NM },
};

// ============ PATHS ============
const novaAppDataDir = path.join(__dirname, '../NovaAppData');
const paths = {
  guildsettings: path.join(novaAppDataDir, 'guildsettings.json'),
  guilddata: path.join(novaAppDataDir, 'guilddata.json'),
  birthdays: path.join(novaAppDataDir, 'birthdays.json'),
  userdata: path.join(novaAppDataDir, 'userdata.json'),
  subscriptions: path.join(novaAppDataDir, 'subscriptions.json')
};

/*
@ DOCUMENTATION: Database.js - Primary DB CoreModule
This is intended to bring together GuildSettings, a flat DB and GuildData which can expand as needed.

NESTED OBJECTS: Calls for a specific key can look like object.object.object.key or object/object/object/key
These Nested keys will ONLY return the value of that key OR return an error if the key doesn't exist.
This nested objects system allows for only 1 function to cover the entire local JSON DB

@ FUNCTIONS:
GUILD DATA:
getGuildConfig | Params: Guildid(Required), Key(Required, to be optional soon) | Returns: String/Bool/Int
setGuildConfig | Params: Guildid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
removeGuildConfig | Params: Guildid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
updateGuildConfig | Params: Guildid(Required), Key(Required, to be optional soon) | Returns: String/Bool/Int (Use setGuildConfig instead)
getGuildData | Params: Guildid(Required), Key(Required, to be optional soon) | Returns: String/Bool/Int
setGuildData | Params: Guildid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
removeGuildData | Params: Guildid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
updateGuildData | Params: Guildid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int (Use setGuildData instead)
USER DATA:
getUserData | Params: Userid(Required), Key(Required, to be optional soon) | Returns: String/Bool/Int
setUserData | Params: Userid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
removeUserData | Params: Userid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
updateUserData | Params: Userid(Required), Key(Required), Value(Required) | Returns: String/Bool/Int (Use setUserData instead)
ETC:
getBirthday | Params: Guildid(Required), Key(Required, to be optional soon) | Returns: String/Bool/Int
setBirthday | Params: Guildid(Required), Key(Required) | Returns: String/Bool/Int
remBirthday | Params: Guildid(Required), Key(Required) | Returns: String/Bool/Int
updBirthday | Params: Guildid(Required), Key(Required) | Returns: String/Bool/Int
getSubscriptionData | Params: Guild/User id(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
setSubscriptionData | Params: Guild/User id(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
addSubscriptionData | Params: Guild/User id(Required), Key(Required), Value(Required) | Returns: String/Bool/Int (Use setSubscriptionData instead)
removeSubscriptionData | Params: Guild/User id(Required), Key(Required), Value(Required) | Returns: String/Bool/Int
updateSubscriptionData | Params: Guild/User id(Required), Key(Required), Value(Required) | Returns: String/Bool/Int (Use setSubscriptionData instead)
*/

// ============ HELPERS ============
function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
function parseKeyPath(key) {
  if (!key) return [];
  if (Array.isArray(key)) return key;
  return key.split(/[./]/).filter(Boolean);
}
function getNested(obj, keyPathArr) {
  return keyPathArr.reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}
function setNested(obj, keyPathArr, value) {
  let o = obj;
  for (let i = 0; i < keyPathArr.length - 1; i++) {
    if (!o[keyPathArr[i]]) o[keyPathArr[i]] = {};
    o = o[keyPathArr[i]];
  }
  o[keyPathArr[keyPathArr.length - 1]] = value;
}
function deleteNested(obj, keyPathArr, value) {
  let o = obj;
  for (let i = 0; i < keyPathArr.length - 1; i++) {
    if (!o[keyPathArr[i]]) return;
    o = o[keyPathArr[i]];
  }
  const lastKey = keyPathArr[keyPathArr.length - 1];
  if (typeof value === 'undefined' || o[lastKey] === value) delete o[lastKey];
}

// ============ WORKERS KV HELPERS ============
async function kvFetch(method, namespaceId, key, body) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  const res = await fetch(url, opts);
  if (method === 'GET') {
    if (res.status === 404) return null;
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  }
  return res.ok;
}

async function kvGet(store, key) {
  const { id } = WKV_MAP[store];
  return kvFetch('GET', id, key);
}
async function kvPut(store, key, value) {
  const { id } = WKV_MAP[store];
  return kvFetch('PUT', id, key, value);
}
async function kvDelete(store, key) {
  const { id } = WKV_MAP[store];
  return kvFetch('DELETE', id, key);
}

// Helper: load JSON from KV (returns {} if not found)
async function readRemote(store, id) {
  const res = await kvGet(store, id);
  if (!res || typeof res !== 'object') return {};
  return res;
}

// Helper: write JSON to KV
async function writeRemote(store, id, data) {
  await kvPut(store, id, data);
}

// ============ CORE FUNCTIONS ============

async function getData(store, id, key, value) {
  await mutex.lock();
  try {
    let data;
    if (useRemoteDb) {
      data = await readRemote(store, id);
    } else {
      data = readJson(paths[store])[id] || {};
    }

    if (!key) return data;
    const keyPathArr = parseKeyPath(key);
    const result = getNested(data, keyPathArr);
    if (typeof value === 'undefined') return result;
    return result === value ? result : undefined;
  } finally {
    mutex.unlock();
  }
}

async function setData(store, id, keyOrObj, value, typeTag) {
  await mutex.lock();
  try {
    if (useRemoteDb) {
      let data = await readRemote(store, id);
      if (typeof keyOrObj === 'object' && keyOrObj !== null) {
        data = { ...data, ...keyOrObj };
      } else {
        setNested(data, parseKeyPath(keyOrObj), value);
      }
      if (typeTag) data.TYPE = typeTag;
      await writeRemote(store, id, data);
    } else {
      let fileData = readJson(paths[store]);
      if (!fileData[id]) fileData[id] = {};
      if (typeof keyOrObj === 'object' && keyOrObj !== null) {
        fileData[id] = { ...fileData[id], ...keyOrObj };
      } else {
        setNested(fileData[id], parseKeyPath(keyOrObj), value);
      }
      writeJson(paths[store], fileData);
    }
  } finally {
    mutex.unlock();
  }
}

async function removeData(store, id, key, value) {
  await mutex.lock();
  try {
    if (useRemoteDb) {
      let data = await readRemote(store, id);
      deleteNested(data, parseKeyPath(key), value);
      await writeRemote(store, id, data);
    } else {
      let fileData = readJson(paths[store]);
      if (!fileData[id]) return;
      deleteNested(fileData[id], parseKeyPath(key), value);
      writeJson(paths[store], fileData);
    }
  } finally {
    mutex.unlock();
  }
}

async function updateData(store, id, key, value, typeTag) {
  return setData(store, id, key, value, typeTag);
}

// ============ ALIASES ============
const getGuildConfig = (id, key, value) => getData('guildsettings', id, key, value);
const setGuildConfig = (id, key, value) => setData('guildsettings', id, key, value, 'Settings');
const removeGuildConfig = (id, key, value) => removeData('guildsettings', id, key, value);
const updateGuildConfig = (id, key, value) => updateData('guildsettings', id, key, value, 'Settings');

const getGuildData = (id, key, value) => getData('guilddata', id, key, value);
const setGuildData = (id, key, value) => setData('guilddata', id, key, value, 'Tickets');
const removeGuildData = (id, key, value) => removeData('guilddata', id, key, value);
const updateGuildData = (id, key, value) => updateData('guilddata', id, key, value, 'Tickets');

const getUserData = (id, key, value) => getData('userdata', id, key, value);
const setUserData = (id, key, value) => setData('userdata', id, key, value, 'UData');
const removeUserData = (id, key, value) => removeData('userdata', id, key, value);
const updateUserData = (id, key, value) => updateData('userdata', id, key, value, 'UData');

const getBirthday = (id, key, value) => getData('birthdays', id, key, value);
const setBirthday = (id, key, value) => setData('birthdays', id, key, value, 'Birthday');
const remBirthday = (id, key, value) => removeData('birthdays', id, key, value);
const updBirthday = (id, key, value) => updateData('birthdays', id, key, value, 'Birthday');

const getSubscriptionData = (id, key, value) => getData('subscriptions', id, key, value);
const setSubscriptionData = (id, key, value) => setData('subscriptions', id, key, value);
const addSubscriptionData = (id, key, value) => setData('subscriptions', id, key, value);
const removeSubscriptionData = (id, key, value) => removeData('subscriptions', id, key, value);
const updateSubscriptionData = (id, key, value) => updateData('subscriptions', id, key, value);

// ============ EXPORT ============
module.exports = {
  getGuildConfig,
  setGuildConfig,
  removeGuildConfig,
  updateGuildConfig,
  getGuildData,
  setGuildData,
  removeGuildData,
  updateGuildData,
  getUserData,
  setUserData,
  removeUserData,
  updateUserData,
  getBirthday,
  setBirthday,
  remBirthday,
  updBirthday,
  getSubscriptionData,
  setSubscriptionData,
  addSubscriptionData,
  removeSubscriptionData,
  updateSubscriptionData
};
