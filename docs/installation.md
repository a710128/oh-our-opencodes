# Installation Guide

Complete installation instructions for oh-our-opencodes.

## Table of Contents

- [For Humans](#for-humans)
- [For LLM Agents](#for-llm-agents)
- [Troubleshooting](#troubleshooting)
- [Uninstallation](#uninstallation)

---

## For Humans

### Quick Install

Run the interactive installer:

```bash
bunx oh-our-opencodes@latest install
```

Or use non-interactive mode:

```bash
bunx oh-our-opencodes@latest install --no-tui --model=opencode/big-pickle --tmux=no --skills=yes
```

### Installer Behavior

The installer works in a manual-first flow:
- Interactive mode lets you pick one model from `opencode models --refresh --verbose`
- Non-interactive mode requires `--model=<id>`
- The selected model is assigned across all agents in generated config
- You can still customize per-agent models later by editing `~/.config/opencode/oh-our-opencodes.json` or `.jsonc`

During interactive setup, the installer runs:

```bash
opencode models --refresh --verbose
```

### After Installation

Authenticate the provider for the model ids you configured:

```bash
opencode auth login
# Select the provider used by your chosen models
# Repeat only if you manually edit your preset to mix models from multiple providers
```

Once authenticated, run opencode and `ping all agents` to verify all agents respond.

> **💡 Tip: Models are fully customizable.** The installer sets sensible defaults, but you can assign *any* model to *any* agent. Edit `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc` for comments support) to override models, adjust reasoning effort, or disable agents entirely. See [Configuration](quick-reference.md#configuration) for details.

### Alternative: Ask Any Coding Agent

Paste this into Claude Code, AmpCode, Cursor, or any coding agent:

```
Install and configure by following the instructions here:
https://raw.githubusercontent.com/a710128/oh-our-opencodes/refs/heads/master/README.md
```

---

## For LLM Agents

If you're an LLM Agent helping set up oh-our-opencodes, follow these steps.

### Step 1: Check OpenCode Installation

```bash
opencode --version
```

If not installed, direct the user to https://opencode.ai/docs first.

### Step 2: Pick an Install Mode

Choose one of these paths:

1. Interactive: run `bunx oh-our-opencodes@latest install` and pick a model from the discovered list
2. Non-interactive: provide a concrete model id with `--model=<id>`

Key behavior to explain:
- The installer currently assigns one chosen model across all agents
- Per-agent model customization happens after install in `~/.config/opencode/oh-our-opencodes.json` or `.jsonc`
- Non-interactive installs can set `tmux` directly; interactive installs also honor `--tmux=yes|no`, otherwise they preserve the current tmux enabled state
- Re-running the installer rewrites the generated `manual` preset, so custom per-agent edits should be re-applied afterward

### Step 3: Run the Installer

Based on answers, run:

```bash
bunx oh-our-opencodes@latest install --no-tui --model=<id> --tmux=<yes|no> --skills=<yes|no>
```

**Examples:**
```bash
# One model for all agents
bunx oh-our-opencodes@latest install --no-tui --model=opencode/big-pickle --tmux=no --skills=yes

# Use a different model id
bunx oh-our-opencodes@latest install --no-tui --model=openai/gpt-5.3-codex --tmux=no --skills=yes
```

The installer automatically:
- Adds the plugin to `~/.config/opencode/opencode.json`
- Generates agent model mappings in `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`)
- Generates a single-model manual preset by default; if you want multi-step failover, edit fallback chains and re-enable fallback afterward

Important:
- Re-running `install` or `models` rewrites the generated `manual` preset with the newly chosen single-model assignment
- If you maintain custom per-agent models or fallback chains, reapply those edits after rerunning the installer
- Re-running the installer rewrites the entire lite config file, so `.jsonc` comments and unrelated manual edits in that file are not preserved
- The generated installer config does not add automatic backup models; if you want failover, edit fallback chains yourself afterward

**Crucial Advice for the User:**
- They can easily assign **different models to different agents** by editing `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`).
- If they later switch to models from another provider, update this file and authenticate that provider in OpenCode.
- Read generated `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`) file and report the model configuration.

### Step 4: Authenticate the Provider

Ask user to authenticate the provider referenced by their chosen models.
Don't run it yourself, it requires user interaction.

```bash
opencode auth login
# Select the provider that matches the model ids in their preset
```

Examples:
- `openai/...` models -> authenticate the OpenAI-compatible provider
- `google/antigravity-...` models -> authenticate Antigravity or the Google-backed provider used in OpenCode
- `chutes/...` models -> authenticate the Chutes provider in OpenCode

---

## Troubleshooting

### Installer Fails

Check the expected config format:
```bash
bunx oh-our-opencodes@latest install --help
```

Then manually create the config files at:
- `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`)

### Agents Not Responding

1. Check your authentication:
   ```bash
   opencode auth status
   ```

2. Verify your config file exists and is valid:
   ```bash
   cat ~/.config/opencode/oh-our-opencodes.json
   ```

3. Check that the model ids in `~/.config/opencode/oh-our-opencodes.json` match providers you have authenticated in OpenCode

### Authentication Issues

If providers are not working:

1. Check your authentication status:
   ```bash
   opencode auth status
   ```

2. Re-authenticate if needed:
   ```bash
   opencode auth login
   ```

3. Verify your preset points at the models you expect:
   ```bash
   cat ~/.config/opencode/oh-our-opencodes.json
   ```

### Tmux Integration Not Working

Make sure you're running OpenCode with the `--port` flag and the port matches your `OPENCODE_PORT` environment variable:

```bash
tmux
export OPENCODE_PORT=4096
opencode --port 4096
```

See the [Quick Reference](quick-reference.md#tmux-integration) for more details.

---

## Uninstallation

1. **Remove the plugin from your OpenCode config**:

   Edit `~/.config/opencode/opencode.json` and remove `"oh-our-opencodes"` from the `plugin` array.

2. **Remove configuration files (optional)**:
   ```bash
   rm -f ~/.config/opencode/oh-our-opencodes.json
   rm -f .opencode/oh-our-opencodes.json
   ```

3. **Remove skills (optional)**:
   ```bash
   npx skills remove simplify
   npx skills remove agent-browser
   ```
