const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { getData, setData, removeData } = require('../../src/firebaseAdmin'); // Use Admin SDK

module.exports = {
    id: '6659812', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('delwarn')
        .setDescription('Delete a specific warning from a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('User to delete warning from')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('warn_number')
                .setDescription('The warning number to delete')
                .setRequired(true)),
    async execute(interaction) {
        try {
            console.log('Checking permissions...');
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
                await interaction.reply({ content: 'You do not have permission to use this command.', flags: MessageFlags.Ephemeral });
                return;
            }

            console.log('Fetching user and warning number...');
            const user = interaction.options.getUser('user');
            const warnNumber = interaction.options.getInteger('warn_number');
            const userId = user.id;
            const guildId = interaction.guildId;

            console.log(`User: ${userId}, Guild: ${guildId}, WarnNumber: ${warnNumber}`);
            
            const userWarningsPath = `/warnings/${guildId}/${userId}`;
            const warnings = await getData(userWarningsPath);

            if (!warnings) {
                await interaction.reply({ content: 'This user has no warnings.', flags: MessageFlags.Ephemeral });
                return;
            }

            const warningKeys = Object.keys(warnings);
            if (warnNumber < 1 || warnNumber > warningKeys.length) {
                await interaction.reply({ content: 'Invalid warning number.', flags: MessageFlags.Ephemeral });
                return;
            }

            const warnId = warningKeys[warnNumber - 1];
            delete warnings[warnId]; // Remove the specific warning

            console.log('Updating database...');
            if (Object.keys(warnings).length > 0) {
                await setData(userWarningsPath, warnings);
            } else {
                await removeData(userWarningsPath);
            }

            await interaction.reply({ content: `Warning #${warnNumber} for ${user.tag} has been deleted.`, flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error('Error deleting warning:', error);
            await interaction.reply({ content: 'There was an error deleting the warning. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
};
