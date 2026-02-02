# NanoClaw on Linux

This document describes how to port and run NanoClaw on Linux, replacing Apple Container with Docker for isolation. The setup is adapted for manual Node.js installation without requiring Claude Code. The project uses the official Anthropic Claude Agent SDK legitimately via API key.

## Changes Made

- **Container Runtime**: Replaced Apple Container with Docker. Modified `src/container-runner.ts` to use `docker run` instead of `container run`. Mount arguments are compatible.
- **System Check**: Updated `src/index.ts` to check for Docker availability instead of Apple Container.
- **Build Script**: Added `container/build-docker.sh` for building the agent image with Docker.
- **Auth Handling**: WhatsApp auth is manual via `npm run auth`. No macOS-specific notifications.
- **Paths**: All paths are relative; works on Linux. Ensure `/workspace` in container matches.
- **Security**: Docker provides isolation. Use `--network none` if extra isolation needed (not added by default).
- **SDK Usage**: Uses `@anthropic-ai/claude-agent-sdk` with `permissionMode: 'bypassPermissions'` for local-like behavior, but with API key for legitimacy. Review SDK docs for compliance.

## Requirements

- Linux (tested on Ubuntu/Debian-like)
- Node.js 20+ (use nvm or package manager)
- Docker (installed and running; user in `docker` group for non-root access)
- Anthropic API key (from console.anthropic.com)
- WhatsApp account for messaging (optional for core testing)

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
   Create `.env` in project root:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   # Optional: ASSISTANT_NAME=YourName (default: Andy)
   # Optional: CONTAINER_TIMEOUT=300000 (ms)
   ```

5. **Build Docker Image**:
   ```
   cd container
   ./build-docker.sh
   cd ..
   ```
   This builds `nanoclaw-agent:latest`. Ensure Docker is running.

6. **Initialize Data Directories**:
   ```
   mkdir -p data/ipc/{main,messages,tasks} store/auth groups/main groups/global
   ```

7. **Register Main Group** (manual bootstrap):
   Create `data/registered_groups.json`:
   ```json
   {
     "main@example.com": {
       "name": "Main",
       "folder": "main",
       "trigger": "@Andy",
       "added_at": "2026-02-02T00:00:00Z",
       "containerConfig": {}
     }
   }
   ```
   Replace "main@example.com" with a placeholder JID for testing (e.g., self-chat).

8. **WhatsApp Authentication** (for full WhatsApp I/O):
   ```
   npm run auth
   ```
   Scan the QR with your phone. Credentials saved to `store/auth/`.

9. **Run NanoClaw**:
   ```
   npm start
   ```
   It will connect to WhatsApp (if auth'd), poll for messages, and run agents in Docker containers.

## Testing Basic Setup

### Core Agent Run (without WhatsApp)
To test container agent:

1. Create test input `test-input.json`:
   ```json
   {
     "prompt": "<messages><message sender=\"User\" time=\"2026-02-02T02:00:00Z\">What is 2+2?</message></messages>",
     "groupFolder": "main",
     "chatJid": "test@self",
     "isMain": true
   }
   ```

2. Run container manually (adjust paths):
   ```
   docker run -i --rm \
     -v $(pwd)/groups/main:/workspace/group \
     -v $(pwd)/data/sessions/main:/home/node/.claude \
     -v $(pwd)/data/ipc/main:/workspace/ipc \
     -v $(pwd)/data/env:/workspace/env-dir:ro \
     nanoclaw-agent:latest < test-input.json
   ```
   Expected: JSON output with result like "4".

   Note: Requires API key in `data/env/env` (filtered from .env).

### Simulate WhatsApp Interaction
- Auth with `npm run auth`.
- Send a message to your self-chat in WhatsApp with "@Andy What is the weather?".
- NanoClaw should respond if registered.

For simulation without phone: Modify `src/index.ts` to mock messages in DB for testing.

## Known Issues

- **Docker Permissions**: Ensure user can run Docker without sudo (add to `docker` group, log out/in).
- **API Key Auth**: OAuth token may not work; use API key. If SDK requires Claude Code for some features, note fallback to API.
- **Browser in Container**: Chromium installed; agent-browser tools work if env set.
- **No Auto-Start Docker**: User must start Docker service.
- **Testing Limitations**: Full test requires API key and Docker access. Core Node/DB works; container spawn untested here due to perms.
- **SDK Legitimacy**: Uses official SDK with bypass for dev; production use API limits.

## Next Steps

- Test full run with valid API key and Docker perms.
- Add optional `--network none` to docker args for stricter isolation.
- Implement mock WhatsApp for unit tests.
- Contribute back as a skill or PR for Linux support.

## Troubleshooting

- **Docker Build Fails**: Check Docker running, sufficient resources.
- **No Response**: Check logs in `groups/main/logs/`, ensure mounts correct.
- **Auth Issues**: Delete `store/auth/*` and re-run `npm run auth`.
- **SDK Errors**: Verify API key has access to claude-3.5-sonnet or similar.

