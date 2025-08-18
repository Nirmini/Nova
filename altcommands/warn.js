const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { setData, getData } = require('../../src/Database'); // Admin SDK functions

module.exports = {
    id: '0000020', // Unique 6-digit command ID
    name: 'warn',
    description: 'Warn a user in the server',
    usage: '?warn <@user> <Reason>',
    /**
     * Executes the warn command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    async execute(message, args) {
        try {
            // Check if the user has the necessary permissions
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return message.reply({
                    content: 'You do not have permission to use this command.',
                    ephemeral: true,
                });
            }

            // Validate arguments
            if (args.length < 2) {
                return message.reply({
                    content: `Usage: \`${this.usage}\``,
                    ephemeral: true,
                });
            }

            // Extract user and reason from arguments
            const userMention = args[0];
            const reason = args.slice(1).join(' ');

            const user = message.mentions.users.first();
            if (!user) {
                return message.reply({
                    content: 'Please mention a valid user to warn.',
                    ephemeral: true,
                });
            }

            const userId = user.id;
            const guildId = message.guild.id;
            const now = new Date();

            // Default expiration (30 days from now)
            const expirationDate = new Date(now);
            expirationDate.setDate(now.getDate() + 30);
            const expirationISO = expirationDate.toISOString();

            // Path to warnings in the database
            const userWarningsPath = `warnings/${guildId}/${userId}`;

            // Retrieve current warnings
            const snapshot = await getData(userWarningsPath);
            let warnings = snapshot || []; // Fallback to an empty array if no warnings exist

            // Add the new warning
            warnings.push({ reason, date: now.toISOString(), expires: expirationISO });

            // Save the updated warnings to the database
            await setData(userWarningsPath, warnings);

            // Create a public embed
            const publicEmbed = new EmbedBuilder()
                .setTitle('User Warned')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warnings' })
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:F>`, inline: true }
                );

            await message.channel.send({ embeds: [publicEmbed] });

            // Create a private embed for the user
            const privateEmbed = new EmbedBuilder()
                .setTitle('You have been warned')
                .setColor(0xff0000)
                .setTimestamp()
                .setFooter({ text: 'Warning' })
                .addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Expires', value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:F>`, inline: false }
                );

            // Notify the user via DM
            try {
                await user.send({ embeds: [privateEmbed] });
            } catch (error) {
                console.error('Error sending DM to user:', error);
                await message.channel.send('Warning sent, but failed to DM the user.');
            }
        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            await message.reply('An error occurred while processing the command.');
        }
    },
};
