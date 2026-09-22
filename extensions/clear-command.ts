/**
 * Add /clear as an alias for pi's built-in /new.
 *
 * Other coding agents use /clear; pi names the fresh-session command /new.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
	pi.registerCommand("clear", {
		description: "Clear conversation and start a new session (alias for /new)",
		handler: async (_args, ctx) => {
			await ctx.newSession();
		},
	});
}
