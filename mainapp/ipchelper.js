const { EventEmitter } = require('events');

const emitter = new EventEmitter();
// name -> child process
const processes = new Map();
// pending requests started by this helper (requestId -> { resolve, reject, timeout })
const pendingLocalRequests = new Map();
// outstanding cross-process request mapping (requestId -> originalFromName)
const outstanding = new Map();

function registerProcess(name, proc) {
    if (!name || !proc || typeof proc.on !== 'function') throw new Error('Invalid registerProcess args');
    processes.set(name, proc);

    proc.on('message', (msg) => {
        try {
            handleIncoming(name, msg);
        } catch (err) {
            console.warn(`[ipchelper] Error handling message from ${name}:`, err.message);
        }
    });

    proc.on('exit', () => {
        processes.delete(name);
        emitter.emit('processExit', name);
    });
}

function unregisterProcess(name) {
    processes.delete(name);
}

function handleIncoming(from, msg) {
    if (!msg || typeof msg !== 'object') return;

    // If this is a response to a request initiated locally via ipchelper.request()
    if (msg.responseId !== undefined && pendingLocalRequests.has(msg.responseId)) {
        const req = pendingLocalRequests.get(msg.responseId);
        clearTimeout(req._t);
        pendingLocalRequests.delete(msg.responseId);
        req.resolve(msg.value);
        return;
    }

    // If this is a response to a cross-process request we routed earlier
    if (msg.responseId !== undefined && outstanding.has(msg.responseId)) {
        const originalFrom = outstanding.get(msg.responseId);
        outstanding.delete(msg.responseId);
        const targetProc = processes.get(originalFrom);
        if (targetProc && targetProc.send) {
            targetProc.send({ responseId: msg.responseId, value: msg.value, from });
        }
        return;
    }

    // If message declares destination
    const to = msg.to;
    if (to) {
        if (to === 'mainapp' || to === 'MainApp' || to === 'main') {
            // Deliver to main app (emit so mainapp can handle)
            emitter.emit('message', { from, msg });
            return;
        }

        if (to === 'broadcast' || to === 'all') {
            for (const [procName, p] of processes.entries()) {
                if (procName === from) continue;
                if (p && p.send) p.send({ ...msg, from });
            }
            return;
        }

        const target = processes.get(to);
        if (!target) {
            // Optionally reply with an error back to sender
            const sender = processes.get(from);
            if (sender && sender.send) sender.send({ responseId: msg.requestId, error: `Target ${to} not found` });
            return;
        }

        // If this is a cross-process request: track mapping of requestId -> original sender
        if (msg.requestId !== undefined) {
            outstanding.set(msg.requestId, from);
        }

        // Forward message to target process
        target.send({ ...msg, from });
        return;
    }

    // If there is a requestId but no 'to', attempt intelligent routing for aggregate keys
    if (msg.requestId !== undefined && typeof msg.key === 'string') {
        const aggregateKeys = new Set(['GuildCount', 'UserCount', 'Guilds']);
        if (aggregateKeys.has(msg.key)) {
            const shardMgr = processes.get('shardMngr') || processes.get('shardmngr');
            if (shardMgr && shardMgr.send) {
                // track mapping so when shardmngr responds we forward back to origin
                outstanding.set(msg.requestId, from);
                shardMgr.send({ ...msg, to: 'shardmngr', from });
                return;
            }
        }
    }

    // No 'to' specified: emit generic inbound message
    emitter.emit('message', { from, msg });
}

// Send a one-way message from mainapp (or any caller) to a process
function send(to, payload = {}) {
    const target = processes.get(to);
    if (!target) throw new Error(`No process registered as "${to}"`);
    target.send(payload);
}

// Request/response from mainapp to a child process
function request(to, payload = {}, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const target = processes.get(to);
        if (!target) return reject(new Error(`No process registered as "${to}"`));
        const requestId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        // store local pending promise
        const t = setTimeout(() => {
            if (pendingLocalRequests.has(requestId)) {
                pendingLocalRequests.delete(requestId);
                reject(new Error('IPC request timed out'));
            }
        }, timeout);
        pendingLocalRequests.set(requestId, { resolve, reject, _t: t });
        // send request
        target.send({ ...payload, requestId, from: 'mainapp' });
    });
}

module.exports = {
    registerProcess,
    unregisterProcess,
    send,
    request,
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    _internals: { processes, outstanding, pendingLocalRequests } // useful for debugging
};