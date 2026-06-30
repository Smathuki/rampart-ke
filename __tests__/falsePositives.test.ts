import { describe, expect, it } from "vitest";
import { detectKenyan } from "../src/premask";
import { DEFAULT_RECOGNIZERS } from "../src/recognizers";

/** Benign text that must produce ZERO Kenyan redactions. Over-redaction kills
 *  utility and undermines the whole pitch, so this corpus is the precision gate. */
const BENIGN: readonly string[] = [
  "Your shipment ABCD123456 left the central warehouse this morning as planned.",
  "Invoice 12345678 is due at the end of the month for the office supplies order.",
  "This is a limited time offer; join the group chat for the latest news today.",
  "He paid 1234567 shillings for the seven bags of cement delivered last week.",
  "The meeting is at 10am; please bring the printed report and the agenda copies.",
  "Order 9988776655 will ship once the supplier confirms stock at the depot soon.",
];

describe("false-positive corpus", () => {
  for (const text of BENIGN) {
    it(`no redaction: "${text.slice(0, 40)}..."`, () => {
      const matches = detectKenyan(text, DEFAULT_RECOGNIZERS);
      expect(matches.map((m) => `${m.label}:${m.value}`)).toEqual([]);
    });
  }
});
