const { SlashCommandBuilder } = require('discord.js');

const allowedUserId = '600464355917692952'; // Replace with your user ID

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shardcreate')
        .setDescription('Create a new shard. [BOT OWNER]'),
    async execute(interaction) {
        if (interaction.user.id !== allowedUserId) {
            await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        const shardManager = interaction.client.shard;

        if (!shardManager) {
            await interaction.reply({ content: 'Sharding is not enabled for this bot.', ephemeral: true });
            return;
        }

        try {
            const currentShardSize = shardManager.shards?.size || 0; // Check if shard size exists
            await interaction.reply(`Current shard count: ${currentShardSize}`);

            // Logic for creating new shards goes here. This depends on how you're managing shards.
            // For example, if using a shard manager (like PM2 or Docker), you'd send a signal to create a new shard.
            await interaction.followUp('New shard creation not implemented in this code.');

        } catch (error) {
            console.error('Error creating shard:', error);
            await interaction.reply({ content: 'There was an error. Please try again later.', ephemeral: true });
        }
    },
};
