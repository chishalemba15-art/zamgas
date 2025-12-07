# ZamGas Live Log Viewer 🔥

**High-performance** interactive AWS CloudWatch log viewer powered by **Bun** for real-time streaming.

## Features

- ⚡ **Lightning-fast real-time streaming** powered by Bun runtime
- 🎨 **Color-coded logs** by type (errors, warnings, info, success)
- 🔍 **Interactive filters** to focus on what matters
- 📊 **Live statistics** tracking with uptime, error counts & more
- ⌨️  **Keyboard shortcuts** for quick control
- 🌀 **Live activity indicator** showing streaming status
- 🎯 **Smart log highlighting** for HTTP methods, status codes & endpoints

## Quick Start

### Option 1: Run with shell script (Recommended)
```bash
./watch-logs.sh
```

### Option 2: Run directly with Bun
```bash
bun logs.ts
```

### Option 3: Run in a separate terminal
Open a new terminal window and run:
```bash
cd ~/CodeWithYaku/School\ Project\ -\ CS/lpg_delivery/server
./watch-logs.sh
```

The viewer will display a live pulse indicator (⠋ Live) showing active real-time streaming!

## Interactive Controls

| Key | Action |
|-----|--------|
| `e` | Filter: Show errors only |
| `w` | Filter: Show warnings only |
| `i` | Filter: Show info logs only |
| `a` | Filter: Show all logs |
| `p` | Pause/Resume log streaming |
| `c` | Clear screen and show banner |
| `s` | Show statistics |
| `q` | Quit the viewer |

## Color Legend

- 🔴 **Red** - Errors and DELETE requests
- 🟡 **Yellow** - Warnings and PUT requests
- 🔵 **Cyan** - Info logs and GET requests
- 🟢 **Green** - Success messages and POST requests
- ⚪ **Gray** - Timestamps and other logs

## Statistics

Press `s` at any time to view:
- Total logs received
- Error count
- Warning count
- HTTP request count
- Uptime
- Current filter mode
- Streaming status

## Requirements

- **Bun runtime** (installed automatically if using the quickstart)
- **AWS CLI** configured with access to CloudWatch logs
- Access to `/ecs/zamgas` log group in `us-east-1`

## Why Bun?

Bun provides:
- **4x faster startup** than Node.js
- **Native TypeScript support** without transpilation
- **Unbuffered I/O** for true real-time log streaming
- **Lower memory usage** for long-running processes

## Tips

- Use filters (`e`, `w`, `i`) to reduce noise when debugging
- Press `p` to pause and review logs without them scrolling
- Press `s` regularly to monitor error rates
- Use `c` to clear the screen when it gets cluttered
