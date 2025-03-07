const admin = require('firebase-admin');
const serviceAccount = require('../keys/status-serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "<https://nova-statusmngr-default-rtdb.firebaseio.com or your status RTDB URL>"
    });
}

const db = admin.database();

/**
 * Get data from a specific path in the database.
 * @param {string} path - The path to the data.
 * @returns {Promise<any>} - The data at the specified path.
 */
async function getData(path) {
    try {
        const snapshot = await db.ref(path).once('value');
        const value = snapshot.val();

        if (value === null) {
            console.warn(`Warning: No data found at path "${path}"`);
            return null;
        }

        return value; // Return the data as-is
    } catch (error) {
        console.error(`Error getting data from path "${path}":`, error.message);
        throw error;
    }
}

/**
 * Set data at a specific path in the database.
 * Stores data as-is without Base64 encoding.
 * @param {string} path - The exact path to set data.
 * @param {any} data - The data to store.
 * @returns {Promise<void>}
 */
async function setData(path, data) {
    try {
        await db.ref(path).set(data);
    } catch (error) {
        console.error(`Error setting data at path "${path}":`, error.message);
        throw error;
    }
}

/**
 * Update specific fields at a given path in the database.
 * Stores data as-is without Base64 encoding.
 * @param {string} path - The path to update data.
 * @param {object} updates - An object containing key-value pairs to update.
 * @returns {Promise<void>}
 */
async function updateData(path, updates) {
    try {
        await db.ref(path).update(updates);
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
