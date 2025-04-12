const { adminDb } = require('../src/firebase');
const fs = require('fs');
const path = require('path');
const mutex = require('./Mutex');
const settings = require('../../settings.json');

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
 * Get data from a specific path in the database.
 * @param {string} path - The path to the data.
 * @returns {Promise<any>} - The decoded data at the specified path.
 */
async function getData(path) {
    await mutex.lock(); // Acquire the mutex
    try {
        if (settings.useremotedb) {
            const snapshot = await adminDb.ref(path).once('value');
            return snapshot.val();
        } else {
            const localDb = readLocalDb();
            const keys = path.split('/');
            let value = localDb;

            for (const key of keys) {
                value = value[key];
                if (value === undefined) return null;
            }

            return value;
        }
    } finally {
        mutex.unlock(); // Release the mutex
    }
}

/**
 * Set data at a specific path in the database.
 * @param {string} path - The exact path to set data.
 * @param {any} data - The data to store.
 * @returns {Promise<void>}
 */
async function setData(path, data) {
    await mutex.lock(); // Acquire the mutex
    try {
        if (settings.useremotedb) {
            await adminDb.ref(path).set(data);
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

module.exports = {
    getData,
    setData,
};
