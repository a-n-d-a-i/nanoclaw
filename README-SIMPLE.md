# NanoClaw - Single File Version

A minimal WhatsApp-to-Claude bridge. ~200 lines, no dependencies beyond WhatsApp and Claude SDKs.

## How It Works

```
WhatsApp Message → nanoclaw.ts → Claude API → WhatsApp Response
                    ↓
              history.jsonl
```

1. Receives any incoming WhatsApp message
2. Sends to Claude with chat history (last 100 messages)
3. Responds to the same chat
4. Appends both to `history.jsonl`

## Setup

```bash
# Install dependencies
npm install @whiskeysockets/baileys @anthropic-ai/sdk qrcode-terminal

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Run
npm run dev:simple
```

First run: scan QR code from terminal.

## Configuration

Edit the constants at the top of `nanoclaw.ts`:

```typescript
const ASSISTANT_NAME = 'Andy';     // Bot's name
const MAX_HISTORY = 100;           // Messages to keep
```

## What Was Removed

| Original | Simplified |
|----------|------------|
| 9 files, ~1500 lines | 1 file, ~200 lines |
| Multi-group system | Single chat |
| Scheduled tasks | None (use external cron) |
| IPC system | None |
| SQLite database | JSONL file |
| Agent subprocess | Direct API call |
| Pino logging | console.log |
| Trigger patterns | Responds to all |

## Reset

To start fresh: `rm -rf store/ history.jsonl`
