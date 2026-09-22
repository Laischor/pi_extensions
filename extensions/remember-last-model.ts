/**
 * Remember the last selected model across /new and fresh `pi` launches.
 *
 * Pi only persists defaultProvider/defaultModel on Ctrl+S in /model.
 * A stale or missing default falls back to the first model in models.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const agentDir = join(homedir(), ".pi", "agent");
const lastModelPath = join(agentDir, "last-model.json");
const settingsPath = join(agentDir, "settings.json");

type LastModel = {
	provider: string;
	modelId: string;
};

function readLastModel(): LastModel | undefined {
	try {
		const parsed = JSON.parse(readFileSync(lastModelPath, "utf8")) as Partial<LastModel>;
		if (typeof parsed.provider === "string" && typeof parsed.modelId === "string") {
			return { provider: parsed.provider, modelId: parsed.modelId };
		}
	} catch {
		// First run, or the sidecar is unreadable.
	}
	return undefined;
}

function persist(provider: string, modelId: string): void {
	writeFileSync(lastModelPath, `${JSON.stringify({ provider, modelId }, null, 2)}\n`);
	try {
		const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as Record<string, unknown>;
		if (settings.defaultProvider === provider && settings.defaultModel === modelId) {
			return;
		}
		settings.defaultProvider = provider;
		settings.defaultModel = modelId;
		writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
	} catch {
		// Sidecar is enough for /new; settings.json is best-effort for the next launch.
	}
}

function persistCurrent(ctx: ExtensionContext): void {
	if (ctx.model) {
		persist(ctx.model.provider, ctx.model.id);
	}
}

function hasUserMessage(ctx: ExtensionContext): boolean {
	return ctx.sessionManager.getEntries().some(
		(entry) => entry.type === "message" && entry.message.role === "user",
	);
}

export default function (pi: ExtensionAPI) {
	let applying = false;

	pi.on("model_select", async (event) => {
		if (applying) return;
		if (event.source !== "set" && event.source !== "cycle") return;
		persist(event.model.provider, event.model.id);
	});

	pi.on("session_before_switch", async (_event, ctx) => {
		persistCurrent(ctx);
	});

	pi.on("session_shutdown", async (_event, ctx) => {
		persistCurrent(ctx);
	});

	pi.on("session_start", async (event, ctx) => {
		if (event.reason !== "new" && event.reason !== "startup") return;
		if (event.reason === "startup" && hasUserMessage(ctx)) return;

		const last = readLastModel();
		if (!last) return;
		if (ctx.model?.provider === last.provider && ctx.model?.id === last.modelId) return;

		const model = ctx.modelRegistry.find(last.provider, last.modelId);
		if (!model) return;

		applying = true;
		try {
			await pi.setModel(model);
		} finally {
			applying = false;
		}
	});
}
