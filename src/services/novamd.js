// /src/services/novamd.js
// Parses and converts NovaMD → DiscordMD

const { EmbedBuilder } = require("discord.js");

function parseNovaMD(raw) {
    // preserve line breaks
    const lines = raw.split(/\r?\n/);

    let embeds = [];
    let current = {};

    for (let line of lines) {
        // matches e.g. 1t, 2a, 3f, etc.
        const match = line.match(/^(\d)([a-zA-Z])\s*[:>]\s*(.*)$/);
        if (!match) continue;

        const embedIndex = Number(match[1]);
        const code = match[2];
        const value = match[3];

        if (!embeds[embedIndex]) embeds[embedIndex] = {};

        switch (code) {
            case "t": embeds[embedIndex].title = value; break;
            case "a": embeds[embedIndex].author = value; break;
            case "d": embeds[embedIndex].description = (embeds[embedIndex].description || "") + value + "\n"; break;
            case "f": {
                const [key, val] = value.split("|").map(v => v.trim());
                if (!embeds[embedIndex].fields) embeds[embedIndex].fields = [];
                embeds[embedIndex].fields.push({ name: key, value: val, inline: false });
                break;
            }
            case "l": embeds[embedIndex].url = value; break;
            case "c": embeds[embedIndex].color = value; break;
            case "i": embeds[embedIndex].image = value; break;
            case "j": embeds[embedIndex].inlineStart = true; break;
            case "h": embeds[embedIndex].inlineEnd = true; break;
            case "T": embeds[embedIndex].footer = value; break;
        }
    }

    // keep only 0–4 (max five embeds)
    return embeds.slice(0, 5).filter(e => e);
}

function buildEmbed(config) {
    const embed = new EmbedBuilder();

    if (config.title) embed.setTitle(config.title);
    if (config.author) embed.setAuthor({ name: config.author });
    if (config.url) embed.setURL(config.url);
    if (config.color) embed.setColor(config.color);

    if (config.description)
        embed.setDescription(applyTextDecorators(config.description.trim()));

    if (config.fields && config.fields.length > 0) {
        let processedFields = config.fields;

        if (config.inlineStart) {
            processedFields = processedFields.map(f => ({ ...f, inline: true }));
        }

        if (config.inlineEnd) {
            processedFields = processedFields.map(f => ({ ...f, inline: true }));
        }

        embed.addFields(processedFields);
    }

    if (config.footer)
        embed.setFooter({ text: applyTextDecorators(config.footer) });

    if (config.image)
        embed.setImage(config.image);

    return embed;
}

function parityCheck(embeds) {
    return embeds.every(e => e instanceof EmbedBuilder);
}

// applies NovaMD → DiscordMD inline text decorators
function applyTextDecorators(text) {
    return text
        .replace(/\*\*\*(.*?)\*\*\*/g, "***$1***") // bold italics
        .replace(/\*\*(.*?)\*\*/g, "**$1**")        // bold
        .replace(/\*(.*?)\*/g, "*$1*")              // italics
        .replace(/__(.*?)__/g, "__$1__")            // underline
        .replace(/~~(.*?)~~/g, "~~$1~~")           // strikethrough
        .replace(/ts:(.*)$/gm, "-# $1")
        .replace(/tm:(.*)$/gm, "### $1")
        .replace(/tb:(.*)$/gm, "## $1")
        .replace(/tl:(.*)$/gm, "# $1")
        .replace(/tn:(.*)$/gm, "$1");
}

function ConvertNMD(content) {
    const parsed = parseNovaMD(content);
    const embeds = parsed.map(cfg => buildEmbed(cfg));

    if (!parityCheck(embeds)) {
        throw new Error("NovaMD parity check failed.");
    }

    return embeds;
}

module.exports = { ConvertNMD };
