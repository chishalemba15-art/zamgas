#!/bin/bash

# ZamGas Live Log Viewer
# Navigate to the script directory
cd "$(dirname "$0")"

# Run the simple, fast log viewer (real-time streaming)
~/.bun/bin/bun simple-logs.ts
