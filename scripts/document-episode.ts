import { writeFileSync } from "node:fs";
import { clues, puzzles, finale } from "../server/episode.ts";
import { ROLES } from "../shared/world.ts";
let out =
  "# Puzzle specification — author / facilitator spoilers\n\nThis document is generated from the deterministic server episode. Never serve it as a client asset. Run `npm run docs:episode` after content edits.\n\n```mermaid\ngraph TD\n";
for (const q of puzzles) {
  out += `  ${q.id}["${q.id}: ${q.title}"]\n`;
  for (const p of q.prerequisites) out += `  ${p} --> ${q.id}\n`;
}
out += "```\n\n";
for (const q of puzzles) {
  out += `## ${q.id} · ${q.title}\n\n- Act: ${q.act + 1}; location: ${q.location}; interaction: ${q.kind}.\n- Narrative purpose: ${q.purpose}\n- Initially known: ${q.prompt}\n- Prerequisites: ${q.prerequisites.join(", ") || "None; arrival."}\n- Required contributions: ${[...new Set(q.needs.map((id) => clues.find((c) => c.id === id)!.role))].map((r) => ROLES.find((v) => v.id === r)!.name).join(", ")}.\n\n### Discoverable evidence / exact reasoning\n\n`;
  for (const id of q.needs) {
    const c = clues.find((c) => c.id === id)!;
    out += `- **${c.title}** (${c.role}, ${c.location}, ${c.hotspot}): ${c.text}\n`;
  }
  out += `\n### Solution and feedback\n\n${q.answer.length ? q.answer.map((a, i) => `${i + 1}. ${q.slots[i].label}: **${a}**`).join("\n") : finale.map((f) => `- ${f.role} at ${f.location}: **${f.answer}**. ${f.prompt}`).join("\n")}\n\nIncorrect attempt: ${q.wrong}\n\nHints (explicitly requested; unrelated content stays hidden):\n\n${q.hints.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nWorld change: ${q.result}\n\nRecovery: observations and shared evidence persist; clues remain at their original objects; the player’s answer draft persists across devices and restarts. Closing or disconnecting consumes nothing. Completed deductions are idempotent. Finale latches remain armed indefinitely. Failed attempts consume no resources.\n\n`;
}
writeFileSync("docs/PUZZLES.md", out);
