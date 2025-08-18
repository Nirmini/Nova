const { SlashCommandBuilder, ActivityType, MessageFlags } = require('discord.js');
const axios = require('axios');

const statusPageApiKey = process.env.STATUSPAGEAPIKEY;
const pageId = process.env.PageId;
const itemId = process.env.itemId;

const devPerms = require('../../devperms.json');

module.exports = {
    id: '1000006', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('maint')
        .setDescription('Remote Maintenance Mode [MultiTeam]'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
        
        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (require('../../settings.json').devcmdsenabled != true) {
            embed.setColor(0xff0000);
            embed.setTitle('Developer commands are disabled in `settings.json`.');
            return interaction.reply({ embeds: [embed] });
        }

        // Validate environment variables
        if (!statusPageApiKey || !pageId || !itemId) {
            return interaction.reply({
                content: '❌ Missing required environment variables. Maintenance mode cannot be activated.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await interaction.reply('🛠️ Entering maintenance mode...');

            // Set bot presence to indicate maintenance
            await interaction.client.user.setPresence({
                activities: [{ name: 'Maintenance', type: ActivityType.Watching }],
                status: 'dnd'
            });

            // Update StatusPage component to 'under_maintenance'
            await axios.patch(`https://api.statuspage.io/v1/pages/${pageId}/components/${itemId}`, {
                component: { status: 'under_maintenance' }
            }, {
                headers: {
                    'Authorization': `OAuth ${statusPageApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            await interaction.followUp('✅ StatusPage updated to **Under Maintenance**.');

            // Gracefully shut down shards
            if (interaction.client.shard) {
                const shardCount = interaction.client.shard.count;
                await interaction.followUp(`🔻 Killing all **${shardCount}** shards...`);

                await interaction.client.shard.broadcastEval(() => process.exit(0));
            }

            // Delay bot shutdown to ensure Discord API requests complete
            setTimeout(async () => {
                await interaction.followUp({ content: '💀 Killing main bot process.', flags: MessageFlags.Ephemeral });
                process.exit(0);
            }, 5000); // Give 5 seconds for any API requests to complete

        } catch (error) {
            console.error('❌ Error enabling maintenance mode:', error);
            await interaction.followUp({
                content: '⚠️ An error occurred while activating maintenance mode. Check logs for details.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
