const { MediaGalleryBuilder, 
    MediaGalleryItemBuilder, 
    SeparatorBuilder, 
    SeparatorSpacingSize, 
    TextDisplayBuilder, 
    ContainerBuilder,
    ActionRowBuilder,
    AttachmentBuilder,
    SlashCommandBuilder,
    PermissionsBitField,
    EmbedBuilder,
    MessageFlags,
    WebhookClient,
} = require('discord.js');

const devPerms = require('../../devperms.json');

const image1 = new AttachmentBuilder(`./Icos/banners/Nirmini.png`, { name: 'Nirmini.png' });
const image2 = new AttachmentBuilder(`./Icos/banners/Rules.png`, { name: 'Rules.png' });
const image3 = new AttachmentBuilder(`./Icos/banners/Values.png`, { name: 'Values.png' });
const image4 = new AttachmentBuilder(`./Icos/banners/Roles.png`, { name: 'Roles.png' });
const image5 = new AttachmentBuilder(`./Icos/banners/Info.png`, { name: 'Info.png' });
const image6 = new AttachmentBuilder(`./Icos/banners/StarlightMedia.png`, { name: 'StarlightMedia.png' });
const image7 = new AttachmentBuilder(`./Icos/banners/Safety.png`, { name: 'Safety.png' });
const image8 = new AttachmentBuilder(`./Icos/banners/Verify.png`, { name: 'Verify.png' });

// Map images to their attachment URLs
const imageUrls = [
    'attachment://Nirmini.png',
    'attachment://Rules.png',
    'attachment://Values.png',
    'attachment://Roles.png',
    'attachment://Info.png',
    'attachment://StarlightMedia.png',
    'attachment://Safety.png',
    'attachment://Verify.png',
];

// Component 1: Nirmini Logo
const component1 = new ContainerBuilder()
    .setAccentColor(14250714)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[0])
                .setDescription("Nirmini Logo and Text")
            )
    )
    .addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("This is a collection of Nirmini's Rules, Values, Roles, about us, and other information. Please report any issues to KitKatt. Last edited on `December 15th, 2025`.")
    );

// Component 2: Rules
const component2 = new ContainerBuilder()
    .setAccentColor(11170522)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[1])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("### We're glad to have you here! Please read the rules below to be aware of what we expect of you.\n **These apply to __ALL__ users throughout the group, regardless of rank.**\n​\n- [1] Follow the [Discord Terms of Service & Guidelines](https://discord.com/guidelines). (Be 13+, keep it civil, etc.)\n- [2] Stay Mostly Family-Friendly - This is not a Discord for NSFW/NSFL, Political/Religious Discussions, E-Dating, or even Roleplay. This includes usernames and PFPs. \n- Watch your behavior in public channels - This includes but is not limited to, harassment, bullying, fighting, discrimination, sensitive content, slurs, trauma dumping, doxing, elitism, and similar acts. (Including witch hunting)\n- Don't excessively spam\n- No Mini Modding - We have moderators for a reason.")
    );

// Component 3: Values
const component3 = new ContainerBuilder()
    .setAccentColor(11170522)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[2])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(" ​## Nirmini Group Values\n- **Respect towards peers** - We're here with a common interest, that doesn't make people better or worse than others.\n- **Kindness among peers** - This doesn't take much but makes it a much more uplifting place.\n- **Patience towards peers** - Things take time to do and sometimes it may not be a great time. \n\n## Nirmini Staff Values\n- **Curiosity** - When we are curious, we innovate\n- **Trust** - When we trust each other, we work better together\n- **Transparency** - When we are transparent we improve our work more\n- **Reliability** - When we are reliable we can always strive for our best and reach it.\n- **Excellence** - When we are excellent in what we do, we can make better work more often.\n- **Unity** - When we are united we are able to rapidly improve ideas and concepts, work more efficiently, work better, and communicate better.")
    );

// Component 4: Roles Part 1
const component4 = new ContainerBuilder()
    .setAccentColor(7503066)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[3])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Publicly obtainable roles:\n\n- <@&1225146722947436717>: Unpaid Intern: This is a default role for users that have not yet verified. Run `/verify` to remove this role!\n\n- <@&1225146642806603838>: Employee: Standard role for verified users that are part of the Nirmini Roblox group.\n\n- <@&1227384407313223772>: Supervisor: Application-assigned role for passing a supervisor application. Employee is required.\n\n- <@&1226397427108417586>: Corporate: Application-assigned role for passing a corporate application. Supervisor is required.\n\n- <@&1228492127508627619>: Recognized Community Member (RCM): *It's in the name*\n\n- <@&1261919539302502451>: Affiliate Representative: Representatives for a Nirmini affiliate group/community.\n\n- <@&1396614362218889407>: Advisor: Unused role used when outside opinions are needed.\n\n- <@&1259318878832558100>: Contractor: Contributed in a meaningful and/or lasting way to a Nirmini project.\n\n- <@&1378868730314100898>: Workshop Instructor: Nirmini Workshop instructors that have been approved by Nirmini's staff team.")
    );

// Component 5: Roles Part 2
const component5 = new ContainerBuilder()
    .setAccentColor(7503066)
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Staff Roles:\n\n- <@&1257906093145849916>: Starlight Media: Staff members of Nirmini's Media division, Starlight Media.\n\n- <@&1405245390030242002>: Board of Management: Unused role that was previously used for subgroup managers.\n\n- <@&1225145755241812018>: Moderators: Nirmini's Moderation team, other staff technically also include this.\n\n- <@&1368705926382747748>: Supporting Developers: Developers that don't directly interact with Studio or Github but still develop. (Ex: Artists, Modeling, QA Testing, ETC)\n\n- <@&1227384560879145042>: Developers: Developers are those who work inside of Studio or Github to program or build a given thing. (Ex: Devs, Builders, ETC)\n\n- <@&1225145680520282112>: Founder: The Founder and Director of Nirmini alongside the manager of all department operations.")
    );

// Component 6: Roles Part 3
const component6 = new ContainerBuilder()
    .setAccentColor(7503066)
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Other Roles:\n\n- <@&1272385449096384675>: Polls: Notifications about any Polls for NRC, Nova, etc.\n\n- <@&1287914615795093585>: Misc Pings: Additional pings or pings that don't fit another category\n\n- <@&1291957548479549500>: Server Changes: Discord Server Changes\n\n- <@&1286825270405365782>: Community Events: Notification for when community events such as gamenights and giveaways are hosted.\n\n- <@&1259683123633979403>: Dev Streams: Development Livestream notifications for any Nirmini project.\n\n- <@&1364751554111864902>: Nova Patchnotes: Role ping for Nova patchnotes\n\n- <@&1242993427906297966>: Sneak Peak: Sneak-peaks or early in-development showcase pings.\n\n- <@&1378868442362286161>: Workshop Ping: Get notified when a workshop is being hosted.\n\n- <@&1333207822686617751>: Game Patchnotes: Patchnotes for game projects.\n\n- <@&1404327169814958131>: Inactive Staff: Inactive Staff members\n\n- <@&1445613362229674034>: Images: Permission override to send images for select members only.")
    );

// Component 7: About Nirmini
const component7 = new ContainerBuilder()
    .setAccentColor(7519706)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[4])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("### ***Nirmini's mission is to create games and tools/services made for everyone to use and enjoy and to empower others with our various programs as an indie not-for-profit group.***\nWe make Nova to empower Discord and Roblox moderators to easily manage their games without needing big, bulky, or obsolete tools. NRC to allow players to experience multiple endings while being able to do nearly anything they want. And other concepts like Nirmini Studio or Nirmini For Education to allow developers to develop UI for Roblox faster, and to allow for people to learn skills they may be interested in. The same skills that power what we do at Nirmini. *(As a not-for-profit it means that profit isn't our only goal, that being said, not going into debt is also pretty nice)*")
    )
    .addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Here's a list of our current projects,\n> - Nova: A multipurpose Discord bot and moderation platform designed for productivity across platforms as well as ease of use.\n>    - Novabot: The Discord bot side of Nova\n>    - Novaworks: The Nova DevTools and Roblox Integration\n>    - NovaAPI: Nova's API for applications to work with Nova.\n> - Nirmini Research Complex (ROBLOX): A Roblox Sci-Fi game set in 203X.")
    );

// Component 8: Groups & Staff
const component8 = new ContainerBuilder()
    .setAccentColor(7519706)
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Our Groups:\n> - Nirmini \n>    - Nirmini is the group that oversees Nirmini Development/interactive, 735, and more.\n> - Nirmini Interactive\n>    - Nirmini Interactive is Nirmini's group responsible for publishing as well as some contracting work that's passed on to the dev group.\n> - Nirmini Development\n>    - Nirmini Development mostly handles the development and maintenance of Nirmini's various projects.\n> - 735 Industries\n>    - Group founded in 2024 that focuses on indie full-stack web development. Now a part of Nirmini Development.\n> - TBA")
    )
    .addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Our Staff:\n> - Leadership\n>    - <@600464355917692952> - Nirmini Founder & Director\n> - Developers\n>    - <@999151707281956864> - Supporting Developer (QA Tester)\n>    - <@1019067620114321518> - Supporting Developer (Modeling)\n> - Moderators\n>    - N/A")
    );

// Component 9: Starlight Media
const component9 = new ContainerBuilder()
    .setAccentColor(7527094)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[5])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("Starlight Media is a division within Nirmini that is responsible for creating all of Nirmini's short films, trailers, some teasers, and the hosting/management of Nirmini's events.\n\nProductions from Starlight Media (or SLM for short) are overseen by Nirmini's Engineering & Development Division to ensure that short films stay accurate to stories and that technical hurdles are minimized.\n\nWant to see examples of what we do in Starlight Media? We'll post to https://ptb.discord.com/channels/1225142849922928661/1271570966207660042 for most releases or https://ptb.discord.com/channels/1225142849922928661/1335474567954825276 should things go wrong.")
    );

// Component 10: Safety & Moderation
const component10 = new ContainerBuilder()
    .setAccentColor(7527032)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[6])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("Our goal with Nirmini is to foster a community that is positive, constructive, and purposeful. That being said there are instances where users may need to be moderated or outright removed. Here's how Nirmini's Reporting and Appeals process(es) work.\n\n## Appeals\nFor moderation appeals, the user must be able to show that they have either changed or that the moderation was invalid. Users may only claim moderation was invalid once per reason. Rewording the same reason counts as the same reason. Exact details regarding appeals vary by the type so please, **pay attention to the information given in the ticket message**.")
    );

// Component 11: Reports
const component11 = new ContainerBuilder()
    .setAccentColor(7527032)
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("## Reports\n- **Nirmini will not act on reports without evidence.** As this would lead to false reports and harassment of individuals alongside general outcry from the wider community. Nirmini requires that all reports contain evidence of the given offense in the form of a photo/screenshot or recording/video.\n- **Nirmini will continue contact with reporters.** This is done to keep the original reporter aware of the process that their report is going through. Reports may not be contacted by Nirmini if the report is found to be false. Reports can generally expect notification of changes in parts of a case as well as whether it was accepted or denied.\n- **Nirmini does accept reports of misconduct in other servers.** But also requires more insurmountable evidence that the user poses a threat or risk to Nirmini or our community. As we don't have access to other servers, evidence generally needs to include context and be thorough in detail.")
    );

// Component 12: Verification
const component12 = new ContainerBuilder()
    .setAccentColor(14337650)
    .addMediaGalleryComponents(
        new MediaGalleryBuilder()
            .addItems(new MediaGalleryItemBuilder()
                .setURL(imageUrls[7])
            )
    )
    .addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent("Want to join in on the fun? To prevent various types of annoyances from taking please we require members to verify via Nova in https://ptb.discord.com/channels/1225142849922928661/1226404907796398163. Have any questions about verification? Feel free to check out https://ptb.discord.com/channels/1225142849922928661/1331047949152686200 or ping a staff member for assistance!\n\nThen welcome to the club and we hope you like it here!")
    );

module.exports = {
    id: '1000011',
    data: new SlashCommandBuilder()
        .setName('zrules')
        .setDescription('Sends Nirmini\'s rules to a specified channel.'),

    async execute(interaction) {
        const embed = new EmbedBuilder();

        // Permission check
        const userPerm = devPerms.usermap.find(u => u.userid === interaction.user.id);
        if (!userPerm || userPerm.level <= 100) {
            embed.setColor(0xff0000);
            embed.setTitle('You do not have permission to use this command.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        // CRITICAL: Defer the reply immediately to prevent timeout
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const webhook = new WebhookClient({ url: "https://ptb.discord.com/api/webhooks/1450280774866567330/WHsfz4EwEzLzqfBvg_NfhXLcG2F9I1A_US_vNWSGBxM5Y4k0toTk22a_h9BnX_yhnvek"});

            // Send messages with delay to avoid rate limits
            await webhook.send({
                files: [image1, image2],
                components: [component1, component2],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                files: [image3],
                components: [component3],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                files: [image4],
                components: [component4, component5],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                components: [component6],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                files: [image5],
                components: [component7, component8],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                files: [image6],
                components: [component9],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                files: [image7],
                components: [component10, component11],
                flags: MessageFlags.IsComponentsV2,
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            await webhook.send({
                files: [image8],
                components: [component12],
                flags: MessageFlags.IsComponentsV2,
            });

            embed.setColor(0x00aa00);
            embed.setTitle('✅ Rules Sent');
            embed.setDescription(`Rules have been sent via webhook in 8 messages.`);
            return interaction.editReply({ embeds: [embed] });
        } catch (webhookError) {
            console.error('Webhook error, falling back to bot send:', webhookError);
            try {
                const guild = interaction.client.guilds.cache.get('1225142849922928661');
                if (!guild) throw new Error('Guild not found');
                
                const channel = guild.channels.cache.get('1225148889389203557');
                if (!channel) throw new Error('Channel not found');

                // Send via bot with same split and delays
                await channel.send({
                    files: [image1, image2],
                    components: [component1, component2],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    files: [image3],
                    components: [component3],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    files: [image4],
                    components: [component4, component5],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    components: [component6],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    files: [image5],
                    components: [component7, component8],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    files: [image6],
                    components: [component9],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    files: [image7],
                    components: [component10, component11],
                    flags: MessageFlags.IsComponentsV2,
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                await channel.send({
                    files: [image8],
                    components: [component12],
                    flags: MessageFlags.IsComponentsV2,
                });

                embed.setColor(0x00aa00);
                embed.setTitle('✅ Rules Sent');
                embed.setDescription(`Rules have been sent to the channel via bot in 8 messages.`);
                return interaction.editReply({ embeds: [embed] });
            } catch (botError) {
                console.error('Bot send error:', botError);
                embed.setColor(0xff0000);
                embed.setTitle('❌ Error');
                embed.setDescription(`Failed to send the rules. Error: ${botError.message}`);
                return interaction.editReply({ embeds: [embed] });
            }
        }
    },
};