class Mutex {
    constructor() {
        this.locked = false;
    }

    async lock() {
        while (this.locked) {
            await new Promise(resolve => setTimeout(resolve, 50)); // Wait until unlocked or smth
        }
        this.locked = true;
    }

    unlock() {
        this.locked = false;
    }
}

module.exports = new Mutex();