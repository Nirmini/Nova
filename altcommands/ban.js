const { EmbedBuilder } = require('discord.js');
const emoji = require('../emoji.json');

module.exports = {
    id: '0000001', // Unique 6-digit command ID
    /**
     * Executes the ban command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const args = message.content.split(' ').slice(1); // Split the message into arguments
        if (args.length < 3) {
            const embed = new EmbedBuilder()
                .setTitle('Ban Command Help')
                .setDescription(`Usage: \`?ban <Notify:True/False> <@user> <Reason>\``)
                .setColor(0x00ffff)
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        try {
            const [notifyArg, userMention, publicReason, ...auditLogReasonParts] = args;
            const notify = notifyArg.toLowerCase() === 'true';
            const user = message.mentions.members.first();

            if (!user) return message.reply('Please mention a valid user.');

            const directEmbeds = new EmbedBuilder()
            .setColor(0xff5050)
            .setTitle(`<:ShieldDenied:${emoji.ShieldDenied}> You were banned from ${message.guild.name} | ${publicReason}`)
            .setDescription(`You can submit an appeal in XX days.`)

            await user.ban({ reason: publicReason });

            if (notify) {
                await user.send({ embeds: [directEmbeds]});
            }

            const embed = new EmbedBuilder()
                .setTitle(`<:ShieldDenied:${emoji.ShieldDenied}> ***${user.tag} was banned.*** | ${publicReason}`)
                .setColor(0x0fff0f)
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing ban command:', error);
            message.reply('An error occurred while processing the ban command.');
        }
    },
};
