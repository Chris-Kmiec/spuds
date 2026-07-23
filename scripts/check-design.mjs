// Design-system guardrail: fails if emoji appear in src/ outside the whitelist.
// Whitelisted uses (see DESIGN.md): empty-state/confirmation illustrations,
// reputation badges (product content), and the single greeting wave.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SRC = join(ROOT, "src");

const WHITELIST = new Set([
  "src/app/page.tsx", // landing mascot
  "src/lib/constants.ts", // reputation badges
  "src/app/(app)/events/[id]/review-form.tsx", // confirmation moment
  "src/app/(app)/discover/page.tsx", // greeting + empty states
  "src/app/(app)/communities/page.tsx", // empty state
  "src/app/(app)/create/manage/page.tsx", // empty state
]);

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const failures = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (/\.(tsx?|css)$/.test(name)) {
      const rel = relative(ROOT, full).replaceAll("\\", "/");
      if (WHITELIST.has(rel)) continue;
      const lines = readFileSync(full, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (EMOJI.test(line)) failures.push(`${rel}:${i + 1}  ${line.trim().slice(0, 80)}`);
      });
    }
  }
}

walk(SRC);

if (failures.length > 0) {
  console.error("Emoji found outside the design-system whitelist (see DESIGN.md):\n");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
console.log("design check passed: no stray emoji in UI chrome");
