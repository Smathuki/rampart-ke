import type { Recognizer } from "../types.js";
import { scan } from "./util.js";

/**
 * National ID number: 7–8 digits. Bare 7–8 digit numbers are everywhere
 * (invoice numbers, amounts), so this is CONTEXT-ANCHORED — only digits that
 * follow an "ID" / "national id" / "kitambulisho" cue are captured, and only
 * that digit group (not the cue word) is redacted.
 */
const NATIONAL_ID =
  /\b(?:national\s+id|id(?:\s*(?:no\.?|number|#|card))?|kitambulisho)\b\D{0,8}(\d{7,8})\b/gid;

/** Maisha Namba: the unique personal identifier rolled out from 2023/2024. */
const MAISHA = /\bmaisha\s+namba\b\D{0,10}(\d{8,12})\b/gid;

export const nationalIdRecognizer: Recognizer = {
  label: "NATIONAL_ID",
  priority: 80,
  detect(text) {
    return scan(text, NATIONAL_ID, "NATIONAL_ID", 1);
  },
};

export const maishaNambaRecognizer: Recognizer = {
  label: "MAISHA_NAMBA",
  priority: 82,
  detect(text) {
    return scan(text, MAISHA, "MAISHA_NAMBA", 1);
  },
};
