const packageJson = require('../package.json'); // Import the package.json file
const client = require('../core/global/Client'); // Import the client instance

module.exports = {
    id: '0284795', // Unique 6-digit command ID
    /**
     * Executes the version command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            // Combine dependencies and devDependencies into a single object
            const allDependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };

            // Format each dependency as `${pkgname} - v${pkgver}`
            const dependencyList = Object.entries(allDependencies)
                .map(([pkgName, pkgVersion]) => `${pkgName} - v${pkgVersion}`)
                .join('\n');

            // Reply with the formatted dependency list
            await message.reply(`
**NovaBot Version: ** \`${packageJson.version}\`
**Node.js Version: ** \`${process.version}\`
**Process Uptime: ** \`${Math.floor(process.uptime())} seconds\`
**Bot Ping: ** \`${Math.floor(client.ws.ping)} ms\`
**Package Versions:**\n${dependencyList}
`);
        } catch (error) {
            console.error('Error executing version command:', error);
            message.reply('An error occurred while processing the version command.');
        }
    },
};