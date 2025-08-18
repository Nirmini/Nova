const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { env } = require('process');
require('dotenv').config();
require('./portman');

const botToken = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENTID;

if (!botToken || !clientId) {
    console.error('Error: Missing DISCORD_TOKEN or CLIENTID in environment variables.');
    process.exit(1);
}

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

async function deployCommands() {
    try {
        console.log('Started deploying application (/) commands and context menu commands.');

        const commands = [];
        const commandFiles = getAllCommandFiles(path.join(__dirname, '../commands'));

        for (const file of commandFiles) {
            const command = require(file);
            if (command?.data?.toJSON) {
                commands.push(command.data.toJSON());
            } else {
                console.warn(`Skipping invalid slash command file: ${file}`);
            }
        }

        const ctxtmenuFiles = getAllCommandFiles(path.join(__dirname, '../ctxtmenu'));

        for (const file of ctxtmenuFiles) {
            const ctxtcommand = require(file);
            if (ctxtcommand?.data?.toJSON) {
                commands.push(ctxtcommand.data.toJSON());
            } else {
                console.warn(`Skipping invalid context menu command file: ${file}`);
            }
        }

        console.log(`Total commands to deploy: ${commands.length}`);
        if (commands.length > 0) {
            console.log(`First command: ${JSON.stringify(commands[0])}`);
        }

        const rest = new REST({ version: '10' }).setToken(botToken);
        console.log('Deploying all commands at once...');
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('Successfully deployed all application and context menu commands.');
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

deployCommands();
