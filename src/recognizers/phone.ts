import type { Recognizer } from "../types";
import { scan } from "./util";

/**
 * Kenyan mobile numbers in their common forms:
 *   +254 7XX XXX XXX / +2547XXXXXXXX / 2547XXXXXXXX
 *   07XX XXX XXX     / 01XX XXX XXX  (Safaricom/Airtel/Telkom and the 01 range)
 * Separators (spaces / hyphens) between groups are tolerated. The leading
 * lookbehind keeps the number from being matched as part of a longer token.
 */
const KE_PHONE = /(?<![\w+])(?:\+?254|0)[\s-]?(?:7\d{2}|1\d{2})[\s-]?\d{3}[\s-]?\d{3}\b/g;

export const phoneRecognizer: Recognizer = {
  label: "KE_PHONE",
  priority: 90,
  detect(text) {
    return scan(text, KE_PHONE, "KE_PHONE");
  },
};
