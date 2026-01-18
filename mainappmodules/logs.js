require('dotenv').config();
const { activeFlags } = require(`../mainapp/launchargs`);
const { WebhookClient } = require('discord.js');
const discordWebhook = new WebhookClient({ url: process.env.logsWebhook})
const useDefaultConsole = true
/*
This doesn't do anything relating to coloured logs but in GUIs, the following should be used for each log type.
print: white (default)
warn: yellow
error: red
info: blue
whook: green
*/

/**
 *  Formats content for Nirmini's Console Module
 * @param {any} content 
 * @returns {string} 
 */
function formatConsoleContent(content) {
    let formattedContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    return formattedContent += `\n`;
}

/**
 * Logs content to a custom console
 * @param {string} type 
 * @param {any} content 
 * @returns {void}
 */
function consoleLog(type, content) {
    const allowedTypes=['log','warning','error','info']
    if (!allowedTypes.includes(type)) type = 'log';
    if (useDefaultConsole == true) {
        switch (type) {
            case 'log':
                console.log(content);
            break;
            case 'warning':
                console.warn(content);
            break;
            case 'error':
                console.error(content);
            break;
            case 'info':
                console.info(content);
            break;
            default: // Should never happen but I've had booleans return neither true nor false before sooooooo.
                console.log(content);
            break;
        }
    }
    else {
        switch (type) {
            case 'log':
                process.stdout.write(formatConsoleContent(content));
            break;
            case 'warning':
                process.stdout.write(formatConsoleContent(content));
            break;
            case 'error':
                process.stderr.write(formatConsoleContent(content));
            break;
            case 'info':
                process.stdout.write(formatConsoleContent(content));
            break;
            default: // For peace of mind
                process.stdout.write(formatConsoleContent(content));
            break;
        }
    }
}

/**
 * Sends messages to Discord via a webhook defined in the env file.
 * @param {string} type 
 * @param {any} content 
 * @returns {void}
*/
function sendWebhookMessage(type, content) {
    const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    let webhookContent = `Nova LogMod **[${type}]**\n` + stringContent;
    let safeContent = webhookContent;
    if (webhookContent.length > 4000) safeContent = webhookContent.slice(0, 3997) + '...';
    discordWebhook.send({content:safeContent});
}

/**
 * Prints a regular message to the console
 * @param {...any} value - Data to print to console
 * @returns {void}
 */
function print(value) { 
    consoleLog('log', value)
    if (activeFlags.includes('dev')) sendWebhookMessage(`LOG`,value);
}

/**
 * Prints a warning message to the console
 * @param {...any} value - Data to print to console
 * @returns {void}
 */
function warn(value) { 
    consoleLog('warning', value)
    if (activeFlags.includes('dev')) sendWebhookMessage(`WARN`,value);
}

/**
 * Prints an error message to the console
 * @param {...any} value - Data to print to console
 * @returns {void}
 */
function error(value) { 
    consoleLog('error', value)
    if (activeFlags.includes('dev')) sendWebhookMessage(`ERR`,value);
}

/**
 * Prints an informational message to the console
 * @param {...any} value - Data to print to console
 * @returns {void}
 */
function info(value) { 
    consoleLog('info', value)
    if (activeFlags.includes('dev')) sendWebhookMessage(`INFO`,value);
}

/**
 * Sends a log via Discord Webhooks
 * @param {...any} value - Data to send
 * @returns {void}
 */
function whook(value) { 
    sendWebhookMessage(`WHLOG`,value);
}
const log = {
    print,
    warn,
    error,
    info,
    whook,
}
module.exports = { log };