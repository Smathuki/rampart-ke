import { createKenyanGuard, LABEL_DESCRIPTIONS, type KenyanGuard } from "../src/index";
import { SAMPLES } from "../fixtures/samples";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const sampleSel = $<HTMLSelectElement>("sample");
const input = $<HTMLTextAreaElement>("input");
const runBtn = $<HTMLButtonElement>("run");
const status = $<HTMLDivElement>("status");
const output = $<HTMLPreElement>("output");
const entitiesEl = $<HTMLDivElement>("entities");

// Populate the sample picker and prefill the textarea.
SAMPLES.forEach((s, i) => {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = s.title;
  sampleSel.append(opt);
});
input.value = SAMPLES[0]!.text;
sampleSel.addEventListener("change", () => {
  input.value = SAMPLES[Number(sampleSel.value)]!.text;
  output.textContent = "";
  entitiesEl.innerHTML = "";
});

const PLACEHOLDER = /\[[A-Z][A-Z0-9_]*_\d+\]/g;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Render output with every placeholder token wrapped in <mark>. */
function highlight(text: string): string {
  return escapeHtml(text).replace(PLACEHOLDER, (t) => `<mark>${t}</mark>`);
}

// The guard is created lazily on first run (this is when the model downloads).
let guard: KenyanGuard | undefined;

runBtn.addEventListener("click", async () => {
  runBtn.disabled = true;
  try {
    if (!guard) {
      status.textContent = "Loading the on-device model (first run downloads ~15 MB, then cached)…";
      guard = await createKenyanGuard();
    }
    status.textContent = "Redacting on-device…";
    const t0 = performance.now();
    const res = await guard.protect(input.value);
    const ms = Math.round(performance.now() - t0);

    output.innerHTML = highlight(res.text);

    const upstreamCount = res.placeholders.length - res.entities.length;
    const rows = res.entities
      .map(
        (e) =>
          `<tr><td><code>${e.placeholder}</code></td><td>${LABEL_DESCRIPTIONS[e.label]}</td><td>${escapeHtml(
            e.value,
          )}</td></tr>`,
      )
      .join("");
    entitiesEl.innerHTML = res.entities.length
      ? `<label>Kenyan identifiers detected (${res.entities.length})</label>
         <table><thead><tr><th>Placeholder</th><th>Type</th><th>Original (stays on device)</th></tr></thead>
         <tbody>${rows}</tbody></table>
         <p class="foot">+ ${upstreamCount} name/address span(s) caught by the Rampart model.</p>`
      : `<p class="foot">No Kenyan identifiers found; ${upstreamCount} span(s) caught by the model.</p>`;

    status.textContent = `Done in ${ms} ms — 100% on this device.`;
  } catch (err) {
    status.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    runBtn.disabled = false;
  }
});
