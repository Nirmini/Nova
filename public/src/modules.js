const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const BirthdayManager = require('../core/modules/birthday');

/**
 * Loads and initializes all modules from the ../core/modules directory.
 */
class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.loadModules();
        this.scheduleBirthdayPings();
    }

    /**
     * Dynamically loads all modules from ../core/modules.
     */
    loadModules() {
        const modulesPath = path.join(__dirname, '../core/modules');
        if (!fs.existsSync(modulesPath)) {
            console.warn(`[ModuleManager] Warning: Modules directory does not exist at ${modulesPath}`);
            return;
        }

        const moduleFiles = fs.readdirSync(modulesPath).filter(file => file.endsWith('.js'));

        for (const file of moduleFiles) {
            const modulePath = path.join(modulesPath, file);
            try {
                const module = require(modulePath);
                if (module.name) {
                    this.modules.set(module.name, module);
                    console.log(`[ModuleManager] Loaded module: ${module.name}`);
                } else {
                    console.warn(`[ModuleManager] Warning: Module at ${file} is missing a "name" property.`);
                }
            } catch (error) {
                console.error(`[ModuleManager] Error loading module ${file}:`, error);
            }
        }
    }

    /**
     * Retrieves a module by name.
     * @param {string} name - The name of the module.
     * @returns {object|null} The module object or null if not found.
     */
    getModule(name) {
        return this.modules.get(name) || null;
    }

    /**
     * Executes a module function if it exists.
     * @param {string} name - The module name.
     * @param {string} functionName - The function to execute.
     * @param {...any} args - Arguments to pass to the function.
     * @returns {any} The function's return value or null if it fails.
     */
    executeModuleFunction(name, functionName, ...args) {
        const module = this.getModule(name);
        if (module && typeof module[functionName] === 'function') {
            return module[functionName](...args);
        }
        console.warn(`[ModuleManager] Warning: Function "${functionName}" not found in module "${name}".`);
        return null;
    }

    /**
     * Schedules a daily task to send birthday pings.
     */
    scheduleBirthdayPings() {
        cron.schedule('0 0 * * *', async () => {
            console.log('🎉 Running daily birthday ping...');
            try {
                await BirthdayManager.sendBirthdayPing(global.client);
                console.log('🎂 Birthday pings completed!');
            } catch (error) {
                console.error('❌ Error running birthday pings:', error);
            }
        });
    }
}

module.exports = new ModuleManager();
