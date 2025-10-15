const { PermissionsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { setData, getData } = require('../src/Database'); // Admin SDK functions
const emoji = require('../emoji.json');

module.exports = {
    id: '0000020',
    name: 'warn',
    description: 'Warn a user in the server',
    usage: '?warn <@user> <Reason>',
    /**
     * Executes the warn command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     * @param {string[]} args - The arguments passed with the command.
     */
    async execute(message, args) {
        const logEmbed = new EmbedBuilder()
        try {
            // Check if the user has the necessary permissions
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                logEmbed.setColor(0xe35550);
                logEmbed.setsetDescriptionTitle(`<:ShieldDenied:${emoji.ShieldDenied}> You don't have permission to use this command!`)
                return message.reply({
                    embeds: [logEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            // Validate arguments
            if (args.length < 2) {
                logEmbed.setColor(0x5086e3);
                logEmbed.setDescription(`<:Info:${emoji.Info}> Usage \`${this.usage}\``)
                return message.reply({
                    embeds: [logEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }

            // Extract user and reason from arguments
            const userMention = args[0];
            const reason = args.slice(1).join(' ');

            const user = message.mentions.users.first();
            if (!user) {
                logEmbed.setColor(0xe35550);
                logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> Please mention a valid user to warn!`)
                return message.reply({
                    embeds: [logEmbed],
                    flags: MessageFlags.Ephemeral
                });
            }
            if (user == message.author) {
                logEmbed.setColor(0xe35550);
                logEmbed.setDescription(`<:NovaFailure:${emoji.NovaFailure}> I Couldn't warn \`${user.tag}\`.`)
                return message.reply({
                    embeds: [logEmbed],
                    flags: MessageFlags.Ephemeral
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
                .setColor(0xe35550)
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
                .setColor(0xe35550)
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
            }
        } catch (error) {
            console.error('Error during command execution:', error.message);
            console.error('Error details:', error.stack);
            logEmbed.setColor(0xe35550);
            logEmbed.setTitle(`<:Failure:${emoji.Failure}> An error occured while running this command!`);
            logEmbed.setDescription(`Log Stack: ${error}`);
            return message.reply({
                embeds: [logEmbed],
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
