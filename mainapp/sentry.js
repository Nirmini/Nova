// sentry.js
const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
require("dotenv").config();

// --- Simple logger (no extra deps) ---
const colors = {
  gray: "\x1b[90m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(level, msg) {
  const ts = new Date().toISOString();
  let color = colors.green;
  let tag = "INF";

  if (level === "ERR") {
    color = colors.red;
    tag = "ERR";
  } else if (level === "DBG") {
    color = colors.cyan;
    tag = "DBG";
  }

  console.log(
    `${colors.gray}${ts}${colors.reset} ${color}${tag}${colors.reset} ${colors.white}${msg}${colors.reset}`
  );
}

// --- Init ---
Sentry.init({
  dsn: process.env.SentryDSN,
  sendDefaultPii: false,
  integrations: [nodeProfilingIntegration()],
  enableLogs: true,
  tracesSampleRate: 1.0,
  profileSessionSampleRate: 1.0,
  profileLifecycle: "trace",
  environment: process.env.NODE_ENV || "development",
});

log("INF", `Sentry initialized for service: ${process.env.SERVICE_NAME || "unknown-service"}`);

// --- Setup Span ---
let setupSpan;

Sentry.startSpan(
  {
    name: "App Setup",
    op: "setup",
  },
  (span) => {
    setupSpan = span;
    span.setAttribute("service.name", process.env.SERVICE_NAME || "unknown-service");

    log("INF", "App setup span started");

    Sentry.startSpan(
      {
        name: "Init",
        op: "init",
      },
      (child) => {
        log("INF", "Init child span running");
        // … do init work …
        child.end();
        log("INF", "Init child span ended");
      }
    );
  }
);

// --- Heartbeat every 5 minutes ---
setInterval(() => {
  Sentry.startSpan(
    {
      name: "Heartbeat",
      op: "healthcheck",
    },
    (span) => {
      log("DBG", "Heartbeat tick — service is alive");
      span.end();
    }
  );
}, 5 * 60 * 1000); // 5 minutes

process.on("beforeExit", () => {
  setupSpan?.end();
  log("INF", "Setup span ended (beforeExit)");
});
process.on("SIGINT", () => {
  setupSpan?.end();
  log("ERR", "Process interrupted (SIGINT)");
  process.exit();
});
process.on("SIGTERM", () => {
  setupSpan?.end();
  log("ERR", "Process terminated (SIGTERM)");
  process.exit();
});

module.exports = { Sentry, setupSpan, log };
