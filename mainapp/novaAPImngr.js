const { fork } = require("child_process");
const path = require("path");

const MAX_CRASH_RESTARTS = 2;
let crashCount = 0;
let restarting = false;

const apiPath = path.join(__dirname, "../NovaAPI/common/APIApp.js");

let child = null;

function startAPIProcess() {
    console.log(`[novaAPImngr] Launching NovaAPI process (forked): ${apiPath}`);

    child = fork(apiPath, [], {
        env: {
            ...process.env,
            SERVICE_NAME: "NovaAPI"
        },
        stdio: ["inherit", "inherit", "inherit", "ipc"] // enable IPC
    });

    // Forward messages from the NovaAPI child up to parent (mainapp/ipchelper)
    child.on("message", (msg) => {
        try {
            // Log incoming message clearly
            console.log(`[novaAPImngr] [IPC] Message from NovaAPI -> forwarding to parent:`, msg || "");
            // Ensure we propagate the original 'from' if present, otherwise mark origin
            const forwarded = Object.assign({}, msg, { from: 'NovaAPI' });
            // If this process has a parent (mainapp) we can forward upstream
            if (process.send) process.send(forwarded);
        } catch (err) {
            console.warn(`[novaAPImngr] Error forwarding message from NovaAPI: ${err.message}`);
        }

        // Local handling example (keeps previous behavior)
        if (msg && typeof msg === "object") {
            const { type, data } = msg;
            if (type) console.log(`[novaAPImngr] [IPC] Message type from NovaAPI: ${type}`, data || "");
            if (type === "serverCountUpdate") {
                console.log(`[novaAPImngr] Server count updated to: ${data}`);
            }
        }
    });

    // Forward messages from parent (mainapp/ipchelper) down to NovaAPI child
    process.on("message", (msg) => {
        try {
            if (!msg || typeof msg !== "object") return;
            // Avoid forwarding messages originating from the NovaAPI child again
            if (msg.from === "NovaAPI") return;
            // Log forwarded message
            console.log(`[novaAPImngr] [IPC] Forwarding message from parent -> NovaAPI:`, msg);
            if (child && child.connected) child.send(msg);
            else console.warn(`[novaAPImngr] Child not connected; cannot forward message to NovaAPI.`);
        } catch (err) {
            console.warn(`[novaAPImngr] Error forwarding message to NovaAPI: ${err.message}`);
        }
    });

    child.on("exit", (code, signal) => {
        if (restarting) return;

        console.warn(`[novaAPImngr] NovaAPI exited with code ${code}${signal ? ` (signal: ${signal})` : ""}`);
        crashCount++;

        if (crashCount >= MAX_CRASH_RESTARTS) {
            console.error(`[novaAPImngr] NovaAPI crashed too many times (${crashCount}). Halting restarts.`);
            return;
        }

        const delay = 2000 * crashCount;
        console.log(`[novaAPImngr] Restarting NovaAPI in ${delay / 1000}s...`);

        restarting = true;
        setTimeout(() => {
            restarting = false;
            startAPIProcess();
        }, delay);
    });

    child.on("error", (err) => {
        console.error(`[novaAPImngr] NovaAPI child error: ${err.message}`);
    });
}

// Example of sending an IPC message to the NovaAPI process (local use)
function sendToAPI(event, payload) {
    if (child && child.connected) {
        child.send({ event, payload });
        console.log(`[novaAPImngr] [IPC] Sent to NovaAPI: ${event}`, payload || "");
    } else {
        console.warn(`[novaAPImngr] Cannot send IPC message — NovaAPI is not connected.`);
    }
}

startAPIProcess();

// Export function so other parts of MainApp can send messages to the API process
module.exports = { sendToAPI };
