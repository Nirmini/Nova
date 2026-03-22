const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const imageRefMap = [
    { chance: 90, location: "../../Icos/VerificationImgs/VerificationMain.png" },
    { chance: 7, location: "../../Icos/VerificationImgs/VerificationGradient.png" },
    { chance: 3, location: "../../Icos/VerificationImgs/VerificationAlt.png" },
];

/*
EXAMPLE USAGE:
const userImageReq = axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${verificationUserData.userId}&size=100x100&format=Png&isCircular=true`)
.then(res => {
    if (!res.data[0]) return false;
    userImage = res.data[0].imageUrl
})
.catch(err => {
    console.error(err);
})
const avatarURL = interaction.user.displayAvatarURL({ dynamic: true, size: 1024 });
const avatarURLPNG = avatarURL.replace('.webp', '.jpg');
const verificationUpdateImage = await drawImage(avatarURLPNG, userImage);
*/

/*
VERIFICATION IMAGE GEN STUFF
The base images all utilize the same formatting to ensure that the images overlayed match up with the background.

Roblox Avatar Headshow Image: LEFT (Roblox size will not be exact to required size and will need to be resized)
> Image X: 117.1304 px
> Image Y: 94.4348 px
> Image W: 261.3913 px
> Image H: 261.3913 px

Discord PFP Image: RIGHT (Discord size will not be exact to required size and will need to be resized)
> Image X: 521.5312 px
> Image Y: 94.4152 px
> Image W: 261.3913 px
> Image H: 261.3913 px

*/

function print(content) {
    console.log(`[VerifIMG]: ${content}`);
}


// weighted RNG picker
function pickBackground() {
    print(`Rolling BG`)
    const roll = Math.random() * 100;
    let sum = 0;
    for (const entry of imageRefMap) {
        sum += Number(entry.chance) || 0;
        if (roll <= sum) return entry.location;
    }
    return imageRefMap[0].location;
}

/**
 * Draw a verification image.
 * @param {discordURL} string
 * @param {robloxURL} string
 */
async function drawImage(discordPFP, robloxAvatar) {
    print(`Drawimage triggered`)

    // fetch remote image to buffer with axios
    async function fetchImageBuffer(url) {
        try {
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            return Buffer.from(res.data);
        } catch (err) {
            print(`Failed to fetch ${url}: ${err.message}`);
            return null;
        }
    }

    // safe loadImage supporting remote URLs and local paths (no timeouts)
    async function safeLoadImage(src) {
        if (!src) return null;
        const isRemote = typeof src === 'string' && src.startsWith('http');
        if (isRemote) {
            const buf = await fetchImageBuffer(src);
            if (!buf) return null;
            try {
                return await loadImage(buf);
            } catch (err) {
                print(`loadImage(buffer) failed for ${src}: ${err.message}`);
                return null;
            }
        }

        try {
            return await loadImage(path.join(__dirname, src));
        } catch (err) {
            print(`loadImage(local) failed for ${src}: ${err.message}`);
            return null;
        }
    }

    // Pick and load background (local)
    const bgFolder = pickBackground();
    const bg = await safeLoadImage(bgFolder);
    if (!bg) throw new Error('Unable to load background image');

    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bg, 0, 0);

    print(`Got background`);

    // Load Roblox avatar (optional)
    if (robloxAvatar) {
        const rbImg = await safeLoadImage(robloxAvatar);
        if (rbImg) {
            try {
                const RB_X = 117.1304;
                const RB_Y = 94.4348;
                const RB_W = 261.3913;
                const RB_H = 261.3913;
                ctx.drawImage(rbImg, RB_X, RB_Y, RB_W, RB_H);
                print(`Added Roblox Avatar`);
            } catch (err) {
                print(`Failed drawing Roblox avatar: ${err.message}`);
            }
        } else {
            print(`Skipping Roblox avatar (failed to load)`);
        }
    } else {
        print(`No Roblox avatar provided or out of time`);
    }

    if (discordPFP) {
        const pfp = await safeLoadImage(discordPFP);
        if (pfp) {
            try {
                const PFP_X = 521.5312;
                const PFP_Y = 94.4152;
                const PFP_W = 261.3913;
                const PFP_H = 261.3913;
                ctx.save();
                ctx.beginPath();
                ctx.arc(
                    PFP_X + PFP_W / 2,
                    PFP_Y + PFP_H / 2,
                    Math.min(PFP_W, PFP_H) / 2,
                    0,
                    Math.PI * 2
                );
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(pfp, PFP_X, PFP_Y, PFP_W, PFP_H);
                ctx.restore();
                print(`Added Discord PFP`);
            } catch (err) {
                print(`Failed drawing Discord PFP: ${err.message}`);
            }
        } else {
            print(`Skipping Discord PFP (failed to load)`);
        }
    } else {
        print(`No Discord PFP provided or out of time`);
    }

       const outBuf = canvas.toBuffer("image/png");

    // Attempt to write the buffer to ../../temp using incremental filenames (1.png, 2.png, ...)
    try {
        const tempDir = path.join(__dirname, '../../temp');
        await fs.promises.mkdir(tempDir, { recursive: true });

        // Try to extract a Discord user ID from the supplied avatar URL (e.g. /avatars/<id>/...)
        let userIdKey = null;
        if (typeof discordPFP === 'string') {
            const m = discordPFP.match(/avatars\/(\d+)/);
            if (m) userIdKey = m[1];
        }

        // Read existing files and find the highest numeric filename for this user (or fallback)
        const files = await fs.promises.readdir(tempDir).catch(() => []);
        let maxIndex = 0;
        if (userIdKey) {
            for (const f of files) {
                const m = f.match(new RegExp(`^${userIdKey}-(\\d+)\\.png$`));
                if (m) {
                    const n = parseInt(m[1], 10);
                    if (!Number.isNaN(n) && n > maxIndex) maxIndex = n;
                }
            }
        } else {
            for (const f of files) {
                const m = f.match(/^(\d+)\.png$/);
                if (m) {
                    const n = parseInt(m[1], 10);
                    if (!Number.isNaN(n) && n > maxIndex) maxIndex = n;
                }
            }
        }
        const nextIndex = maxIndex + 1;
        const filename = userIdKey ? `${userIdKey}-${nextIndex}.png` : `${nextIndex}.png`;
        const tempFilePath = path.join(tempDir, filename);
        await fs.promises.writeFile(tempFilePath, outBuf);
        print(`Wrote verification image to ${tempFilePath}`);
        return { buffer: outBuf, tempFilePath };
    } catch (err) {
        print(`Failed to write temp verification image: ${err?.message || err}`);
        return { buffer: outBuf, tempFilePath: null };
    }
}

module.exports = { drawImage };