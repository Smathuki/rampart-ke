import type { Recognizer } from "../types";
import { ORG_SUFFIXES } from "../data/orgSuffixes";
import { escapeRegExp, scan } from "./util";

/**
 * Company / organisation names: 1–4 capitalised tokens immediately followed by
 * a company suffix ("... Limited", "... SACCO", "... Holdings"). Suffixes are
 * matched case-sensitively so ordinary lowercase words ("limited time",
 * "the group") never trigger. The whole phrase is redacted to [ORG_KE_n].
 */
const SUFFIX = ORG_SUFFIXES.map(escapeRegExp).join("|");
const ORG = new RegExp(`\\b(?:[A-Z][A-Za-z&'.-]+\\s+){1,4}(?:${SUFFIX})\\b\\.?`, "g");

export const orgRecognizer: Recognizer = {
  label: "ORG_KE",
  priority: 40,
  detect(text) {
    return scan(text, ORG, "ORG_KE", 0, 0.8).map((m) => ({
      ...m,
      value: m.value.trimEnd(),
      end: m.start + m.value.trimEnd().length,
    }));
  },
};
