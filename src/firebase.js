const { env } = require('process');
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get, update, remove } = require('firebase/database');

// Your web app's Firebase configuration
const firebaseConfig = {
// <YOUR FIREBASE WEB PROJECT CONFIG>
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export the standard Firebase database API
module.exports = { db, ref, set, get, update, remove };
//This is useless as it doesnt get authenticated