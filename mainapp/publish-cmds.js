const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { env } = require('process');
require('dotenv').config();

// Environment variables
const botToken = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENTID;

if (!botToken || !clientId) {
    console.error('❌ Missing DISCORD_TOKEN or CLIENTID in environment variables.');
    process.exit(1);
}

// Recursively get all .js command files in a directory
function getAllCommandFiles(dir) {
    let files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(getAllCommandFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Check for duplicate command names
function checkForDuplicateNames(commands) {
    const nameMap = new Map();
    const duplicates = [];

    for (const command of commands) {
        const name = command.name;
        if (nameMap.has(name)) {
            duplicates.push(name);
        } else {
            nameMap.set(name, true);
        }
    }

    return duplicates;
}

async function deployCommands() {
    try {
        console.log('🚀 Starting deployment of slash and context menu commands...');

        const commands = [];

        // Load slash commands
        const slashFiles = getAllCommandFiles(path.join(__dirname, '../commands'));
        for (const file of slashFiles) {
            const command = require(file);
            if (command?.data?.toJSON) {
                commands.push(command.data.toJSON());
            } else {
                console.warn(`⚠️ Skipping invalid slash command: ${file}`);
            }
        }

        // Load context menu commands
        const ctxtFiles = getAllCommandFiles(path.join(__dirname, '../ctxtmenu'));
        for (const file of ctxtFiles) {
            const ctxtCommand = require(file);
            if (ctxtCommand?.data?.toJSON) {
                commands.push(ctxtCommand.data.toJSON());
            } else {
                console.warn(`⚠️ Skipping invalid context menu command: ${file}`);
            }
        }

        console.log(`🔍 Found ${commands.length} commands to deploy.`);

        // Check for duplicates
        const duplicates = checkForDuplicateNames(commands);
        if (duplicates.length > 0) {
            console.error(`❌ Duplicate command names detected:`);
            for (const name of duplicates) {
                console.error(` - ${name}`);
            }
            console.error(`Aborting deployment to prevent API conflict.`);
            process.exit(1);
        }

        // Deploy
        const rest = new REST({ version: '10' }).setToken(botToken);
        console.log('📡 Deploying commands via Discord API...');
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('✅ Successfully deployed all commands.');
    } catch (error) {
        console.error('❌ Deployment error:', error);
    }
}

deployCommands();
