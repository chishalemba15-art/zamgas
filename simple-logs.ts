#!/usr/bin/env bun

import { spawn } from "child_process";

console.log("🔥 ZamGas Live Logs - Starting...\n");

const proc = spawn("aws", [
  "logs",
  "tail",
  "/ecs/zamgas",
  "--follow",
  "--region",
  "us-east-1",
  "--format",
  "short"
], {
  stdio: ["ignore", "inherit", "inherit"]  // Direct passthrough
});

proc.on("error", (err) => {
  console.error("Error:", err);
});

proc.on("close", (code) => {
  console.log(`\nProcess exited with code ${code}`);
  process.exit(code || 0);
});

process.on("SIGINT", () => {
  console.log("\n\nStopping...");
  proc.kill();
  process.exit(0);
});
