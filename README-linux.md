# NanoClaw on Linux

NanoClaw runs natively on Linux without containers. This document covers Linux-specific setup.

## Requirements

- Linux (tested on Ubuntu/Debian)
- Node.js 20+ (use nvm or package manager)
- Anthropic API key (from console.anthropic.com)
- WhatsApp account for messaging

## Setup Instructions

1. **Clone/Navigate**:
   ```
   cd /path/to/nanoclaw
   ```

2. **Install Node Dependencies**:
   ```
   npm install
   ```

3. **Build TypeScript**:
   ```
   npm run build
   ```

4. **Set Up Environment**:
   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   # Optional: export ASSISTANT_NAME=YourName (default: Andy)
   # Optional: export AGENT_TIMEOUT=300000 (ms)
   ```

5. **Initialize Data Directories**:
   ```
   mkdir -p data/ipc/main store/auth groups/main
   ```

6. **Register Main Group** (manual bootstrap):
   Create `data/registered_groups.json`:
   ```json
   {
     "main@example.com": {
       "name": "Main",
       "folder": "main",
       "trigger": "@Andy",
       "added_at": "2026-02-02T00:00:00Z"
     }
   }
   ```
   Replace "main@example.com" with your WhatsApp self-chat JID.

7. **WhatsApp Authentication**:
   ```
   npm run auth
   ```
   Scan the QR with your phone. Credentials saved to `store/auth/`.

8. **Run NanoClaw**:
   ```
   npm start
   ```

## Testing Basic Setup

### Test Agent Directly
```bash
echo '{"prompt":"What is 2+2?","groupFolder":"main","chatJid":"test@self","isMain":true}' | \
  ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY tsx src/agent.ts
```

Expected: JSON output with result.

### Test Full Flow
- Auth with `npm run auth`
- Send a message to your self-chat in WhatsApp: "@Andy What is 2+2?"
- NanoClaw should respond

## Running as a Service (systemd)

Create `/etc/systemd/system/nanoclaw.service`:
```ini
[Unit]
Description=NanoClaw WhatsApp Assistant
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/nanoclaw
Environment=ANTHROPIC_API_KEY=your-key
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nanoclaw
sudo systemctl start nanoclaw
```

## Troubleshooting

- **No Response**: Check logs in `groups/main/logs/`, ensure API key is set
- **Auth Issues**: Delete `store/auth/*` and re-run `npm run auth`
- **API Errors**: Verify API key has access to Claude models
