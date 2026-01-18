const { PermissionsBitField, MessageFlags, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const noblox = require('noblox.js');
const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const { getUserData, setUserData, getGuildConfig } = require('../src/Database');
const { drawImage } = require('../src/services/verificationimages');
const emoji = require('../emoji.json');

module.exports = {
    id: '0000021',

    /**
     * Executes the ?verify command to initiate verification.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    execute: async (message) => {
        const embed = new EmbedBuilder()
            .setTitle('Nova Verification')
            .setColor(0x5865F2)
            .setTimestamp();

        try {
            const existingUserData = await getUserData(message.author.id, "Roblox");

            if (existingUserData) {
                embed.setDescription(
                    `You are already verified as **${existingUserData.username}**.\n` +
                    `If you want to re-verify, use \`?verify recheck\`.`
                ).setColor(0xFFA500);
                return message.reply({ embeds: [embed] });
            }

            embed.setDescription(
                `To verify with Nova, please visit [__this website__](https://nirmini.dev/Nova/Auth/Roblox) and follow the on-screen instructions.\n\n` +
                `Once you've verified on the website, use \`?verify check\` to complete the process.`
            ).setFooter({ text: `Nova Verification` });

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[?verify] Error:', error);
            embed.setTitle(`${emoji.FormattedEmoji.NovaFailure} An Error Occurred`)
                .setColor(0xFF0000)
                .setDescription(`An error occurred during verification.\n**Error**:\n\`\`\`\n${error.message}\n\`\`\``);
            return message.reply({ embeds: [embed] });
        }
    },

    /**
     * Handles the `?verify check` command to complete verification.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    check: async (message) => {
        const embed = new EmbedBuilder()
            .setTitle('Nova Verification')
            .setColor(0x5865F2)
            .setTimestamp();

        try {
            const verificationUserData = await getUserData(message.author.id, "Roblox");
            if (!verificationUserData) {
                embed.setDescription(`You have not verified on the website yet. Please visit [__this website__](https://nirmini.dev/Nova/Auth/Roblox) first.`)
                    .setColor(0xFF0000);
                return message.reply({ embeds: [embed] });
            }

            const guildRobloxConfig = await getGuildConfig(message.guild.id, 'roblox') || {};
            const guildVerificationConfig = guildRobloxConfig.verify_username || 'default';

            // Safely set nickname without blocking
            try {
                const botMember = message.guild.members.me;
                const botHighestPos = botMember?.roles?.highest?.position ?? 0;
                const targetHighestPos = message.member.roles?.highest?.position ?? 0;
                const isOwner = message.guild.ownerId === message.author.id;
                const hasManageNick = typeof botMember?.permissions?.has === 'function' ? botMember.permissions.has(PermissionsBitField.Flags.ManageNicknames) : false;
                const canSetNick = hasManageNick && (botHighestPos > targetHighestPos) && !isOwner;

                switch (guildVerificationConfig) {
                    case 'default':
                    case 'roblox-name':
                        if (canSetNick) {
                            message.member.setNickname(verificationUserData.username).catch(err => {
                                console.warn(`Cannot set nickname for ${message.author.tag}:`, err.message);
                            });
                        }
                        break;
                    case 'display-name':
                        if (canSetNick) {
                            message.member.setNickname(verificationUserData.nickname).catch(err => {
                                console.warn(`Cannot set nickname for ${message.author.tag}:`, err.message);
                            });
                        }
                        break;
                    case 'smart-name':
                        if (canSetNick) {
                            message.member.setNickname(`${verificationUserData.nickname}(@${verificationUserData.username})`).catch(err => {
                                console.warn(`Cannot set nickname for ${message.author.tag}:`, err.message);
                            });
                        }
                        break;
                    case 'roblox-id':
                        if (canSetNick) {
                            message.member.setNickname(verificationUserData.userId.toString()).catch(err => {
                                console.warn(`Cannot set nickname for ${message.author.tag}:`, err.message);
                            });
                        }
                        break;
                    case 'disabled':
                    default:
                        break;
                }
            } catch (err) {
                console.warn(`Nickname update failed for ${message.author.tag}:`, err.message);
            }

            // Role updates via binds
            const binds = (await getGuildConfig(message.guild.id, 'Binds')) || [];
            const rolesToAdd = [];
            const managedRoles = new Set();

            for (const bind of binds) {
                const [typeAndId, minRank, maxRank, roleId] = bind.split(',');
                const [type, id] = typeAndId.split(':');
                if (roleId) managedRoles.add(roleId);

                if (type === 'group') {
                    const rank = await noblox.getRankInGroup(parseInt(id), verificationUserData.userId);
                    if (rank >= parseInt(minRank) && rank <= parseInt(maxRank)) {
                        rolesToAdd.push(roleId);
                    }
                } else if (type === 'badge') {
                    try {
                        const res = await axios.get(`https://badges.roblox.com/v1/users/${verificationUserData.userId}/badges/${id}/awarded-date`);
                        if (res.data.awardedDate) rolesToAdd.push(roleId);
                    } catch (err) {
                        console.error(`[?verify check] Badge check failed for ${id}:`, err.message);
                    }
                } else if (type === 'gamepass') {
                    try {
                        const res = await axios.get(`https://inventory.roblox.com/v1/users/${verificationUserData.userId}/items/1/${id}`);
                        if (res.data[0]?.id) rolesToAdd.push(roleId);
                    } catch (err) {
                        console.error(`[?verify check] Gamepass check failed for ${id}:`, err.message);
                    }
                }
            }

            const rolesAdded = [];
            const rolesRemoved = [];
            const botMember = message.guild.members.me;
            const botHighestPos = botMember?.roles?.highest?.position ?? 0;

            // Add roles
            for (const roleId of rolesToAdd) {
                try {
                    if (!message.member.roles.cache.has(roleId)) {
                        const role = message.guild.roles.cache.get(roleId);
                        if (role) {
                            await message.member.roles.add(roleId);
                            rolesAdded.push(roleId);
                        }
                    }
                } catch (err) {
                    console.warn(`Failed to add role ${roleId}:`, err.message || err);
                }
            }

            // Remove managed roles no longer qualifying for
            for (const roleId of managedRoles) {
                try {
                    if (message.member.roles.cache.has(roleId) && !rolesToAdd.includes(roleId)) {
                        const role = message.guild.roles.cache.get(roleId);
                        if (!role || role.position >= botHighestPos) continue;
                        await message.member.roles.remove(roleId);
                        rolesRemoved.push(roleId);
                    }
                } catch (err) {
                    console.warn(`Failed to remove role ${roleId}:`, err.message || err);
                }
            }

            // Generate verification image
            let userImage;
            try {
                const res = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${verificationUserData.userId}&size=352x352&format=Png&isCircular=true`);
                userImage = res.data?.data?.[0]?.imageUrl || null;
            } catch (err) {
                console.error('[?verify check] Failed to fetch Roblox avatar:', err.message);
            }

            const avatarURL = message.author.displayAvatarURL({ dynamic: true, size: 1024 }).replace('.webp', '.jpg');

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

            if (generatedPath) {
                tempFilePath = generatedPath;
            } else if (verificationBuffer && Buffer.isBuffer(verificationBuffer) && verificationBuffer.length > 0) {
                try {
                    const tempDir = path.join(__dirname, '../temp');
                    await fs.promises.mkdir(tempDir, { recursive: true });
                    const userIdKey = String(message.author.id);
                    const files = await fs.promises.readdir(tempDir).catch(() => []);
                    const used = new Set();
                    for (const f of files) {
                        const m = f.match(new RegExp(`^verify-${userIdKey}-(\\d+)\\.png$`));
                        if (m) used.add(parseInt(m[1], 10));
                    }
                    let nextIndex = 1;
                    while (used.has(nextIndex)) nextIndex++;
                    tempFilePath = path.join(tempDir, `verify-${userIdKey}-${nextIndex}.png`);
                    await fs.promises.writeFile(tempFilePath, verificationBuffer);
                } catch (err) {
                    console.warn('[?verify check] Failed to write verification image:', err?.message || err);
                    tempFilePath = null;
                }
            }

            // Build final embed
            embed.setDescription(`Verification & Role Update completed! See details below. ${emoji.FormattedEmoji.NovaCheck2}`)
                .setColor(0x00FF00)
                .addFields(
                    { name: `**Roles Added (${rolesAdded.length})**`, value: rolesAdded.length ? rolesAdded.map(r => `<@&${r}>`).join(', ') : '*None*', inline: true },
                    { name: `**Roles Removed (${rolesRemoved.length})**`, value: rolesRemoved.length ? rolesRemoved.map(r => `<@&${r}>`).join(', ') : '*None*', inline: true }
                );

            let attachmentName = null;
            if (tempFilePath) {
                if (!path.isAbsolute(tempFilePath)) tempFilePath = path.join(__dirname, '../temp', tempFilePath);
                attachmentName = path.basename(tempFilePath);
                embed.setImage(`attachment://${attachmentName}`);
            }

            try {
                const options = { embeds: [embed] };

                if (tempFilePath) {
                    try {
                        const exists = fs.existsSync(tempFilePath);
                        const stats = exists ? fs.statSync(tempFilePath) : null;
                        console.log(`[?verify check] Attaching file ${tempFilePath} (exists=${exists}, size=${stats?.size || 'n/a'})`);

                        const attachment = new AttachmentBuilder(tempFilePath, { name: attachmentName });
                        options.files = [attachment];
                    } catch (fileErr) {
                        console.warn('[?verify check] Failed to prepare image for upload:', fileErr?.message || fileErr);
                        options.files = undefined;
                    }
                }

                const resp = await message.reply(options);

                // Cleanup temp file
                if (tempFilePath) {
                    try {
                        await fs.promises.unlink(tempFilePath);
                    } catch (delErr) {
                        console.warn('[?verify check] Failed to delete temp file:', delErr?.message || delErr);
                    }
                }

                return resp;
            } catch (err) {
                console.error('[?verify check] Failed to send reply:', err?.message || err);

                // Fallback without image
                try {
                    embed.setImage(null);
                    await message.reply({ embeds: [embed] });
                } catch (inner) {
                    console.error('[?verify check] Failed to recover:', inner?.message || inner);
                }

                if (tempFilePath) {
                    try {
                        await fs.promises.unlink(tempFilePath);
                    } catch (delErr) {
                        console.warn('[?verify check] Failed to delete temp file after error:', delErr?.message || delErr);
                    }
                }

                return null;
            }
        } catch (error) {
            console.error('[?verify check] Error:', error);
            embed.setTitle(`${emoji.FormattedEmoji.NovaFailure} An Error Occurred`)
                .setColor(0xFF0000)
                .setDescription(`An error occurred while completing verification.\n**Error**:\n\`\`\`\n${error.message}\n\`\`\``);
            return message.reply({ embeds: [embed] });
        }
    },

    /**
     * Handles the `?verify recheck` command to re-verify a user.
     * @param {import('discord.js').Message} message - The message object from Discord.js.
     */
    recheck: async (message) => {
        const embed = new EmbedBuilder()
            .setTitle('Nova Re-verification')
            .setColor(0x5865F2)
            .setTimestamp();

        try {
            embed.setDescription(
                `To re-verify with Nova, please visit [__this website__](https://nirmini.dev/Nova/Auth/Roblox) and follow the on-screen instructions.\n\n` +
                `Once you've re-verified on the website, use \`?verify check\` to complete the process.`
            ).setFooter({ text: `Nova Re-verification` });

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[?verify recheck] Error:', error);
            embed.setTitle(`${emoji.FormattedEmoji.NovaFailure} An Error Occurred`)
                .setColor(0xFF0000)
                .setDescription(`An error occurred during re-verification.\n**Error**:\n\`\`\`\n${error.message}\n\`\`\``);
            return message.reply({ embeds: [embed] });
        }
    },
};
