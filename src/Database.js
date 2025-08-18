const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../keys/serviceAccountKey.json');
const settings = require('../settings.json');
const mutex = require('../core/APIs/Mutex');

let db;

// If the flag isn't found, assume local_database is true
const useLocalDb = (typeof settings.local_database === 'undefined') ? true : settings.local_database;

if (!useLocalDb && settings.useremotedb) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://nova-devdis-default-rtdb.firebaseio.com"
        });
    }
    db = admin.database();
}

// NovaAppData paths
const novaAppDataDir = path.join(__dirname, '../NovaAppData');
const paths = {
    guildsettings: path.join(novaAppDataDir, 'guildsettings.json'),
    guilddata: path.join(novaAppDataDir, 'guilddata.json'),
    birthdays: path.join(novaAppDataDir, 'birthdays.json'),
    userdata: path.join(novaAppDataDir, 'userdata.json')
};

// Helper to read/write JSON files
function readJson(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}
function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper: parse dot/slash notation into array
function parseKeyPath(key) {
    if (!key) return [];
    if (Array.isArray(key)) return key;
    return key.split(/[./]/).filter(Boolean);
}

// Helper: get nested value
function getNested(obj, keyPathArr) {
    return keyPathArr.reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// Helper: set nested value
function setNested(obj, keyPathArr, value) {
    let o = obj;
    for (let i = 0; i < keyPathArr.length - 1; i++) {
        if (!o[keyPathArr[i]]) o[keyPathArr[i]] = {};
        o = o[keyPathArr[i]];
    }
    o[keyPathArr[keyPathArr.length - 1]] = value;
}

// Helper: delete nested value
function deleteNested(obj, keyPathArr, value) {
    let o = obj;
    for (let i = 0; i < keyPathArr.length - 1; i++) {
        if (!o[keyPathArr[i]]) return;
        o = o[keyPathArr[i]];
    }
    const lastKey = keyPathArr[keyPathArr.length - 1];
    if (typeof value === 'undefined' || o[lastKey] === value) {
        delete o[lastKey];
    }
}

// ----------- Guild Config (guildsettings) -----------
async function getGuildConfig(guildId, key, value) {
    await mutex.lock();
    try {
        let data;
        if (useLocalDb) {
            data = readJson(paths.guildsettings)[guildId] || {};
        } else {
            const snapshot = await db.ref(`guildsettings/${guildId}`).once('value');
            data = snapshot.val() || {};
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

async function setGuildConfig(guildId, keyOrObj, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.guildsettings);
            if (typeof keyOrObj === 'object' && keyOrObj !== null) {
                fileData[guildId] = { ...(fileData[guildId] || {}), ...keyOrObj };
            } else {
                if (!fileData[guildId]) fileData[guildId] = {};
                setNested(fileData[guildId], parseKeyPath(keyOrObj), value);
            }
            writeJson(paths.guildsettings, fileData);
        } else {
            if (typeof keyOrObj === 'object' && keyOrObj !== null) {
                await db.ref(`guildsettings/${guildId}`).set({ ...keyOrObj, TYPE: 'Settings' });
            } else {
                await db.ref(`guildsettings/${guildId}/${parseKeyPath(keyOrObj).join('/')}`).set(value);
            }
        }
    } finally {
        mutex.unlock();
    }
}

async function removeGuildConfig(guildId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.guildsettings);
            if (!fileData[guildId]) return;
            deleteNested(fileData[guildId], parseKeyPath(key), value);
            writeJson(paths.guildsettings, fileData);
        } else {
            const dbPath = `guildsettings/${guildId}/${parseKeyPath(key).join('/')}`;
            if (typeof value === 'undefined') {
                await db.ref(dbPath).remove();
            } else {
                const snapshot = await db.ref(dbPath).once('value');
                if (snapshot.val() === value) {
                    await db.ref(dbPath).remove();
                }
            }
        }
    } finally {
        mutex.unlock();
    }
}

async function updateGuildConfig(guildId, key, value) {
    // For local, setNested is enough; for remote, use set (Firebase doesn't have partial update for nested)
    await setGuildConfig(guildId, key, value);
}

// ----------- Guild Data (guilddata) -----------
async function getGuildData(guildId, key, value) {
    await mutex.lock();
    try {
        let data;
        if (useLocalDb) {
            data = readJson(paths.guilddata)[guildId] || {};
        } else {
            const snapshot = await db.ref(`guilddata/${guildId}`).once('value');
            data = snapshot.val() || {};
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

async function setGuildData(guildId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.guilddata);
            if (!fileData[guildId]) fileData[guildId] = {};
            setNested(fileData[guildId], parseKeyPath(key), value);
            writeJson(paths.guilddata, fileData);
        } else {
            await db.ref(`guilddata/${guildId}/${parseKeyPath(key).join('/')}`).set({ ...value, TYPE: 'Tickets' });
        }
    } finally {
        mutex.unlock();
    }
}

async function removeGuildData(guildId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.guilddata);
            if (!fileData[guildId]) return;
            deleteNested(fileData[guildId], parseKeyPath(key), value);
            writeJson(paths.guilddata, fileData);
        } else {
            const dbPath = `guilddata/${guildId}/${parseKeyPath(key).join('/')}`;
            if (typeof value === 'undefined') {
                await db.ref(dbPath).remove();
            } else {
                const snapshot = await db.ref(dbPath).once('value');
                if (snapshot.val() === value) {
                    await db.ref(dbPath).remove();
                }
            }
        }
    } finally {
        mutex.unlock();
    }
}

async function updateGuildData(guildId, key, value) {
    await setGuildData(guildId, key, value);
}

// ----------- Birthdays -----------
async function getBirthday(userId, key, value) {
    await mutex.lock();
    try {
        let data;
        if (useLocalDb) {
            data = readJson(paths.birthdays)[userId] || {};
        } else {
            const snapshot = await db.ref(`birthdays/${userId}`).once('value');
            data = snapshot.val() || {};
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

async function setBirthday(userId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.birthdays);
            if (!fileData[userId]) fileData[userId] = {};
            setNested(fileData[userId], parseKeyPath(key), value);
            writeJson(paths.birthdays, fileData);
        } else {
            await db.ref(`birthdays/${userId}/${parseKeyPath(key).join('/')}`).set({ ...value, TYPE: 'Birthday' });
        }
    } finally {
        mutex.unlock();
    }
}

async function remBirthday(userId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.birthdays);
            if (!fileData[userId]) return;
            deleteNested(fileData[userId], parseKeyPath(key), value);
            writeJson(paths.birthdays, fileData);
        } else {
            const dbPath = `birthdays/${userId}/${parseKeyPath(key).join('/')}`;
            if (typeof value === 'undefined') {
                await db.ref(dbPath).remove();
            } else {
                const snapshot = await db.ref(dbPath).once('value');
                if (snapshot.val() === value) {
                    await db.ref(dbPath).remove();
                }
            }
        }
    } finally {
        mutex.unlock();
    }
}

async function updBirthday(userId, key, value) {
    await setBirthday(userId, key, value);
}

// ----------- User Data -----------
async function getUserData(userId, key, value) {
    await mutex.lock();
    try {
        let data;
        if (useLocalDb) {
            data = readJson(paths.userdata)[userId] || {};
        } else {
            const snapshot = await db.ref(`userdata/${userId}`).once('value');
            data = snapshot.val() || {};
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

async function setUserData(userId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.userdata);
            if (!fileData[userId]) fileData[userId] = {};
            setNested(fileData[userId], parseKeyPath(key), value);
            writeJson(paths.userdata, fileData);
        } else {
            await db.ref(`userdata/${userId}/${parseKeyPath(key).join('/')}`).set({ ...value, TYPE: 'UData' });
        }
    } finally {
        mutex.unlock();
    }
}

async function removeUserData(userId, key, value) {
    await mutex.lock();
    try {
        if (useLocalDb) {
            let fileData = readJson(paths.userdata);
            if (!fileData[userId]) return;
            deleteNested(fileData[userId], parseKeyPath(key), value);
            writeJson(paths.userdata, fileData);
        } else {
            const dbPath = `userdata/${userId}/${parseKeyPath(key).join('/')}`;
            if (typeof value === 'undefined') {
                await db.ref(dbPath).remove();
            } else {
                const snapshot = await db.ref(dbPath).once('value');
                if (snapshot.val() === value) {
                    await db.ref(dbPath).remove();
                }
            }
        }
    } finally {
        mutex.unlock();
    }
}

async function updateUserData(userId, key, value) {
    await setUserData(userId, key, value);
}

module.exports = {
    getGuildConfig,
    setGuildConfig,
    removeGuildConfig,
    updateGuildConfig,
    getGuildData,
    setGuildData,
    removeGuildData,
    updateGuildData,
    getBirthday,
    setBirthday,
    remBirthday,
    updBirthday,
    getUserData,
    setUserData,
    removeUserData,
    updateUserData
};