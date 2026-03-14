# Antigravity Setup Guide

## Quick Setup

1. Install the plugin and choose an Antigravity model:
   ```bash
   bunx oh-our-opencodes install
   ```

2. Authenticate the provider used by that model:
   ```bash
   opencode auth login
   # Select the Google-backed provider used for your chosen model id
   ```

3. Start using:
   ```bash
   opencode
   ```

## How It Works

This fork does not ship a built-in Antigravity preset.

Use Antigravity models by:
- authenticating the provider in OpenCode
- then assigning `google/antigravity-*` model ids inside your own preset

## Models Available

### Antigravity Models (via Google Infrastructure)

1. **antigravity-gemini-3.1-pro**
   - Name: Gemini 3.1 Pro (Antigravity)
   - Context: 1M tokens, Output: 65K tokens
   - Variants: low, high thinking levels
   - Best for: Complex reasoning, high-quality outputs

2. **antigravity-gemini-3-flash**
   - Name: Gemini 3 Flash (Antigravity)
   - Context: 1M tokens, Output: 65K tokens
   - Variants: minimal, low, medium, high thinking levels
   - Best for: Fast responses, efficient agent tasks

3. **antigravity-claude-sonnet-4-5**
   - Name: Claude Sonnet 4.5 (Antigravity)
   - Context: 200K tokens, Output: 64K tokens
   - Best for: Balanced performance

4. **antigravity-claude-sonnet-4-5-thinking**
   - Name: Claude Sonnet 4.5 Thinking (Antigravity)
   - Context: 200K tokens, Output: 64K tokens
   - Variants: low (8K budget), max (32K budget)
   - Best for: Deep reasoning tasks

5. **antigravity-claude-opus-4-5-thinking**
   - Name: Claude Opus 4.5 Thinking (Antigravity)
   - Context: 200K tokens, Output: 64K tokens
   - Variants: low (8K budget), max (32K budget)
   - Best for: Most complex reasoning

### Gemini CLI Models

6. **gemini-2.5-flash**
   - Name: Gemini 2.5 Flash (Gemini CLI)
   - Context: 1M tokens, Output: 65K tokens
   - Requires: Gemini CLI authentication

7. **gemini-2.5-pro**
   - Name: Gemini 2.5 Pro (Gemini CLI)
   - Context: 1M tokens, Output: 65K tokens
   - Requires: Gemini CLI authentication

8. **gemini-3-flash-preview**
   - Name: Gemini 3 Flash Preview (Gemini CLI)
   - Context: 1M tokens, Output: 65K tokens
   - Requires: Gemini CLI authentication

9. **gemini-3.1-pro-preview**
   - Name: Gemini 3.1 Pro Preview (Gemini CLI)
   - Context: 1M tokens, Output: 65K tokens
   - Requires: Gemini CLI authentication

## Manual Configuration

If you want an Antigravity-focused setup, edit `~/.config/opencode/oh-our-opencodes.json` (or `.jsonc`) and add your own preset:

```json
{
  "preset": "antigravity-work",
  "presets": {
    "antigravity-work": {
      "orchestrator": {
        "model": "google/antigravity-gemini-3-flash",
        "skills": ["*"],
        "mcps": ["websearch"]
      },
      "explorer": {
        "model": "google/antigravity-gemini-3-flash",
        "variant": "low",
        "skills": [],
        "mcps": []
      },
      "librarian": {
        "model": "google/antigravity-gemini-3-flash",
        "variant": "low",
        "skills": [],
        "mcps": ["websearch", "context7", "grep_app"]
      },
      "designer": {
        "model": "google/antigravity-gemini-3-flash",
        "variant": "medium",
        "skills": ["agent-browser"],
        "mcps": []
      },
      "fixer": {
        "model": "google/antigravity-gemini-3-flash",
        "variant": "low",
        "skills": [],
        "mcps": []
      },
      "reviewer": {
        "model": "google/antigravity-gemini-3-flash",
        "variant": "low",
        "skills": [],
        "mcps": []
      }
    }
  }
}
```

## Troubleshooting

### Authentication Failed
```bash
# Re-authenticate
opencode auth login

# Then confirm your preset uses the expected model ids
cat ~/.config/opencode/oh-our-opencodes.json
```

### Models Not Available
```bash
# Refresh the model list in OpenCode
opencode models --refresh --verbose

# Rewrite the generated manual preset with an Antigravity model
bunx oh-our-opencodes install --no-tui --model=google/antigravity-gemini-3-flash --tmux=no --skills=no
```

### Wrong Model Selected
```bash
# Check current preset
echo $OH_OUR_OPENCODES_PRESET

# Change preset
export OH_OUR_OPENCODES_PRESET=antigravity-work
opencode
```

### Provider Connection Issues
```bash
# Re-authenticate the provider used by your model ids
opencode auth login

# Or edit ~/.config/opencode/oh-our-opencodes.json (or .jsonc)
# Change the model ids or preset, then restart OpenCode
```

## Notes

- **Terms of Service**: Using Antigravity may violate Google's ToS. Use at your own risk.
- **Performance**: Antigravity models typically have lower latency than direct API calls
- **Fallback**: Automatic fallback is not configured by the installer; add fallback chains manually if you want Gemini CLI models as backups
- **Customization**: You can mix and match any models across agents by editing the config
