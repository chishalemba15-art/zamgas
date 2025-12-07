#!/usr/bin/env bun

import { spawn } from "child_process";
import * as readline from "readline";

const LOG_GROUP = "/ecs/zamgas";
const REGION = "us-east-1";

// Bun automatically provides unbuffered I/O for real-time streaming

// Color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  timestamp: "\x1b[90m", // gray
  info: "\x1b[36m", // cyan
  error: "\x1b[31m", // red
  success: "\x1b[32m", // green
  warning: "\x1b[33m", // yellow
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[96m",
  white: "\x1b[97m",
  bgBlue: "\x1b[44m",
};

// Stats tracking
const stats = {
  totalLogs: 0,
  errors: 0,
  warnings: 0,
  requests: 0,
  startTime: Date.now(),
};

// Filter settings
let filterLevel = "all"; // all, error, warning, info
let searchTerm = "";
let paused = false;

// Setup readline for interactive controls
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

// ASCII Art Banner
function printBanner() {
  console.clear();
  console.log(colors.cyan + colors.bright);
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     ███████╗ █████╗ ███╗   ███╗ ██████╗  █████╗ ███████╗    ║
║     ╚══███╔╝██╔══██╗████╗ ████║██╔════╝ ██╔══██╗██╔════╝    ║
║       ███╔╝ ███████║██╔████╔██║██║  ███╗███████║███████╗    ║
║      ███╔╝  ██╔══██║██║╚██╔╝██║██║   ██║██╔══██║╚════██║    ║
║     ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝██║  ██║███████║    ║
║     ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ║
║                                                               ║
║            🔥  L I V E   L O G   V I E W E R  🔥             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  ` + colors.reset);

  console.log(colors.white + colors.bright + `  📡 Source: ${colors.cyan}${LOG_GROUP}${colors.reset}`);
  console.log(colors.white + colors.bright + `  🌍 Region: ${colors.cyan}${REGION}${colors.reset}`);
  console.log(colors.dim + `  ⏰ Started: ${new Date().toLocaleTimeString()}${colors.reset}`);
  console.log("");
  console.log(colors.magenta + "  ⌨️  CONTROLS:" + colors.reset);
  console.log(colors.dim + "     [e] Error only  [w] Warning only  [i] Info only  [a] All logs" + colors.reset);
  console.log(colors.dim + "     [p] Pause/Resume  [c] Clear screen  [s] Show stats  [q] Quit" + colors.reset);
  console.log(colors.cyan + "  ═══════════════════════════════════════════════════════════════" + colors.reset);
  console.log("");
}

printBanner();

// Status indicator
let lastLogTime = Date.now();
let isStreaming = false;
let logCount = 0;

// Use direct stdio inheritance for real-time streaming (no buffering!)
const awsLogs = spawn("aws", [
  "logs",
  "tail",
  LOG_GROUP,
  "--follow",
  "--region",
  REGION,
  "--format",
  "short"
], {
  stdio: ["ignore", "inherit", "inherit"]  // Direct passthrough for real-time display!
});

console.log(colors.success + "  ✅ Real-time log streaming active!" + colors.reset);
console.log(colors.dim + "  Note: Interactive features disabled for maximum speed" + colors.reset);
console.log("");

function getLogLevel(line) {
  if (line.includes("ERROR") || line.includes("error") || line.includes("❌")) return "error";
  if (line.includes("WARN") || line.includes("warn") || line.includes("⚠️")) return "warning";
  if (line.includes("INFO") || line.includes("info") || line.includes("ℹ️")) return "info";
  return "other";
}

function shouldDisplayLine(line) {
  if (paused) return false;

  const level = getLogLevel(line);

  if (filterLevel !== "all" && level !== filterLevel) {
    return false;
  }

  if (searchTerm && !line.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }

  return true;
}

function colorize(line) {
  // Update stats
  stats.totalLogs++;
  const level = getLogLevel(line);
  if (level === "error") stats.errors++;
  if (level === "warning") stats.warnings++;
  if (line.includes("GET") || line.includes("POST") || line.includes("PUT") || line.includes("DELETE")) {
    stats.requests++;
  }

  // Color timestamps
  line = line.replace(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/, `${colors.dim}$1${colors.reset}`);

  // Color HTTP methods
  line = line.replace(/\b(GET|POST|PUT|DELETE|PATCH)\b/g, (match) => {
    const methodColors = {
      GET: colors.cyan,
      POST: colors.success,
      PUT: colors.warning,
      DELETE: colors.error,
      PATCH: colors.magenta,
    };
    return `${colors.bright}${methodColors[match] || colors.white}${match}${colors.reset}`;
  });

  // Color status codes
  line = line.replace(/\| (\d{3}) \|/g, (match, code) => {
    const codeNum = parseInt(code);
    let color = colors.white;
    if (codeNum >= 200 && codeNum < 300) color = colors.success;
    else if (codeNum >= 300 && codeNum < 400) color = colors.cyan;
    else if (codeNum >= 400 && codeNum < 500) color = colors.warning;
    else if (codeNum >= 500) color = colors.error;
    return `| ${colors.bright}${color}${code}${colors.reset} |`;
  });

  // Color endpoints
  line = line.replace(/(\/[\w\-\/]+)/g, `${colors.blue}$1${colors.reset}`);

  // Color log levels
  if (level === "error") {
    return `${colors.error}▸ ${line}${colors.reset}`;
  } else if (level === "warning") {
    return `${colors.warning}▸ ${line}${colors.reset}`;
  } else if (level === "info") {
    return `${colors.info}▸ ${line}${colors.reset}`;
  } else if (line.includes("✅") || line.includes("SUCCESS") || line.includes("success")) {
    return `${colors.success}▸ ${line}${colors.reset}`;
  }

  return `${colors.dim}▸${colors.reset} ${line}`;
}

function showStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
  const minutes = Math.floor(uptime / 60);
  const seconds = uptime % 60;

  console.log("\n" + colors.cyan + "═".repeat(65) + colors.reset);
  console.log(colors.bright + colors.white + "  📊 STATISTICS" + colors.reset);
  console.log(colors.cyan + "═".repeat(65) + colors.reset);
  console.log(`  ${colors.white}Total Logs:${colors.reset}     ${colors.cyan}${stats.totalLogs}${colors.reset}`);
  console.log(`  ${colors.error}Errors:${colors.reset}         ${colors.error}${stats.errors}${colors.reset}`);
  console.log(`  ${colors.warning}Warnings:${colors.reset}       ${colors.warning}${stats.warnings}${colors.reset}`);
  console.log(`  ${colors.success}HTTP Requests:${colors.reset}  ${colors.success}${stats.requests}${colors.reset}`);
  console.log(`  ${colors.white}Uptime:${colors.reset}         ${colors.cyan}${minutes}m ${seconds}s${colors.reset}`);
  console.log(`  ${colors.white}Filter:${colors.reset}         ${colors.magenta}${filterLevel.toUpperCase()}${colors.reset}`);
  console.log(`  ${colors.white}Status:${colors.reset}         ${paused ? colors.warning + "PAUSED" : colors.success + "LIVE"}${colors.reset}`);
  console.log(colors.cyan + "═".repeat(65) + colors.reset + "\n");
}

// Keyboard handler
process.stdin.on("keypress", (str, key) => {
  if (key.ctrl && key.name === "c") {
    cleanup();
  }

  switch(key.name) {
    case "q":
      cleanup();
      break;
    case "e":
      filterLevel = "error";
      console.log(`\n${colors.error}[FILTER: ERRORS ONLY]${colors.reset}\n`);
      break;
    case "w":
      filterLevel = "warning";
      console.log(`\n${colors.warning}[FILTER: WARNINGS ONLY]${colors.reset}\n`);
      break;
    case "i":
      filterLevel = "info";
      console.log(`\n${colors.info}[FILTER: INFO ONLY]${colors.reset}\n`);
      break;
    case "a":
      filterLevel = "all";
      console.log(`\n${colors.cyan}[FILTER: ALL LOGS]${colors.reset}\n`);
      break;
    case "p":
      paused = !paused;
      console.log(`\n${paused ? colors.warning + "[PAUSED]" : colors.success + "[RESUMED]"}${colors.reset}\n`);
      break;
    case "c":
      printBanner();
      break;
    case "s":
      showStats();
      break;
  }
});

function cleanup() {
  console.log("\n" + colors.cyan + "═".repeat(65) + colors.reset);
  showStats();
  console.log(colors.yellow + "  👋 Stopping log viewer..." + colors.reset);
  console.log(colors.cyan + "═".repeat(65) + colors.reset + "\n");
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
  awsLogs.kill();
  process.exit(0);
}

if (awsLogs.stdout) {
  // Set encoding to get strings instead of buffers
  awsLogs.stdout.setEncoding('utf8');

  let buffer = '';

  awsLogs.stdout.on("data", (data) => {
    isStreaming = true;
    lastLogTime = Date.now();

    // Debug: Show that we received data
    if (logCount === 0) {
      console.log(colors.success + "  [First data received from AWS!]" + colors.reset);
    }

    // Handle partial lines by buffering
    buffer += data;
    const lines = buffer.split("\n");

    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || '';

    // Process complete lines immediately - NO FILTERING, JUST DISPLAY
    lines.forEach((line) => {
      if (line.trim()) {
        logCount++;
        // Print directly to stdout without any indicators interfering
        console.log(colorize(line));
      }
    });
  });

  // Handle any remaining buffer on stream end
  awsLogs.stdout.on("end", () => {
    if (buffer.trim() && shouldDisplayLine(buffer)) {
      console.log(colorize(buffer));
    }
  });
}

if (awsLogs.stderr) {
  awsLogs.stderr.on("data", (data) => {
    console.error(`${colors.error}▸ ERROR: ${data}${colors.reset}`);
  });
}

awsLogs.on("close", (code) => {
  cleanup();
});

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  cleanup();
});

// Show initial connection message with live indicator
setTimeout(() => {
  console.log(colors.success + "  ✓ Connected to CloudWatch logs" + colors.reset);
  console.log(colors.bright + colors.cyan + "  ⚡ STREAMING LIVE" + colors.reset + colors.dim + " - Real-time logs appear below" + colors.reset);
  console.log(colors.dim + "  Press [s] to show stats, [q] to quit\n" + colors.reset);
  console.log(colors.cyan + "  ─".repeat(65) + colors.reset + "\n");
  isStreaming = true;
}, 500);

// Log activity status (non-intrusive)
setInterval(() => {
  if (isStreaming && !paused) {
    const timeSinceLastLog = Date.now() - lastLogTime;
    if (timeSinceLastLog > 10000 && logCount > 0) {
      // Only show waiting message if we've seen logs before and it's been quiet
      console.log(colors.dim + "  [Waiting for new logs...]" + colors.reset);
    }
  }
}, 15000);
