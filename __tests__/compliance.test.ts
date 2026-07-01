import { describe, expect, it } from "vitest";
import {
  ComplianceRecorder,
  generateComplianceReport,
  parsePlaceholderLabel,
} from "../src/compliance";
import type { KenyanProtectResult } from "../src/index";

describe("parsePlaceholderLabel", () => {
  it("extracts the label from a placeholder token", () => {
    expect(parsePlaceholderLabel("[KRA_PIN_1]")).toBe("KRA_PIN");
    expect(parsePlaceholderLabel("[GIVEN_NAME_12]")).toBe("GIVEN_NAME");
    expect(parsePlaceholderLabel("not a token")).toBeNull();
    expect(parsePlaceholderLabel("[lowercase_1]")).toBeNull();
  });
});

describe("ComplianceRecorder", () => {
  it("aggregates counts by label and by day", () => {
    const rec = new ComplianceRecorder();
    const day1 = new Date("2026-06-01T09:00:00Z");
    const day2 = new Date("2026-06-02T09:00:00Z");
    rec.record({ placeholders: ["[KRA_PIN_1]", "[KE_PHONE_1]", "[GIVEN_NAME_1]"] }, day1);
    rec.record({ placeholders: ["[KRA_PIN_2]", "[EMAIL_1]"] }, day1);
    rec.record({ placeholders: ["[KE_PHONE_1]"] }, day2);

    const s = rec.summary();
    expect(s.sessions).toBe(3);
    expect(s.totalRedactions).toBe(6);
    expect(s.byLabel.KRA_PIN).toBe(2);
    expect(s.byLabel.KE_PHONE).toBe(2);
    expect(s.byLabel.EMAIL).toBe(1);
    expect(s.from).toBe("2026-06-01");
    expect(s.to).toBe("2026-06-02");
    expect(s.byDay["2026-06-01"]).toBe(5);
    expect(s.byDay["2026-06-02"]).toBe(1);
  });

  it("ignores tokens that aren't placeholders", () => {
    const rec = new ComplianceRecorder();
    rec.record({ placeholders: ["[KRA_PIN_1]", "just text", ""] });
    expect(rec.summary().totalRedactions).toBe(1);
  });

  it("round-trips through toJSON/fromJSON", () => {
    const rec = new ComplianceRecorder();
    rec.record({ placeholders: ["[KRA_PIN_1]", "[EMAIL_1]"] }, new Date("2026-06-01T09:00:00Z"));
    const restored = ComplianceRecorder.fromJSON(rec.toJSON());
    expect(restored.summary()).toEqual(rec.summary());
  });

  it("stores NO personal data — even when handed a full result with values", () => {
    const rec = new ComplianceRecorder();
    const full: KenyanProtectResult = {
      text: "KRA [KRA_PIN_1], email [EMAIL_1]",
      placeholders: ["[KRA_PIN_1]", "[EMAIL_1]"],
      entities: [{ label: "KRA_PIN", placeholder: "[KRA_PIN_1]", value: "A012345678Z" }],
    };
    rec.record(full);
    const serialised = JSON.stringify(rec.toJSON());
    const { markdown, html } = generateComplianceReport(rec.summary());
    expect(serialised).not.toContain("A012345678Z");
    expect(markdown).not.toContain("A012345678Z");
    expect(html).not.toContain("A012345678Z");
  });
});

describe("generateComplianceReport", () => {
  it("renders an ODPC-style report with categories, totals, and the DPA statement", () => {
    const rec = new ComplianceRecorder();
    rec.record({ placeholders: ["[KRA_PIN_1]", "[KE_PHONE_1]"] }, new Date("2026-06-01T09:00:00Z"));
    const { markdown, html } = generateComplianceReport(rec.summary(), {
      organisation: "Acme Health Ltd",
      packageVersion: "rampart-ke@0.1.0",
    });

    expect(markdown).toContain("Data Protection Compliance Report");
    expect(markdown).toContain("Kenya Data Protection Act, 2019");
    expect(markdown).toContain("Acme Health Ltd");
    expect(markdown).toContain("KRA PIN (tax)"); // Kenyan label description
    expect(markdown).toContain("2 across 1 message(s)");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Acme Health Ltd");
  });
});
