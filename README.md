# Pi Extensions

## remember-last-model

This extension remembers the last selected model across `/new` commands and fresh `pi` launches.

### Problem

Pi only persists `defaultProvider` and `defaultModel` when you press `Ctrl+S` in the `/model` command. A stale or missing default falls back to the first model in `models.json`.

### Solution

This extension:
- Persists the last selected model to `~/.pi/agent/last-model.json`
- Updates `~/.pi/agent/settings.json` (the sidecar) when possible
- Automatically restores the last model on:
  - `/new` command
  - Fresh `pi` startup (if no user messages exist)

### Installation

Copy `remember-last-model.ts` to `~/.pi/agent/extensions/`.

### Events

The extension hooks into:
- `model_select` - Saves model when selected via `set` or `cycle`
- `session_before_switch` - Saves current model before switching sessions
- `session_shutdown` - Saves current model on shutdown
- `session_start` - Restores last model on `new` or `startup`

---

## model-specific-context

This extension loads model-specific context files and injects them into the system prompt.

### Usage

Place Markdown files in `~/.pi/agent/models/`:
- `claude-sonnet-4.md` - Context for Claude Sonnet 4
- `gpt-4o.md` - Context for GPT-4o
- `anthropic.md` - Context for all Anthropic models (provider fallback)
- `generic.md` - Context for all models (global fallback)

### Resolution Order

1. `<model-id>.md` (e.g., `claude-sonnet-4-20250514.md`)
2. `<provider>.md` (e.g., `anthropic.md`)
3. `generic.md` (fallback for any model)

### Example

```markdown
# ~/.pi/agent/models/claude-sonnet-4.md

You are working with Claude Sonnet 4. Always:
- Use adaptive thinking for complex tasks
- Prefer concise code examples
- Ask clarifying questions before implementing large changes
```

### Installation

Copy `model-specific-context.ts` to `~/.pi/agent/extensions/`.

### Events

The extension hooks into:
- `model_select` - Loads context file when model changes
- `before_agent_start` - Injects context into system prompt for each turn
