---
name: debug
description: Debug agent issues. Use when things aren't working, agent fails, authentication problems, or to understand how the agent system works. Covers logs, environment variables, and common issues.
---

# NanoClaw Agent Debugging

This guide covers debugging the agent execution system.

## Architecture Overview

```
Host (Linux/macOS)
─────────────────────────────────────────────────────────────
src/agent-runner.ts               src/agent.ts
    │                                  │
    │ spawns child process             │ calls Anthropic API
    │ with environment vars            │ via stdin/stdout JSON
    │                                  │
    └── Working dir: groups/{folder}/  └── Returns JSON result
```

## Log Locations

| Log | Location | Content |
|-----|----------|---------|
| **Main app logs** | `logs/nanoclaw.log` | Host-side WhatsApp, routing, agent spawning |
| **Main app errors** | `logs/nanoclaw.error.log` | Host-side errors |
| **Agent run logs** | `groups/{folder}/logs/agent-*.log` | Per-run: input, stderr, stdout |

## Enabling Debug Logging

Set `LOG_LEVEL=debug` for verbose output:

```bash
# For development
LOG_LEVEL=debug npm run dev
```

Debug level shows:
- Environment configuration
- Agent stderr output
- Full input/output

## Common Issues

### 1. "Agent exited with error"

**Check the agent log file** in `groups/{folder}/logs/agent-*.log`

Common causes:

#### Missing Authentication
```
Invalid API key
```
**Fix:** Ensure `ANTHROPIC_API_KEY` environment variable is set:
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-...
```

### 2. Environment Variables Not Passing

Check that the API key is available:
```bash
echo $ANTHROPIC_API_KEY | head -c 20
```

### 3. Agent Timeout

If agents are timing out, increase the timeout:
```bash
export AGENT_TIMEOUT=600000  # 10 minutes
```

Or set per-group in `data/registered_groups.json`:
```json
{
  "agentConfig": {
    "timeout": 600000
  }
}
```

## Manual Agent Testing

### Test the agent directly:
```bash
echo '{"prompt":"What is 2+2?","groupFolder":"main","chatJid":"test@g.us","isMain":true}' | \
  ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY tsx src/agent.ts
```

## IPC Debugging

The agent communicates back to the host via files in `data/ipc/`:

```bash
# Check pending messages
ls -la data/ipc/*/messages/

# Check pending task operations
ls -la data/ipc/*/tasks/

# Check available groups (main channel only)
cat data/ipc/main/available_groups.json

# Check current tasks snapshot
cat data/ipc/{groupFolder}/current_tasks.json
```

## Quick Diagnostic Script

Run this to check common issues:

```bash
echo "=== Checking NanoClaw Agent Setup ==="

echo -e "\n1. API key configured?"
[ -n "$ANTHROPIC_API_KEY" ] && echo "OK" || echo "MISSING - set ANTHROPIC_API_KEY"

echo -e "\n2. Groups directory?"
ls -la groups/ 2>/dev/null || echo "MISSING - run setup"

echo -e "\n3. Recent agent logs?"
ls -t groups/*/logs/agent-*.log 2>/dev/null | head -3 || echo "No agent logs yet"

echo -e "\n4. Check for errors in recent logs?"
tail -20 logs/nanoclaw.log 2>/dev/null | grep -i error || echo "No recent errors"
```
