// ./mainapp/launchargs.js [FORK]

/**
 * NOVA LAUNCH ARGUMENTS
 * --dev(-d): Development Mode, Hooks to console.log and forwards logs to a Discord webhook
 * --local(-l): Prefer local configurations over remote configs.
 * --test(-t): Tests connection to Cloudflare (WorkersKV), nirmini.dev, nova.nirmini.dev, Discord's API, and Nirmini's API in addition to running Nova.
 * --disable-sentry(-s): Disables the Sentry plugin module completely.
 * --force-shards(-f): Forces a specific number of shards regardless of the local application configuration(settings.json).
 * --force-port(-p): Forces a specific portname in settings.json to use a port different from the one set in settings.json.
 */

// Changed from using magic numbers cause that would've been a bad idea.

const process = require(`node:process`);

let activeFlags = [];
let flagData = {
    flagName : null,
    flagParam : null,
    flagValue : null,
};

const args = process.argv.slice(2); // Get flags after the run command. (Ex: npm start, node mainapp/mainapp, npm test, etc.)

// DEV flag | UID 29(dev)
const devFlagL = args.find(arg => arg.startsWith(`--dev`));
const devFlagS = args.find(arg => arg.startsWith(`-d`));
if (devFlagL || devFlagS) activeFlags.push('dev'); flagData.flagName = "dev"; // This only relies upon a flag or boolean so no need to write null again for flagData.

// LOCAL flag | UID 48(local)
const localFlagL = args.find(arg => arg.startsWith(`--local`));
const localFlagS = args.find(arg => arg.startsWith(`-l`));
if (localFlagL || localFlagS) activeFlags.push('local');

// TEST flag | UID 92(test)
const testFlagL = args.find(arg => arg.startsWith(`--test`));
const testFlagS = args.find(arg => arg.startsWith(`-t`));
if (testFlagL || testFlagS) activeFlags.push('test');

// DS flag | UID 38(ds)
const dsFlagL = args.find(arg => arg.startsWith(`--disable-sentry`));
const dsFlagS = args.find(arg => arg.startsWith(`-s`));
if (dsFlagL || dsFlagS) activeFlags.push('ds');

// FS flag | UID 17(fs)
const fsFlagL = args.find(arg => arg.startsWith(`--force-shards`));
const fsFlagS = args.find(arg => arg.startsWith(`-f`));
if (fsFlagL || fsFlagS) activeFlags.push('fs');

// FP flag | UID 64(fp)
const fpFlagL = args.find(arg => arg.startsWith(`--force-port`));
const fpFlagS = args.find(arg => arg.startsWith(`-p`));
let fpValue = null;
if (fpFlagL) {
    // Extract data from the flag after the '=' sign
    const parts = fpFlagL.split(`=`);
    if (parts.length > 1) {
        fpValue = parts[1].replace(/['"]/g, ``); // Remove quotes if present
    }
    activeFlags.push(`fp`);
} else if (fpFlagS) {
    // For short flag, value might be next arg: -p StatusAPI:8080
    const fpIndex = args.indexOf(fpFlagS);
    if (fpIndex !== -1 && args[fpIndex + 1]) {
        fpValue = args[fpIndex + 1].replace(/['"]/g, ``);
    }
    activeFlags.push(`fp`);
}

if (fpValue) {
    flagData.flagName = `fp`;
    flagData.flagParam = `forceport`;
    flagData.flagValue = fpValue;
}

// Modules exports
module.exports = {
    activeFlags,
    flagData
}