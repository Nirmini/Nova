const { SlashCommandBuilder } = require('discord.js');
const { ShardingManager } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delshard')
        .setDescription('Delete a shard (restricted to UID 600464355917692952).'),
    async execute(interaction) {
        // Only allow the command to be executed by the authorized UID
        if (interaction.user.id !== '600464355917692952') {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Get the shard manager
        const shardManager = interaction.client.shard;

        // Check if there is more than 1 shard
        if (shardManager.shards.size <= 1) {
            return interaction.reply({ content: 'Cannot delete the shard. There must be more than 1 shard.', ephemeral: true });
        }

        try {
            // Get the last shard ID and kill it
            const lastShard = shardManager.shards.last();
            await lastShard.kill();
            
            await interaction.reply(`Shard ${lastShard.id} has been deleted. Total shards: ${shardManager.shards.size - 1}`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Failed to delete the shard.', ephemeral: true });
        }
    },
};
