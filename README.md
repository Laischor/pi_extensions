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
