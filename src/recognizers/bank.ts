import type { Recognizer } from "../types.js";
import { scan } from "./util.js";

/**
 * Bank account number, context-anchored to "a/c" / "account" / "acct". 6–16
 * digits covers Kenyan bank account formats without matching bare numbers.
 */
const BANK_ACCOUNT =
  /\b(?:a\/c|acct|acc(?:ount)?(?:\s*(?:no\.?|number))?)\b\D{0,12}(\d{6,16})\b/gid;

/**
 * Kenyan passport number, context-anchored to the word "passport": one or two
 * letters followed by 6–7 digits, e.g. `A1234567` / `AK0123456`.
 */
const PASSPORT =
  /\b[Pp]assport\b(?:\s*(?:[Nn][Oo]\.?|[Nn]umber))?[\s:.#-]{0,6}([A-Z]{1,2}\d{6,7})\b/gd;

export const bankAccountRecognizer: Recognizer = {
  label: "BANK_ACCOUNT",
  priority: 80,
  detect(text) {
    return scan(text, BANK_ACCOUNT, "BANK_ACCOUNT", 1);
  },
};

export const passportRecognizer: Recognizer = {
  label: "PASSPORT",
  priority: 85,
  detect(text) {
    return scan(text, PASSPORT, "PASSPORT", 1);
  },
};
