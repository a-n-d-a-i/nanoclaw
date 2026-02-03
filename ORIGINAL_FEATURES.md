# NanoClaw - Original Features (Main Branch)

This document describes what the full NanoClaw system could do before simplification.

## Agent Capabilities

The agents run **Claude Agent SDK** inside Apple Container (Linux VM) with these tools:

### Built-in Claude Agent SDK Tools

| Tool | What It Does |
|------|--------------|
| `Bash` | Run commands (safe - inside container) |
| `WebSearch` | Search the web |
| `WebFetch` | Fetch/read web pages |
| `agent-browser` | Automate Chromium (take screenshots, interact with pages) |
| `Read` | Read files in mounted directories |
| `Write` | Create/edit files in group folder |
| `Edit` | String replacement in files |

### NanoClaw-Specific Tools (via `nanoclaw` MCP server)

| Tool | What It Does |
|------|--------------|
| `schedule_task` | Create recurring/one-time tasks (cron, interval, timestamp) |
| `list_tasks` | View scheduled tasks |
| `pause_task` / `resume_task` / `cancel_task` | Task management |
| `send_message` | Send WhatsApp messages (to current group or other groups) |
| `register_group` | Add new WhatsApp groups |
| `refresh_groups` | Sync group metadata from WhatsApp |

## What The Agent Can Actually Do

### From Any Group
- Chat with Claude with full conversation memory
- Schedule tasks for itself ("remind me tomorrow at 9am")
- Run bash commands in container (grep, jq, curl, etc.)
- Search/fetch web content
- Create and read files in its group folder
- Read its `CLAUDE.md` memory file

### From Main Channel (Admin)
- All of the above, plus:
- Schedule tasks for ANY group
- View/manage all tasks across groups
- Send messages to other groups
- Register new groups
- Edit global memory

### Scheduled Tasks Can
- Run as full agent with all tools
- Send messages back to their group
- Access mounted directories
- Run bash commands, web fetch, etc.

## Memory System

- `groups/{name}/CLAUDE.md` - per-group memory
- `groups/CLAUDE.md` - global (main can edit, all can read)
- Conversation sessions auto-compact when too long

## Architecture

```
WhatsApp (baileys) --> SQLite --> Polling loop --> Container (Claude Agent SDK) --> Response
```

Single Node.js process. Agents execute in isolated Linux containers with mounted directories. IPC via filesystem.

## Key Features Removed in Simple Version

| Feature | Original | Simple |
|---------|----------|--------|
| Schedule tasks/reminders | ✅ | ❌ |
| Send to other chats | ✅ | ❌ |
| Multiple groups | ✅ | ❌ |
| Per-group memory files | ✅ | ❌ |
| Trigger prefixes (`@Andy`) | ✅ | ❌ |
| Bash tool (in container) | ✅ | ❌ |
| Web search/fetch | ✅ | ❌ |
| Browser automation | ✅ | ❌ |
| File read/write | ✅ | ❌ |
| Apple Container isolation | ✅ | ❌ |
| Persistent instructions (CLAUDE.md) | ✅ | ❌ |

## What Simple Version Retains

- WhatsApp I/O
- Conversation history context (last 100 messages in `history.jsonl`)
- Basic Claude responses

No agent capabilities - just a chatbot.
