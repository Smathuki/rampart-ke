import { describe, expect, it } from "vitest";
import { createKenyanGuard } from "../src/index";
import { SAMPLES } from "../fixtures/samples";

describe("integration: Kenyan layer + upstream heuristics (offline)", () => {
  it("redacts Kenyan IDs, keeps the county, masks email, and round-trips", async () => {
    // heuristicsOnly skips the ONNX model → fully offline & fast. Names are not
    // caught here (that's the model's job, exercised in the browser demo / E2E).
    const guard = await createKenyanGuard({ heuristicsOnly: true });
    const intake = SAMPLES[1]!.text;
    const { text, entities } = await guard.protect(intake);

    const labels = entities.map((e) => e.label);
    expect(labels).toContain("KRA_PIN");
    expect(labels).toContain("NATIONAL_ID");
    expect(labels).toContain("SHIF");
    expect(labels).toContain("LOCATION_KE");

    // Our friendly placeholders pass through the upstream guard untouched.
    expect(text).toContain("[KRA_PIN_1]");
    expect(text).toContain("[NATIONAL_ID_1]");

    // Raw Kenyan values are gone.
    expect(text).not.toContain("A012345678Z");
    expect(text).not.toContain("23456789");

    // Coarse geography (county) is kept; the estate is redacted.
    expect(text).toContain("Nairobi");
    expect(text).not.toContain("Kilimani");

    // The upstream deterministic layer still catches email.
    expect(text).toContain("[EMAIL_1]");
    expect(text).not.toContain("wanjiku@example.co.ke");

    // Full reveal reconstructs the original input exactly.
    expect(guard.reveal(text)).toBe(intake);
  });
});

// Opt-in full-model end-to-end (downloads the ONNX weights). Run with:
//   RAMPART_KE_E2E=1 npm test
const E2E = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  ?.RAMPART_KE_E2E;
describe.skipIf(!E2E)("e2e: full model (downloads weights)", () => {
  it("redacts a contextual name with NO token-edge fragment left behind", async () => {
    const guard = await createKenyanGuard({ device: "cpu" });
    const { text } = await guard.protect("My name is John Ochieng and I am here.");
    // The whole surname must be gone — not "Ochien" with a trailing "g".
    expect(text).not.toContain("Ochieng");
    expect(text).not.toMatch(/Ochien|chieng/i);
  });
});
