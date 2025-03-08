const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { setData, getData } = require('../../src/firebaseAdmin'); // Admin SDK functions

module.exports = {
    id: '1735921', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('format')
        .setDescription('Format the blacklisted commands for a guild')
        .addStringOption(option =>
            option.setName('blacklist')
                .setDescription('JSON string for blacklisted commands')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            if (interaction.user.id === "600464355917692952") {
                // Fetch the provided JSON string for the blacklist
                const blacklistJSON = interaction.options.getString('blacklist');

                let blacklist;
                try {
                    // Parse the provided JSON to ensure it is valid
                    blacklist = JSON.parse(blacklistJSON);
                } catch (error) {
                    return interaction.reply({ content: 'The provided JSON is invalid. Please ensure the format is correct.', flags: MessageFlags.Ephemeral });
                }

                // Fetch the Guild ID and create the path for Firebase
                const guildId = interaction.guildId;
                const configPath = `configs/${guildId}/Commands`;

                // Check if a blacklist already exists for this guild and log the current state
                const existingData = await getData(configPath);
                console.log('Existing blacklist:', existingData);

                // Set the new blacklist JSON data in Firebase
                await setData(configPath, blacklist);

                // Create a success embed for the reply
                const successEmbed = new EmbedBuilder()
                    .setTitle('Blacklist Updated')
                    .setColor(0x00ff00)
                    .setTimestamp()
                    .setFooter({ text: 'Blacklist Update' })
                    .addFields(
                        { name: 'Guild', value: interaction.guild.name, inline: true },
                        { name: 'Blacklist', value: JSON.stringify(blacklist, null, 2), inline: false }
                    );

                // Respond to the interaction with the success message
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });
            } else {
                await interaction.reply({ content: 'You are not authorized to use this command.', flags: MessageFlags.Ephemeral });
            }
        } catch (error) {
            console.error('Error during command execution:', error.message);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
