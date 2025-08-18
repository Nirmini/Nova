const { spawn } = require("child_process");
const path = require("path");

const MAX_CRASH_RESTARTS = 5;
let crashCount = 0;
let restarting = false;

const apiPath = path.join(__dirname, "../NovaAPI/common/APIApp.js");

function startAPIProcess() {
    console.log(`[novaAPImngr] Launching NovaAPI process: ${apiPath}`);

    const child = spawn("node", [apiPath], {
        stdio: "inherit",
        env: {
            ...process.env,
            SERVICE_NAME: "NovaAPI"
        }
    });

    child.on("exit", (code, signal) => {
        if (restarting) return;

        console.warn(`[novaAPImngr] NovaAPI exited with code ${code} ${signal ? `| signal: ${signal}` : ""}`);

        crashCount++;

        if (crashCount >= MAX_CRASH_RESTARTS) {
            console.error(`[novaAPImngr] NovaAPI crashed too many times (${crashCount}). Halting restarts.`);
            return;
        }

        const delay = 2000 * crashCount; // backoff delay increases per crash
        console.log(`[novaAPImngr] Restarting NovaAPI in ${delay / 1000}s...`);

        restarting = true;
        setTimeout(() => {
            restarting = false;
            startAPIProcess();
        }, delay);
    });
}

startAPIProcess();
