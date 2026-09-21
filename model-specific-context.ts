/**
 * Load model-specific context files when the model changes.
 *
 * Place model context files in ~/.pi/agent/models/:
 * - ~/.pi/agent/models/claude-sonnet-4.md
 * - ~/.pi/agent/models/gpt-4o.md
 * - ~/.pi/agent/models/generic.md (fallback for any model)
 *
 * The content is injected into the system prompt for each turn.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const modelsDir = join(homedir(), ".pi", "agent", "models");

/**
 * Read a model-specific context file.
 * Tries: <model-id>.md, <provider>.md, then generic.md
 */
function getModelContext(model: { provider: string; id: string }): string | undefined {
	const tryRead = (filename: string): string | undefined => {
		try {
			return readFileSync(join(modelsDir, filename), "utf8");
		} catch {
			return undefined;
		}
	};

	// Try model-specific file first
	let context = tryRead(`${model.id}.md`);
	if (context) return context.trim();

	// Try provider-specific file
	context = tryRead(`${model.provider}.md`);
	if (context) return context.trim();

	// Try generic fallback
	context = tryRead("generic.md");
	if (context) return context.trim();

	return undefined;
}

export default function (pi: ExtensionAPI) {
	let currentModel: { provider: string; id: string } | undefined;
	let modelContext: string | undefined;

	// Load context when model changes
	pi.on("model_select", async (event, _ctx) => {
		currentModel = { provider: event.model.provider, id: event.model.id };
		modelContext = getModelContext(currentModel);
	});

	// Inject context into system prompt for each turn
	pi.on("before_agent_start", async (event, ctx) => {
		// Reload context in case model changed outside of model_select event
		if (ctx.model) {
			currentModel = { provider: ctx.model.provider, id: ctx.model.id };
			modelContext = getModelContext(currentModel);
		}

		if (!modelContext) return;

		return {
			systemPrompt:
				event.systemPrompt +
				"\n\n" +
				"=== Model-Specific Context ===\n" +
				modelContext,
		};
	});
}
