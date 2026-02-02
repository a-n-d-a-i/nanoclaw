# NanoClaw No-Docker Edition

This branch removes Docker dependency, running the entire app (including agents) as a non-sudo Linux user for simplified isolation. Security relies on user/group permissions and app-level cwd changes—suitable for personal use, but less granular than containers.

## Key Changes
- **No Containers**: Agents run directly via `child_process.spawn('tsx src/agent.ts')` in the group directory (chdir for isolation).
- **Dependencies**: Added `@anthropic-ai/sdk` for direct Claude calls (uses API key; no SDK auth token hacks).
- **Isolation**: Filesystem via user ownership (run as `nanoclaw` user). No network/cgroup limits—use firejail for extras.
- **Trade-offs**: Simpler setup/faster, but shared process space. Review `src/agent.ts` for SDK prompts/tools.

## Setup (Linux)
1. **Create User**:
   ```
   sudo useradd -m -s /bin/bash nanoclaw
   sudo chown -R nanoclaw:nanoclaw /opt/nanoclaw  # Or your install dir
   ```

2. **Install Deps** (as your user):
   ```
   cd nanoclaw
   npm install
   ```

3. **Config**:
   - Create `.env`: `ANTHROPIC_API_KEY=your_key` (get from Anthropic dashboard).
   - Run as nanoclaw: `su - nanoclaw -c "cd /opt/nanoclaw && npm run dev"` (or `npm start` after `npm run build`).

4. **WhatsApp Auth**:
   ```
   su - nanoclaw -c "cd /opt/nanoclaw && npm run auth"  # Scans QR in terminal
   ```

5. **Run**:
   ```
   su - nanoclaw -c "cd /opt/nanoclaw && npm run dev"
   ```
   - Registers main group via self-chat.
   - Add groups: Message in main: "@Andy join Family Chat" (scans for JID).

## Security Notes
- Run as non-root `nanoclaw` user; data in `/opt/nanoclaw/data` owned by it.
- Group isolation: Agents chdir to `/opt/nanoclaw/groups/<folder>`—can't access others if perms set (chmod 700).
- No Docker: Lighter, but agents share kernel/processes. For paranoia, wrap with `firejail --private=/opt/nanoclaw --net=none npx tsx src/index.ts`.
- Audit: Small code; review `src/agent.ts` for prompt handling.

## Usage
Same as original: Trigger with `@Andy` in WhatsApp. Schedules, web tools via SDK.

## Limitations
- Basic SDK use (messages.create)—no full Agent tools yet; expand `agent.ts`.
- No ephemeral cleanup; manual log rotation.
- macOS: Use non-sudo user similarly, but test auth.

Fork and customize! MIT license.