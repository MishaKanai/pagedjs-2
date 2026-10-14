import Polisher from "./polisher.js";
import { initializeHandlers } from "../utils/handlers.js";

// Runs a stylesheet through the default handlers, as Previewer.preview() does.
function polish(css) {
	let polisher = new Polisher(false);
	polisher.setup();
	initializeHandlers(undefined, polisher, undefined);
	return polisher.add({ "http://localhost/": css });
}

describe("Polisher", () => {
	// NthOfType and Following each remove the rules they rewrite.
	it.each([
		".row:nth-of-type(2n+1) { color: red; }",
		"h1 + p:first-of-type { color: red; }"
	])("accepts %s, which both NthOfType and Following match", async (css) => {
		await expect(polish(css)).resolves.toEqual(expect.any(String));
	});
});
