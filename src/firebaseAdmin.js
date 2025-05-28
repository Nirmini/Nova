const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../keys/serviceAccountKey.json');
const settings = require('../settings.json');
const mutex = require('../core/APIs/Mutex'); // Import the shared mutex

let db;

// Initialize Firebase only if useremotedb is true
if (settings.useremotedb) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://multi-guildcloud-default-rtdb.firebaseio.com"
        });
    }
    db = admin.database();
}

// Path to the local database file
const localDbPath = path.join(__dirname, '../localdb.json');

/**
 * Reads the local database file and parses it into an object.
 * @returns {object} - The parsed local database.
 */
function readLocalDb() {
    const data = fs.readFileSync(localDbPath, 'utf-8');
    return JSON.parse(data);
}

/**
 * Writes the given object to the local database file.
 * @param {object} data - The data to write to the local database.
 */
function writeLocalDb(data) {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Checks if a string is Base64 encoded.
 * @param {string} str - The string to check.
 * @returns {boolean} - True if valid Base64, false otherwise.
 */
function isBase64(str) {
    if (!str || typeof str !== 'string') return false;
    if (str.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(str)) return false;

    try {
        return Buffer.from(str, 'base64').toString('utf-8').length > 0;
    } catch {
        return false;
    }
}

/**
 * Get data from a specific path in the database.
 * @param {string} path - The path to the data.
 * @returns {Promise<any>} - The decoded data at the specified path.
 */
async function getData(path) {
    console.warn("/src/firebaseAdmin is Deprecated, use /core/APIS/RTDB_connecter instead.");
    await mutex.lock(); // Acquire the mutex
    try {
        if (settings.useremotedb) {
            const snapshot = await db.ref(path).once('value');
            const value = snapshot.val();

            if (value === null) {
                console.warn(`Warning: No data found at path "${path}"`);
                return null;
            }

            // Decode only if the value is a valid Base64 string
            if (typeof value === 'string' && isBase64(value)) {
                return Buffer.from(value, 'base64').toString('utf-8');
            }

            return value; // Return numbers and other types as-is
        } else {
            const localDb = readLocalDb();
            const keys = path.split('/');
            let value = localDb;

            for (const key of keys) {
                value = value[key];
                if (value === undefined) {
                    console.warn(`Warning: No data found at path "${path}"`);
                    return null;
                }
            }

            return value;
        }
    } finally {
        mutex.unlock(); // Release the mutex
    }
}

/**
 * Set data at a specific path in the database.
 * Strings are Base64-encoded, but numbers are stored as-is.
 * @param {string} path - The exact path to set data.
 * @param {any} data - The data to store.
 * @returns {Promise<void>}
 */
async function setData(path, data) {
    console.warn("/src/firebaseAdmin is Deprecated, use /core/APIS/RTDB_connecter instead.");
    await mutex.lock(); // Acquire the mutex
    try {
        if (settings.useremotedb) {
            const processedData = (typeof data === 'string') 
                ? Buffer.from(data, 'utf-8').toString('base64') 
                : data; // Keep numbers and other types as-is

            await db.ref(path).set(processedData);
        } else {
            const localDb = readLocalDb();
            const keys = path.split('/');
            let current = localDb;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key]) current[key] = {};
                current = current[key];
            }

            current[keys[keys.length - 1]] = data;
            writeLocalDb(localDb);
        }
    } finally {
        mutex.unlock(); // Release the mutex
    }
}

/**
 * Update specific fields at a given path in the database.
 * Strings are Base64-encoded, but numbers are stored as-is.
 * @param {string} path - The path to update data.
 * @param {object} updates - An object containing key-value pairs to update.
 * @returns {Promise<void>}
 */
async function updateData(path, updates) {
    console.warn("/src/firebaseAdmin is Deprecated, use /core/APIS/RTDB_connecter instead.");
    await mutex.lock(); // Acquire the mutex
    try {
        if (settings.useremotedb) {
            const processedUpdates = {};
            for (const key in updates) {
                processedUpdates[key] = (typeof updates[key] === 'string') 
                    ? Buffer.from(updates[key], 'utf-8').toString('base64') 
                    : updates[key]; // Keep numbers and other types as-is
            }
            await db.ref(path).update(processedUpdates);
        } else {
            const localDb = readLocalDb();
            const keys = path.split('/');
            let current = localDb;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key]) current[key] = {};
                current = current[key];
            }

            const lastKey = keys[keys.length - 1];
            current[lastKey] = { ...current[lastKey], ...updates };
            writeLocalDb(localDb);
        }
    } finally {
        mutex.unlock(); // Release the mutex
    }
}

/**
 * Remove data at a specific path in the database.
 * @param {string} path - The path to remove data.
 * @returns {Promise<void>}
 */
async function removeData(path) {
    console.warn("/src/firebaseAdmin is Deprecated, use /core/APIS/RTDB_connecter instead.");
    await mutex.lock(); // Acquire the mutex
    try {
        if (settings.useremotedb) {
            await db.ref(path).remove();
        } else {
            const localDb = readLocalDb();
            const keys = path.split('/');
            let current = localDb;

            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key]) return; // Path doesn't exist
                current = current[key];
            }

            delete current[keys[keys.length - 1]];
            writeLocalDb(localDb);
        }
    } finally {
        mutex.unlock(); // Release the mutex
    }
}

module.exports = {
    getData,
    setData,
    updateData,
    removeData
};
