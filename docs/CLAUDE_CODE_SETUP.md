# Claude Code + OmniRoute setup for AgroGrowth

This repository includes shared Claude Code instructions, safety settings, specialist agents, and skills. The files do not install software or authenticate external services on your computer.

## 1. Install Claude Code in WSL Ubuntu

Use Anthropic's official installer from the WSL terminal:

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Open a new terminal if needed, then verify:

```bash
claude --version
claude doctor
```

Start Claude from the repository root:

```bash
cd /workspaces/AgroDev
claude
```

Complete Anthropic account authentication when prompted. Claude Code requires an eligible Claude plan or API billing; installing the CLI does not grant free model usage.

## 2. Add trusted engineering plugins

Inside Claude Code, use `/plugin` to browse/install plugins from trusted marketplaces. Anthropic's official marketplace repository is:

```text
/plugin marketplace add anthropics/claude-plugins-official
```

Then open `/plugin`, browse the available official plugins, and install only the ones you need. Recommended engineering capabilities to look for are GitHub, Playwright, Context7, Code Review, Code Simplifier, and CLAUDE.md management. Plugin names/availability can change; verify the marketplace listing rather than blindly running stale install commands.

After installation, use `/reload-plugins` if requested and `/mcp` to inspect connected MCP servers. Authenticate each integration through its official flow. Never paste tokens into tracked files.

## 3. Install OmniRoute (optional AI gateway)

OmniRoute is a separate local service, not a dependency of the AgroGrowth web application. Review its current upstream repository and security model before installing:

- https://github.com/Gmagl/omniroute

If you choose this provider, install and start it in WSL using the upstream's current official instructions. The current project docs describe an npm global install and a local dashboard/API on port 20128; verify the latest README before executing:

```bash
npm install -g omniroute
omniroute
```

Open the local dashboard at `http://localhost:20128`, connect at least one provider, and create a dedicated endpoint/API key. Do not commit that key.

For Claude Code integration, first inspect the setup without changing config:

```bash
omniroute setup-claude --dry-run
```

Read the preview and the current upstream CLI help before applying it. OmniRoute may create user-level Claude profiles under `~/.claude`; this is intentionally not committed to this repository. Use a model/provider that is actually available in your OmniRoute dashboard. Free provider availability, quotas, and terms can change. Never assume free, unlimited, or production-grade availability.

Optional OmniRoute MCP endpoint (only after confirming it is enabled and protected appropriately):

```bash
claude mcp add-server omniroute --type http --url http://localhost:20128/api/mcp/stream
```

If your OmniRoute instance requires authentication, configure the supported auth method using its current documentation; do not disable authentication or expose the endpoint publicly.

## 4. GitHub, Supabase, Render, and browser tools

- Prefer trusted official Claude plugins/connectors where available.
- Use least-privilege tokens and OAuth. Do not place credentials in `.mcp.json`, `.claude/settings.json`, source code, or commits.
- Keep production database write permissions and production deploy permissions disabled until the user explicitly approves a specific operation.
- Use staging/test projects for integration tests.
- For browser testing, use Playwright against a local or staging environment with test accounts.

## 5. First-run verification

Inside Claude Code:

```text
/memory
/agents
/mcp
```

Then ask Claude to:
1. Read `CLAUDE.md` and `AGENTS.md`.
2. Inspect `git status` and confirm the current branch.
3. Map the repository architecture and available test commands.
4. Run a read-only baseline audit; do not edit, deploy, or mutate production.
5. Return findings with exact evidence and blocked checks.

## Safety boundary

Claude Code can execute shell commands with your local user permissions. Review permission prompts. Do not use unrestricted `--dangerously-skip-permissions` on this production-connected repository. Keep destructive database actions, force pushes, secret changes, merges, and production deployments behind explicit human approval.
