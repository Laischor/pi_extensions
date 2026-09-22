/**
 * Vim/readline navigation in pi's selection dialogs.
 *
 * Pi's selection windows (model selector, session picker, /tree, ctx.ui.select,
 * permission prompts, ...) move with the arrow keys only. This extension adds
 * Ctrl+N (next) and Ctrl+P (previous) as extra defaults for `tui.select.down`
 * and `tui.select.up`, so every select list understands the vim bindings without
 * editing keybindings.json.
 *
 * It edits the shared keybinding *definitions* instead of the current user
 * bindings on purpose: pi rebuilds its KeybindingsManager on /reload (re-reading
 * keybindings.json), but the definition objects are module singletons. The added
 * keys therefore survive a reload and are inherited by managers created later
 * (e.g. the session picker). An explicit `tui.select.*` entry in
 * keybindings.json still wins, as usual.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getKeybindings, type KeyId } from "@earendil-works/pi-tui";

type SelectAction = "tui.select.down" | "tui.select.up";

/** Extra default keys per selection action. */
const SELECT_VIM_KEYS: ReadonlyArray<{ action: SelectAction; keys: KeyId[] }> = [
	{ action: "tui.select.down", keys: ["ctrl+n"] },
	{ action: "tui.select.up", keys: ["ctrl+p"] },
];

/** Append `extra` to an action's default keys, preserving the existing ones. */
function mergeDefaultKeys(action: SelectAction, extra: KeyId[]): void {
	const definition = getKeybindings().getDefinition(action);
	if (!definition) return;

	const current = Array.isArray(definition.defaultKeys)
		? definition.defaultKeys
		: [definition.defaultKeys];
	const merged = [...current];
	for (const key of extra) {
		if (!merged.includes(key)) merged.push(key);
	}
	definition.defaultKeys = merged;
}

export default function (pi: ExtensionAPI) {
	for (const { action, keys } of SELECT_VIM_KEYS) {
		mergeDefaultKeys(action, keys);
	}

	// Rebuild the active manager's lookup tables so the new keys match right away.
	// Managers created later pick the mutated definitions up on construction.
	const keybindings = getKeybindings();
	keybindings.setUserBindings(keybindings.getUserBindings());
}
