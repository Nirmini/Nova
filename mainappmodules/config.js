const path = require('node:path');
const { readFileSync, writeFileSync } = require('node:fs');

const settingsPath = path.resolve(__dirname, '../settings.json');

function readSettings() {
    try {
        return JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch (err) {
        throw new Error(`Failed to read settings file: ${err.message}`);
    }
}

function getConfig(name) {
    const settings = readSettings();
    if (!(name in settings)) {
        throw new Error(`Unable to find key "${name}".`);
    }
    return settings[name];
}

function setConfig(name, value) {
    const settings = readSettings();
    settings[name] = value;
    try {
        writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (err) {
        throw new Error(`Failed to write settings file: ${err.message}`);
    }
}

module.exports = { config: { getConfig, setConfig } };