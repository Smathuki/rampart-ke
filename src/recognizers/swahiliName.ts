import type { Recognizer } from "../types.js";
import { scan } from "./util.js";

/**
 * Personal names introduced by a Swahili / Sheng (or code-switched English) cue.
 *
 * The base Rampart model is trained on Western names and misses many Kenyan
 * names in Swahili context — e.g. it leaves "Kamau" in "Jina langu ni Kamau"
 * and "Otieno" in "Mimi ni Otieno". The cue phrase is a high-precision anchor,
 * so we capture the following 1–2 capitalised tokens and redact them.
 *
 * The regex is case-sensitive on purpose: cues allow an optional leading capital
 * (sentence start), but the captured name MUST start uppercase, so lowercase
 * common words ("mimi ni mwalimu" → "mwalimu") never match. Only the name
 * (group 1) is redacted, not the cue.
 */
const NAME_CUE =
  /\b(?:[Jj]ina\s+langu\s+ni|[Jj]ina\s+lake\s+ni|[Jj]ina\s+ni|[Nn]inaitwa|[Nn]aitwa|[Aa]naitwa|[Mm]imi\s+ni|[Mm]y\s+name\s+is)\s+([A-Z][a-zA-Z'’]+(?:\s+[A-Z][a-zA-Z'’]+)?)/gd;

export const swahiliNameRecognizer: Recognizer = {
  label: "NAME_KE",
  priority: 70,
  detect(text) {
    return scan(text, NAME_CUE, "NAME_KE", 1, 0.85);
  },
};
