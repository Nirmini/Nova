module.exports = {
    name: 'samplePlugin',
    description: 'An example user-created plugin.',
    async execute(interaction) {
        await interaction.reply({ content: '🛠 Sample Plugin Executed!', ephemeral: true });
    },
};
