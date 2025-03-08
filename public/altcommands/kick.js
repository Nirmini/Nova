const { EmbedBuilder } = require('discord.js');

module.exports = {
    /**
     * Executes the kick command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1); // Split the message into arguments
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setTitle('Kick Command Help')
                .setDescription('Usage: `?kick <Notify:True/False> <@User> <Public Reason> <Audit Log Reason>`')
                .setColor('YELLOW')
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        try {
            const [notifyArg, userMention, publicReason, ...auditLogReasonParts] = args;
            const notify = notifyArg.toLowerCase() === 'true';
            const user = message.mentions.members.first();
            const auditLogReason = auditLogReasonParts.join(' ');

            if (!user) return message.reply('Please mention a valid user.');

            await user.kick(auditLogReason);

            if (notify) {
                await user.send(`You have been kicked for: ${publicReason}`);
            }

            const embed = new EmbedBuilder()
                .setTitle('User Kicked')
                .setDescription(`Successfully kicked ${user}.`)
                .addFields(
                    { name: 'Public Reason', value: publicReason, inline: true },
                    { name: 'Audit Log Reason', value: auditLogReason || 'None', inline: true },
                )
                .setColor('ORANGE')
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing kick command:', error);
            message.reply('An error occurred while processing the kick command.');
        }
    },
};
