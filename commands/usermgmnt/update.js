const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    MessageFlags,
    AttachmentBuilder,
} = require('discord.js');
const { getUserData, getGuildConfig } = require('../../src/Database');
const { drawImage } = require('../../src/services/verificationimages');
const noblox = require('noblox.js');
const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const emoji = require('../../emoji.json');

module.exports = {
    id: '9000010',
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update your roles based on your Roblox account.'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Nova Role Update')
            .setColor(0x5865F2)
            .setTimestamp();

        try {
            await interaction.deferReply({  });

            const userId = interaction.user.id;
            const userData = await getUserData(userId, "Roblox");

            if (!userData || !userData.userId) {
                embed.setDescription('You are not verified. Please use `/verify` to link your Roblox account.')
                    .setColor(0xFF0000);
                return interaction.editReply({ embeds: [embed] });
            }

            const robloxId = userData.userId;
            const guildId = interaction.guild.id;

            // Fetch binds from the guild
            const binds = (await getGuildConfig(guildId, 'Binds')) || [];
            const rolesToAdd = [];
            const managedRoles = new Set();

            for (const bind of binds) {
                const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
                const [type, id] = typeAndId.split(':');
                if (roleId) managedRoles.add(roleId);

                if (type === 'group') {
                    const rank = await noblox.getRankInGroup(parseInt(id), robloxId);
                    if (rank >= parseInt(minRank) && rank <= parseInt(maxRank)) {
                        rolesToAdd.push(roleId);
                    }
                } else if (type === 'badge') {
                    try {
                        const res = await axios.get(`https://badges.roblox.com/v1/users/${robloxId}/badges/${id}/awarded-date`);
                        if (res.data.awardedDate) rolesToAdd.push(roleId);
                    } catch (err) {
                        console.error(`[/update] Badge check failed for ${id}:`, err.message);
                    }
                } else if (type === 'gamepass') {
                    try {
                        const res = await axios.get(`https://inventory.roblox.com/v1/users/${robloxId}/items/1/${id}`);
                        if (res.data[0]?.id) rolesToAdd.push(roleId);
                    } catch (err) {
                        console.error(`[/update] Gamepass check failed for ${id}:`, err.message);
                    }
                }
            }

            // Perform role additions and removals safely
            const rolesAdded = [];
            const rolesRemoved = [];

            // Bot's highest role position
            const botMember = interaction.guild.members.me;
            const botHighestPos = botMember?.roles?.highest?.position ?? 0;

            // Add roles the user qualifies for
            for (const roleId of rolesToAdd) {
                try {
                    if (!interaction.member.roles.cache.has(roleId)) {
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (role) {
                            await interaction.member.roles.add(roleId);
                            rolesAdded.push(roleId);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to add role ${roleId}:`, err.message || err);
                }
            }

            // Remove managed roles the user no longer qualifies for
            for (const roleId of managedRoles) {
                try {
                    if (interaction.member.roles.cache.has(roleId) && !rolesToAdd.includes(roleId)) {
                        const role = interaction.guild.roles.cache.get(roleId);
                        if (!role || role.position >= botHighestPos) continue;
                        await interaction.member.roles.remove(roleId);
                        rolesRemoved.push(roleId);
                    }
                } catch (err) {
                    console.warn(`Failed to remove role ${roleId}:`, err.message || err);
                }
            }

            // Generate verification image
            let userImage;
            try {
                const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxId}&size=352x352&format=Png&isCircular=true`);
                userImage = res.data?.data?.[0]?.imageUrl || null;
            } catch (err) {
                console.error('[/update] Failed to fetch Roblox avatar:', err.message);
            }

            const avatarURL = interaction.member.displayAvatarURL({ dynamic: true, size: 1024 }).replace('.webp', '.jpg');
            
            const drawResult = await drawImage(avatarURL, userImage);
            let verificationBuffer = null;
            let generatedPath = null;
            
            if (drawResult && typeof drawResult === 'object') {
                verificationBuffer = drawResult.buffer || null;
                generatedPath = drawResult.tempFilePath || null;
            } else if (Buffer.isBuffer(drawResult)) {
                verificationBuffer = drawResult;
            }

            let tempFilePath = null;

            // Prefer the path written by drawImage
            if (generatedPath) {
                tempFilePath = generatedPath;
            } else if (verificationBuffer && Buffer.isBuffer(verificationBuffer) && verificationBuffer.length > 0) {
                try {
                    const tempDir = path.join(__dirname, '../../temp');
                    await fs.promises.mkdir(tempDir, { recursive: true });
                    const userIdKey = String(interaction.user.id);
                    const files = await fs.promises.readdir(tempDir).catch(() => []);
                    const used = new Set();
                    for (const f of files) {
                        const m = f.match(new RegExp(`^update-${userIdKey}-(\\d+)\\.png$`));
                        if (m) used.add(parseInt(m[1], 10));
                    }
                    let nextIndex = 1;
                    while (used.has(nextIndex)) nextIndex++;
                    tempFilePath = path.join(tempDir, `update-${userIdKey}-${nextIndex}.png`);
                    await fs.promises.writeFile(tempFilePath, verificationBuffer);
                } catch (err) {
                    console.warn('[/update] Failed to write verification image:', err?.message || err);
                    tempFilePath = null;
                }
            } else {
                console.warn('[/update] Verification image invalid or empty; skipping attachment.');
            }

            // Build final embed
            embed.setDescription(`Roles Updated Successfully! ${emoji.FormattedEmoji.NovaCheck2}`)
                .setColor(0x00FF00)
                .addFields(
                    { name: `**Roles Added (${rolesAdded.length})**`, value: rolesAdded.length ? rolesAdded.map(r => `<@&${r}>`).join(', ') : '*None*', inline: true },
                    { name: `**Roles Removed (${rolesRemoved.length})**`, value: rolesRemoved.length ? rolesRemoved.map(r => `<@&${r}>`).join(', ') : '*None*', inline: true }
                );

            let attachmentName = null;
            if (tempFilePath) {
                if (!path.isAbsolute(tempFilePath)) tempFilePath = path.join(__dirname, '../../temp', tempFilePath);
                attachmentName = path.basename(tempFilePath);
                embed.setImage(`attachment://${attachmentName}`);
            }

            // Send the reply with attachment
            try {
                const options = { embeds: [embed] };
                
                if (tempFilePath) {
                    try {
                        const exists = fs.existsSync(tempFilePath);
                        const stats = exists ? fs.statSync(tempFilePath) : null;
                        console.log(`[/update] Attaching file ${tempFilePath} (exists=${exists}, size=${stats?.size || 'n/a'})`);
                        
                        const attachment = new AttachmentBuilder(tempFilePath, { name: attachmentName });
                        options.files = [attachment];
                    } catch (fileErr) {
                        console.warn('[/update] Failed to prepare image for upload:', fileErr?.message || fileErr);
                        options.files = undefined;
                    }
                }

                const resp = await interaction.editReply(options);
                
                // Cleanup temp file (commented out for debugging)
                if (tempFilePath) {
                    try {
                        await fs.promises.unlink(tempFilePath);
                    } catch (delErr) {
                        console.warn('[/update] Failed to delete temp file:', delErr?.message || delErr);
                    }
                }
                
                return resp;
            } catch (err) {
                console.error('[/update] Failed to send reply:', err?.message || err);
                
                // Fallback without image
                try {
                    await interaction.editReply({ 
                        embeds: [embed.setImage(null)],
                        files: []
                    });
                } catch (inner) {
                    console.error('[/update] Failed to recover:', inner?.message || inner);
                }
                
                // Cleanup on error
                if (tempFilePath) {
                    try {
                        await fs.promises.unlink(tempFilePath);
                    } catch (delErr) {
                        console.warn('[/update] Failed to delete temp file after error:', delErr?.message || delErr);
                    }
                }
                
                return null;
            }
        } catch (error) {
            console.error('[/update] Error:', error);
            embed.setTitle(`${emoji.FormattedEmoji.NovaFailure} An Error Occurred`)
                .setColor(0xFF0000)
                .setDescription(`An error occurred while updating your roles.\n**Error (*Report this to Nirmini*)**:\n\`\`\`\n${error}\n\`\`\``);
            
            if (!interaction.replied && !interaction.deferred) {
                return interaction.reply({ embeds: [embed] });
            } else {
                return interaction.editReply({ embeds: [embed] }).catch(() => 
                    interaction.followUp({ embeds: [embed] })
                );
            }
        }
    },
};