# NanoClaw Security Model

## Summary

**There is no security.** Agents run as child processes with full system access. This is a personal hobby project, not production software.

## What Agents Can Do

- Read/write any file the parent process can access
- Execute any command
- Access the network unrestricted
- Read environment variables (API keys are passed explicitly)

## Trust Model

| Entity | Trust Level |
|--------|-------------|
| Main group | Trusted (your self-chat) |
| Non-main groups | **Untrusted** - prompt injection risk |

If you add groups where other people can send messages, those people can prompt-inject the agent to do anything on your system.

## Mitigations (Application-Level Only)

These provide convenience/organization, not security:

| Control | Purpose |
|---------|---------|
| Working directory per group | Organization, not isolation |
| IPC authorization | Non-main can't message other chats |
| Task visibility | Non-main sees only own tasks |
| Env var filtering | Tidiness, agent can still read .env |

## Recommendations

1. **Only use with trusted users** - Don't add groups where untrusted people can message
2. **Review the code** - It's small enough to understand
3. **Run on a dedicated machine** - If you're paranoid, use a VM or dedicated box

## If You Need Real Security

Fork and add:
- Separate user accounts per group with `setuid`
- Network namespaces or firewall rules
- Filesystem sandboxing (chroot, landlock, etc.)
- Container runtime (Docker, etc.)

This branch intentionally removed those features for simplicity.
