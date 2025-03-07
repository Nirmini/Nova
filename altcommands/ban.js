const { EmbedBuilder } = require('discord.js');

module.exports = {
    id: '0650011', // Unique 6-digit command ID
    /**
     * Executes the ban command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1); // Split the message into arguments
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setTitle('Ban Command Help')
                .setDescription('Usage: `?ban <Notify:True/False> <@User> <Public Reason> <Audit Log Reason>`')
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

            await user.ban({ reason: auditLogReason });

            if (notify) {
                await user.send(`You have been banned for: ${publicReason}`);
            }

            const embed = new EmbedBuilder()
                .setTitle('User Banned')
                .setDescription(`Successfully banned ${user}.`)
                .addFields(
                    { name: 'Public Reason', value: publicReason, inline: true },
                    { name: 'Audit Log Reason', value: auditLogReason || 'None', inline: true },
                )
                .setColor('RED')
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing ban command:', error);
            message.reply('An error occurred while processing the ban command.');
        }
    },
};
