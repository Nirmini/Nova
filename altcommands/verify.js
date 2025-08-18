const { PermissionsBitField, MessageFlags, Message } = require('discord.js');
const noblox = require('noblox.js');

module.exports = {
    id: '0000018', // Unique 6-digit command ID

    /**
     * Executes the ?verify command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        try {
            const filter = (m) => m.author.id === message.author.id;
            message.reply("Please enter your **Roblox username**:");
            
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
            const robloxUsername = collected.first().content.trim();
            
            // Step 2: Generate a 15-digit verification code
            const verificationCode = Math.floor(100000000000000 + Math.random() * 900000000000000);

            await message.reply({ content:
                `**Step 1:** Please update your Roblox "About Me" section with the following code: \`${verificationCode}\`.\n\n` +
                `Once you've updated it, type \`?verify check ${robloxUsername}\` to complete verification.`,
                flags: MessageFlags.Ephemeral}
            );

            // Save the code temporarily (in-memory, or use a database for persistence)
            global.verificationCodes = global.verificationCodes || {};
            global.verificationCodes[robloxUsername] = verificationCode;
            
        } catch (error) {
            console.error('Error during verification:', error);
            message.reply({ content:"❌ You didn't respond in time. Please try again.",flags: MessageFlags.Ephemeral});
        }
    },

    /**
     * Handles the `?verify check <RobloxUsername>` command.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    check: async (message) => {
        const args = message.content.split(' ').slice(2); // Get the Roblox username
        if (!args[0]) return message.reply("❌ Please provide your **Roblox username**: `?verify check <RobloxUsername>`");

        const robloxUsername = args[0].trim();
        if (!global.verificationCodes || !global.verificationCodes[robloxUsername]) {
            return message.reply("❌ You haven't started verification yet. Use `?verify` first.");
        }

        const verificationCode = global.verificationCodes[robloxUsername];

        try {
            // Step 3: Fetch user ID and About section
            const userId = await noblox.getIdFromUsername(robloxUsername);
            const profileInfo = await noblox.getPlayerInfo(userId);

            if (profileInfo.blurb.includes(verificationCode)) {
                // Step 4: Find the 'employee' role
                const verifiedRole = message.guild.roles.cache.find(role => 
                    role.name.toLowerCase().includes('employee')
                );

                if (verifiedRole) {
                    await message.member.roles.add(verifiedRole);
                    await message.reply(`✅ **Verification successful!** You have been given the **Employee** role.`);
                } else {
                    await message.reply("❌ Could not find a role containing 'Employee'. Please contact an admin.");
                }
            } else {
                await message.reply("❌ Verification failed! The code was not found in your Roblox 'About Me' section. Please update it and try again.");
            }
        } catch (error) {
            console.error(error);
            await message.reply("❌ An error occurred while verifying your account. Please try again.");
        }
    }
};
