const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const path = require('path');

// List of user UIDs allowed to see detailed error messages and file paths
const authorizedUIDs = ['600464355917692952', '1296245929292206135']; // Replace with actual UIDs

module.exports = {
    id: '2285719', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('diagnose')
        .setDescription('Check if a specified code file is working.')
        .addStringOption(option =>
            option
                .setName('filename')
                .setDescription('The name of the file to diagnose (without extension).')
                .setRequired(true)
        ),
    async execute(interaction) {
        let filename = interaction.options.getString('filename');

        // Sanitize filename to prevent directory traversal
        filename = filename.replace(/[.\/\\]/g, ''); 

        const localPath = `src/${filename}.js`; // Local relative path for display
        const filepath = path.resolve(__dirname, `../../${localPath}`);

        // Log the request to the console
        console.log(`${interaction.user.id} requested status of module "${filename}.js"`);

        try {
            // Clear cache for fresh diagnosis
            delete require.cache[require.resolve(filepath)];
            require(filepath); // Attempt to require the file to validate it

            const embed = new EmbedBuilder()
                .setTitle('Nova XDebug: Diagnose Tool')
                .setColor(0x00ff00)
                .setDescription(`The file \`${filename}.js\` has been loaded successfully.`);

            // Show path only to authorized users
            if (authorizedUIDs.includes(interaction.user.id)) {
                embed.addFields({ name: 'Path', value: localPath });
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error(`Error diagnosing file "${filename}":`, error);

            const embed = new EmbedBuilder()
                .setTitle('Nova XDebug: Diagnose Tool')
                .setColor(0xff0000)
                .setDescription(`An error occurred while diagnosing \`${filename}.js\`.`);

            // Restrict error details to authorized users
            if (authorizedUIDs.includes(interaction.user.id)) {
                embed.addFields(
                    { name: 'Error Message', value: error.message },
                    { name: 'Stack', value: error.stack.split('\n').slice(0, 3).join('\n') } // Restrict stack trace length
                );
                embed.addFields({ name: 'Path', value: localPath });
            } else {
                embed.addFields({
                    name: 'Error Message',
                    value: 'An issue occurred, but detailed error messages are restricted.'
                });
            }

            await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
};
