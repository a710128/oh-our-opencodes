# Quick Reference Guide

Complete reference for oh-our-opencodes configuration and capabilities.

## Table of Contents

- [Manual Presets](#manual-presets)
- [Skills](#skills)
- [MCP Servers](#mcp-servers)
- [Tools & Capabilities](#tools--capabilities)
- [Configuration](#configuration)

---

## Manual Presets

This fork only supports user-managed presets. There are no built-in presets in source.

### Interactive Model Discovery

The installer can discover available models by running:

```bash
opencode models --refresh --verbose
```

Current installer behavior:
- Interactive install lets you choose one model from the discovered list
- Non-interactive install requires `--model=<id>`
- The chosen model is applied across all agents by default

Useful flags:

```bash
--model=<id>
--tmux=yes|no
--skills=yes|no
```

### Switching Presets

**Method 1: Edit Config File**

Edit `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`) and change the `preset` field:

```json
{
  "preset": "work"
}
```

**Method 2: Environment Variable**

Set the environment variable before running OpenCode:

```bash
export OH_OUR_OPENCODES_PRESET=work
opencode
```

The environment variable takes precedence over the config file.

### Example Manual Preset

```json
{
  "preset": "work",
  "presets": {
    "work": {
      "orchestrator": { "model": "openai/gpt-5.3-codex", "skills": ["*"], "mcps": ["websearch"] },
      "librarian": { "model": "openai/gpt-5.1-codex-mini", "variant": "low", "skills": [], "mcps": ["websearch", "context7", "grep_app"] },
      "explorer": { "model": "openai/gpt-5.1-codex-mini", "variant": "low", "skills": [], "mcps": [] },
      "designer": { "model": "anthropic/claude-sonnet-4-5", "variant": "medium", "skills": ["agent-browser"], "mcps": [] },
      "fixer": { "model": "openai/gpt-5.1-codex-mini", "variant": "low", "skills": [], "mcps": [] },
      "reviewer": { "model": "openai/gpt-5.1-codex-mini", "variant": "low", "skills": [], "mcps": [] }
    }
  }
}
```

---

## Skills

Skills are specialized capabilities provided by external agents and tools. Unlike MCPs which are servers, skills are prompt-based tool configurations installed via `npx skills add` during installation.

### Recommended Skills (via npx)

| Skill | Description | Assigned To |
|-------|-------------|-------------|
| [`simplify`](#simplify) | YAGNI code simplification expert | `orchestrator` |
| [`agent-browser`](#agent-browser) | High-performance browser automation | `designer` |

### Custom Skills (bundled in repo)

| Skill | Description | Assigned To |
|-------|-------------|-------------|
| `agents-markdown` | AGENTS.md template + writing instructions | `orchestrator`, `fixer` |

### Simplify

**The Minimalist's sacred truth: every line of code is a liability.**

`simplify` is a specialized skill for complexity analysis and YAGNI enforcement. It identifies unnecessary abstractions and suggests minimal implementations.

### Agent Browser

**External browser automation for visual verification and testing.**

`agent-browser` provides full high-performance browser automation capabilities. It allows agents to browse the web, interact with elements, and capture screenshots for visual state verification.

### Skills Assignment

You can customize which skills each agent is allowed to use in `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`).

**Syntax:**

| Syntax | Description | Example |
|--------|-------------|---------|
| `"*"` | All installed skills | `["*"]` |
| `"!item"` | Exclude specific skill | `["*", "!agent-browser"]` |
| Explicit list | Only listed skills | `["simplify"]` |
| `"!*"` | Deny all skills | `["!*"]` |

**Rules:**
- `*` expands to all available skills
- `!item` excludes specific skills
- Conflicts (e.g., `["a", "!a"]`) → deny wins (principle of least privilege)
- Empty list `[]` → no skills allowed

**Example Configuration:**

```json
{
  "presets": {
    "my-preset": {
      "orchestrator": {
        "skills": ["*", "!agent-browser"]
      },
      "designer": {
        "skills": ["agent-browser", "simplify"]
      }
    }
  }
}
```

---

## MCP Servers

Built-in Model Context Protocol servers (enabled by default):

| MCP | Purpose | URL |
|-----|---------|-----|
| `websearch` | Real-time web search via Exa AI | `https://mcp.exa.ai/mcp` |
| `context7` | Official library documentation | `https://mcp.context7.com/mcp` |
| `grep_app` | GitHub code search via grep.app | `https://mcp.grep.app` |

### MCP Permissions

Control which agents can access which MCP servers using per-agent allowlists:

| Agent | Default MCPs |
|-------|--------------|
| `orchestrator` | `websearch` |
| `designer` | none |
| `librarian` | `websearch`, `context7`, `grep_app` |
| `explorer` | none |
| `fixer` | none |
| `reviewer` | none |

### Configuration & Syntax

You can configure MCP access in your plugin configuration file: `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`).

**Per-Agent Permissions**

Control which agents can access which MCP servers using the `mcps` array in your preset. The syntax is the same as for skills:

| Syntax | Description | Example |
|--------|-------------|---------|
| `"*"` | All MCPs | `["*"]` |
| `"!item"` | Exclude specific MCP | `["*", "!context7"]` |
| Explicit list | Only listed MCPs | `["websearch", "context7"]` |
| `"!*"` | Deny all MCPs | `["!*"]` |

**Rules:**
- `*` expands to all available MCPs
- `!item` excludes specific MCPs
- Conflicts (e.g., `["a", "!a"]`) → deny wins
- Empty list `[]` → no MCPs allowed

**Example Configuration:**

```json
{
  "presets": {
    "my-preset": {
      "orchestrator": {
        "mcps": ["websearch"]
      },
      "librarian": {
        "mcps": ["websearch", "context7", "grep_app"]
      }
    }
  }
}
```

**Global Disabling**

You can disable specific MCP servers globally by adding them to the `disabled_mcps` array at the root of your config object.

---

## Tools & Capabilities

### Tmux Integration

> ⚠️ **Temporary workaround:** Start OpenCode with `--port` to enable tmux integration. The port must match the `OPENCODE_PORT` environment variable (default: 4096). This is required until the upstream issue is resolved. [opencode#9099](https://github.com/anomalyco/opencode/issues/9099).

**Watch your agents work in real-time.** When the Orchestrator launches sub-agents or initiates background tasks, new tmux panes automatically spawn showing each agent's live progress. No more waiting in the dark.

#### Quick Setup

1. **Enable tmux integration** in `oh-our-opencodes.json` (or `.jsonc`):

   ```json
   {
     "tmux": {
       "enabled": true,
       "layout": "main-vertical",
       "main_pane_size": 60
     }
   }
   ```

2. **Run OpenCode inside tmux**:
    ```bash
    tmux
    opencode --port 4096
    ```

#### Layout Options

| Layout | Description |
|--------|-------------|
| `main-vertical` | Your session on the left (60%), agents stacked on the right |
| `main-horizontal` | Your session on top (60%), agents stacked below |
| `tiled` | All panes in equal-sized grid |
| `even-horizontal` | All panes side by side |
| `even-vertical` | All panes stacked vertically |

> **Detailed Guide:** For complete tmux integration documentation, troubleshooting, and advanced usage, see [Tmux Integration](tmux-integration.md)

### Background Tasks

The plugin provides tools to manage asynchronous work:

| Tool | Description |
|------|-------------|
| `background_task` | Launch an agent in a new session (`sync=true` blocks, `sync=false` runs in background) |
| `background_output` | Fetch the result of a background task by ID |
| `background_cancel` | Abort running tasks |

### LSP Tools

Language Server Protocol integration for code intelligence:

| Tool | Description |
|------|-------------|
| `lsp_goto_definition` | Jump to symbol definition |
| `lsp_find_references` | Find all usages of a symbol across the workspace |
| `lsp_diagnostics` | Get errors/warnings from the language server |
| `lsp_rename` | Rename a symbol across all files |

> **Built-in LSP Servers:** OpenCode includes pre-configured LSP servers for 30+ languages (TypeScript, Python, Rust, Go, etc.). See the [official documentation](https://opencode.ai/docs/lsp/#built-in) for the full list and requirements.

### Code Search Tools

Fast code search and refactoring:

| Tool | Description |
|------|-------------|
| `grep` | Fast content search using ripgrep |
| `ast_grep_search` | AST-aware code pattern matching (25 languages) |
| `ast_grep_replace` | AST-aware code refactoring with dry-run support |

### Formatters

OpenCode automatically formats files after they're written or edited using language-specific formatters.

> **Built-in Formatters:** Includes support for Prettier, Biome, gofmt, rustfmt, ruff, and 20+ others. See the [official documentation](https://opencode.ai/docs/formatters/#built-in) for the complete list.

---

## Configuration

### Files You Edit

| File | Purpose |
|------|---------|
| `~/.config/opencode/opencode.json` | OpenCode core settings |
| `~/.config/opencode/oh-our-opencodes.json` or `.jsonc` | Plugin settings (agents, tmux, MCPs) |
| `.opencode/oh-our-opencodes.json` or `.jsonc` | Project-local plugin overrides (optional) |

> **💡 JSONC Support:** Configuration files support JSONC format (JSON with Comments). Use `.jsonc` extension to enable comments and trailing commas. If both `.jsonc` and `.json` exist, `.jsonc` takes precedence.

### Prompt Overriding

You can customize agent prompts by creating markdown files in `~/.config/opencode/oh-our-opencodes/`:

| File | Purpose |
|------|---------|
| `{agent}.md` | Replaces the default prompt entirely |
| `{agent}_append.md` | Appends to the default prompt |

**Example:**

```
~/.config/opencode/oh-our-opencodes/
  ├── orchestrator.md          # Custom orchestrator prompt
  ├── orchestrator_append.md   # Append to default orchestrator prompt
  ├── explorer.md
  ├── explorer_append.md
  └── ...
```

**Usage:**

- Create `{agent}.md` to completely replace an agent's default prompt
- Create `{agent}_append.md` to add custom instructions to the default prompt
- Both files can exist simultaneously - the replacement takes precedence
- If neither file exists, the default prompt is used

This allows you to fine-tune agent behavior without modifying the source code.

### JSONC Format (JSON with Comments)

The plugin supports **JSONC** format for configuration files, allowing you to:

- Add single-line comments (`//`)
- Add multi-line comments (`/* */`)
- Use trailing commas in arrays and objects

**File Priority:**
1. `oh-our-opencodes.jsonc` (preferred if exists)
2. `oh-our-opencodes.json` (fallback)

**Example JSONC Configuration:**

```jsonc
{
  // Use preset for development
  "preset": "dev",

  /* Presets definition - customize agent models here */
  "presets": {
    "dev": {
      // Fast models for quick iteration
      "librarian": { "model": "google/gemini-3-flash" },
      "explorer": { "model": "google/gemini-3-flash" },
    },
  },

  "tmux": {
    "enabled": true,  // Enable for monitoring
    "layout": "main-vertical",
  },
}
```

### Plugin Config (`oh-our-opencodes.json` or `oh-our-opencodes.jsonc`)

The installer generates a `manual` preset based on the model you choose. You can then add or edit your own presets freely. See the [Manual Presets](#manual-presets) section for configuration examples.

#### Option Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `preset` | string | - | Name of the preset to use (e.g., `"manual"`, `"work"`) |
| `presets` | object | - | Named preset configurations containing agent mappings |
| `presets.<name>.<agent>.model` | string | - | Model ID for the agent (e.g., `"google/claude-opus-4-5-thinking"`) |
| `presets.<name>.<agent>.temperature` | number | - | Temperature setting (0-2) for the agent |
| `presets.<name>.<agent>.variant` | string | - | Agent variant for reasoning effort (e.g., `"low"`, `"medium"`, `"high"`) |
| `presets.<name>.<agent>.skills` | string[] | - | Array of skill names the agent can use (`"*"` for all, `"!item"` to exclude) |
| `presets.<name>.<agent>.mcps` | string[] | - | Array of MCP names the agent can use (`"*"` for all, `"!item"` to exclude) |
| `tmux.enabled` | boolean | `false` | Enable tmux pane spawning for sub-agents |
| `tmux.layout` | string | `"main-vertical"` | Layout preset: `main-vertical`, `main-horizontal`, `tiled`, `even-horizontal`, `even-vertical` |
| `tmux.main_pane_size` | number | `60` | Main pane size as percentage (20-80) |
| `disabled_mcps` | string[] | `[]` | MCP server IDs to disable globally (e.g., `"websearch"`) |

> **Note:** Agent configuration should be defined within `presets`. The root-level `agents` field is deprecated.
