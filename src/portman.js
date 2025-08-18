// Port Manager: Checks and kills any process using critical ports to avoid EADDRINUSE errors.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Load settings.json dynamically to avoid caching issues
const settingsPath = path.join(__dirname, '..', 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

function getCriticalPorts() {
    const ports = [];

    // DevDash ports (array)
    if (Array.isArray(settings.ports.DevDash)) {
        ports.push(...settings.ports.DevDash);
    }

    // NovaAPI, StatusAPI, ShardMngr (single values)
    ['NovaAPI', 'StatusAPI', 'ShardMngr'].forEach(key => {
        if (settings.ports[key]) ports.push(settings.ports[key]);
    });

    // Shard min/max range (inclusive)
    if (settings.ports.Shard && typeof settings.ports.Shard.min === 'number' && typeof settings.ports.Shard.max === 'number') {
        for (let p = settings.ports.Shard.min; p <= settings.ports.Shard.max; p++) {
            ports.push(p);
        }
    }

    return ports;
}

function freePort(port) {
    try {
        if (os.platform() === 'win32') {
            // Windows: netstat -ano | findstr :PORT
            const output = execSync(`netstat -ano | findstr :${port}`).toString();
            const lines = output.split('\n').filter(Boolean);
            const pids = new Set();
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && !isNaN(pid)) pids.add(pid);
            }
            for (const pid of pids) {
                if (parseInt(pid) !== process.pid) { // Don't kill self
                    try {
                        execSync(`taskkill /PID ${pid} /F`);
                        console.log(`[portman] Killed process ${pid} using port ${port}`);
                    } catch (e) {
                        console.warn(`[portman] Failed to kill process ${pid} on port ${port}: ${e.message}`);
                    }
                }
            }
        } else {
            // Linux: Use lsof to find and kill processes using the port
            const output = execSync(`lsof -i :${port} -t || true`).toString();
            const pids = output.split('\n').filter(Boolean);
            for (const pid of pids) {
                if (parseInt(pid) !== process.pid) { // Don't kill self
                    try {
                        execSync(`kill -9 ${pid}`);
                        console.log(`[portman] Killed process ${pid} using port ${port}`);
                    } catch (e) {
                        console.warn(`[portman] Failed to kill process ${pid} on port ${port}: ${e.message}`);
                    }
                }
            }
        }
    } catch {
        // No process found, nothing to do
    }
}

function clearCriticalPorts() {
    const ports = getCriticalPorts();
    for (const port of ports) {
        freePort(port);
    }
}

module.exports = { clearCriticalPorts };

// If run directly, clear ports immediately
if (require.main === module) {
    clearCriticalPorts();
}