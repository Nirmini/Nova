const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    id: '6000002', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('deafen')
        .setDescription('Deafen/Undeafen a user')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Deafens a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to deafen')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Undeafens a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to undeafen')
                        .setRequired(true))),
    async execute(interaction) {
        try {
            // Check if the member has the required permission
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            const subcommand = interaction.options.getSubcommand();
            const user = interaction.options.getUser('user');
            const member = interaction.guild?.members.cache.get(user.id);

            if (!member) {
                await interaction.reply({ content: 'The specified user is not in the server.', flags: MessageFlags.Ephemeral });
                return;
            }

            // Check if the target user is in a voice channel
            if (!member.voice.channel) {
                await interaction.reply({ content: `The user ${user.tag} is not in a voice channel.`, flags: MessageFlags.Ephemeral });
                return;
            }

            if (subcommand === 'add') {
                // Deafen the user
                await member.voice.setDeaf(true);

                // Create embed response
                const embed = new EmbedBuilder()
                    .setTitle('User Deafened')
                    .setColor(0xff0000)
                    .addFields(
                        { name: 'User', value: user.tag, inline: true },
                        { name: 'Action', value: 'Deafened', inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else if (subcommand === 'remove') {
                // Undeafen the user
                await member.voice.setDeaf(false);

                // Create embed response
                const embed = new EmbedBuilder()
                    .setTitle('User Undeafened')
                    .setColor(0x00ff00)
                    .addFields(
                        { name: 'User', value: user.tag, inline: true },
                        { name: 'Action', value: 'Undeafened', inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            await interaction.reply({ content: 'An error occurred while processing the command.', flags: MessageFlags.Ephemeral });
        }
    },
};
