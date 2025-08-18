const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    id: '5000001', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Manage AFK status.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Marks you as AFK.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('return')
                .setDescription('Removes your AFK status.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Removes AFK from another user.')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('The user to remove AFK from.')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const member = interaction.member;

        if (subcommand === 'set') {
            // Handle AFK set
            if (!member.manageable) {
                return interaction.reply({ content: `I can't change your nickname, ${interaction.user.username}.`, flags: MessageFlags.Ephemeral });
            }

            const nickname = member.nickname || member.user.username;

            if (!nickname.startsWith('[AFK]')) {
                await member.setNickname(`[AFK] ${nickname}`).catch(console.error);
            }

            await interaction.reply(`${interaction.user}, I set your AFK.`);
        } else if (subcommand === 'return') {
            // Handle AFK return
            if (!member.manageable) {
                return interaction.reply({ content: `I can't change your nickname, ${interaction.user.username}.`, flags: MessageFlags.Ephemeral });
            }

            const nickname = member.nickname || member.user.username;

            if (nickname.startsWith('[AFK]')) {
                const newNickname = nickname.replace('[AFK] ', '');
                await member.setNickname(newNickname).catch(console.error);
            }

            await interaction.reply(`Welcome back ${interaction.user}, I removed your AFK.`);
        } else if (subcommand === 'remove') {
            // Handle AFK remove
            if (!interaction.member.permissions.has('ManageNicknames')) {
                return interaction.reply({ content: 'You do not have permission to manage nicknames.', flags: MessageFlags.Ephemeral });
            }

            const target = interaction.options.getMember('user');

            if (!target.manageable) {
                return interaction.reply({ content: `I can't change the nickname for ${target.user.username}.`, flags: MessageFlags.Ephemeral });
            }

            const nickname = target.nickname || target.user.username;

            if (nickname.startsWith('[AFK]')) {
                const newNickname = nickname.replace('[AFK] ', '');
                await target.setNickname(newNickname).catch(console.error);
                await interaction.reply(`Removed AFK status for ${target.user.username}.`);
            } else {
                await interaction.reply(`${target.user.username} is not AFK.`);
            }
        }
    },
};
