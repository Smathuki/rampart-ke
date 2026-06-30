import { describe, expect, it } from "vitest";
import { detectKenyan } from "../src/premask";
import { DEFAULT_RECOGNIZERS } from "../src/recognizers";
import { KenyanEntityTable } from "../src/session";

describe("detectKenyan", () => {
  it("returns a disjoint, start-sorted set", () => {
    const text = "KRA A012345678Z, call 0712345678, lives in Roysambu.";
    const matches = detectKenyan(text, DEFAULT_RECOGNIZERS);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i]!.start).toBeGreaterThanOrEqual(matches[i - 1]!.end);
    }
    const labels = matches.map((m) => m.label);
    expect(labels).toContain("KRA_PIN");
    expect(labels).toContain("KE_PHONE");
    expect(labels).toContain("LOCATION_KE");
  });
});

describe("KenyanEntityTable", () => {
  it("masks to friendly tokens and reveals back to the original", () => {
    const table = new KenyanEntityTable();
    const text = "KRA A012345678Z and phone 0712345678";
    const matches = detectKenyan(text, DEFAULT_RECOGNIZERS);
    const { text: masked } = table.mask(text, matches);
    expect(masked).toBe("KRA [KRA_PIN_1] and phone [KE_PHONE_1]");
    expect(table.reveal(masked)).toBe(text);
  });

  it("gives the same value a stable placeholder across turns", () => {
    const table = new KenyanEntityTable();
    const a = table.placeholderFor("KRA_PIN", "A012345678Z");
    const b = table.placeholderFor("KRA_PIN", "a012345678z "); // casing/space noise
    expect(a).toBe("[KRA_PIN_1]");
    expect(b).toBe("[KRA_PIN_1]");
  });
});
