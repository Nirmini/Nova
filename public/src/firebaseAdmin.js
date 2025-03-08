const admin = require('firebase-admin');
const serviceAccount = require('../keys/serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "<YOUR_RTDB_URL>"
    });
}

const db = admin.database();

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
    try {
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
    } catch (error) {
        console.error(`Error getting data from path "${path}":`, error.message);
        throw error;
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
    try {
        const processedData = (typeof data === 'string') 
            ? Buffer.from(data, 'utf-8').toString('base64') 
            : data; // Keep numbers and other types as-is

        await db.ref(path).set(processedData);
    } catch (error) {
        console.error(`Error setting data at path "${path}":`, error.message);
        throw error;
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
    try {
        const processedUpdates = {};
        for (const key in updates) {
            processedUpdates[key] = (typeof updates[key] === 'string') 
                ? Buffer.from(updates[key], 'utf-8').toString('base64') 
                : updates[key]; // Keep numbers and other types as-is
        }
        await db.ref(path).update(processedUpdates);
    } catch (error) {
        console.error(`Error updating data at path "${path}":`, error.message);
        throw error;
    }
}

/**
 * Remove data at a specific path in the database.
 * @param {string} path - The path to remove data.
 * @returns {Promise<void>}
 */
async function removeData(path) {
    try {
        await db.ref(path).remove();
    } catch (error) {
        console.error(`Error removing data at path "${path}":`, error.message);
        throw error;
    }
}

module.exports = {
    getData,
    setData,
    updateData,
    removeData
};
