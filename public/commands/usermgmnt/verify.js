const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, InteractionType, MessageFlags } = require('discord.js');
const noblox = require('noblox.js');

module.exports = {
    id: '9688368', // Unique 6-digit command ID
    data: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your Roblox account to get the verified role.'),
        
    async execute(interaction) {
        // Step 1: Open a modal to ask for the Roblox Username
        const modal = new ModalBuilder()
            .setCustomId('robloxVerifyModal')
            .setTitle('Roblox Verification');
        
        const robloxUsernameInput = new TextInputBuilder()
            .setCustomId('robloxUsername')
            .setLabel('Enter your Roblox Username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const actionRow = new ActionRowBuilder().addComponents(robloxUsernameInput);
        modal.addComponents(actionRow);
        
        await interaction.showModal(modal);
    },
    
    async modalHandler(interaction) {
        // Step 2: Generate a 15-digit verification code
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'robloxVerifyModal') {
            const robloxUsername = interaction.fields.getTextInputValue('robloxUsername');
            const verificationCode = Math.floor(100000000000000 + Math.random() * 900000000000000); // Generate a 15-digit code

            // Step 3: Ask user to update their Roblox "About Me" section
            await interaction.reply({
                content: `Please update your Roblox "About Me" section with the following code: \`${verificationCode}\`.\nAfter you have updated it, click the **Verify** button below.`,
                flags: MessageFlags.Ephemeral,
                components: [
                    {
                        type: 1, // ActionRow type
                        components: [
                            {
                                type: 2, // Button type
                                label: "Verify",
                                style: 1, // Primary button style
                                custom_id: `verifyCode-${robloxUsername}-${verificationCode}`,
                            }
                        ]
                    }
                ]
            });
        }
    },

    async buttonHandler(interaction) {
        // Step 4: Handle the verification
        if (interaction.customId.startsWith('verifyCode')) {
            const [_, robloxUsername, verificationCode] = interaction.customId.split('-');

            try {
                // Step 5: Get the Roblox user's profile and check the About section
                const userId = await noblox.getIdFromUsername(robloxUsername);
                const profileInfo = await noblox.getPlayerInfo(userId);

                if (profileInfo.blurb.includes(verificationCode)) {
                    // Step 6: If code is found, find the role with "employee" in its name (case-insensitive)
                    const verifiedRole = interaction.guild.roles.cache.find(role => 
                        role.name.toLowerCase().includes('employee')
                    );

                    if (verifiedRole) {
                        await interaction.member.roles.add(verifiedRole);
                        await interaction.reply({ content: `You have been successfully verified and the **Employee** role has been granted!`, flags: MessageFlags.Ephemeral });
                    } else {
                        await interaction.reply({ content: `Could not find a role containing "Employee" in this server. Please contact an admin.`, flags: MessageFlags.Ephemeral });
                    }
                } else {
                    // Step 7: If code is not found in the profile
                    await interaction.reply({ content: `Verification failed! It seems like the code was not found in your "About Me" section. Please make sure you've updated it correctly.`, flags: MessageFlags.Ephemeral });
                }
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: `There was an error verifying your Roblox account. Please try again.`, flags: MessageFlags.Ephemeral });
            }
        }
    }
};
