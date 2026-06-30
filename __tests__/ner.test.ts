import { describe, expect, it } from "vitest";
import type { NerDetector, Span } from "@nationaldesignstudio/rampart";
import { keepCounties, repairSpanBoundaries, withBoundaryRepair } from "../src/ner";

const surname = (start: number, end: number, text: string): Span => ({
  start,
  end,
  label: "SURNAME",
  score: 0.9,
  source: "ner",
  text,
});

describe("token-edge fragmentation repair", () => {
  it("swallows a trailing fragment: JOHN OCHIENG keeps no stray 'G'", () => {
    const text = "JOHN OCHIENG";
    // Model under-covers: labels "OCHIEN" (5..11), leaves "G" at 11.
    const [fixed] = repairSpanBoundaries(text, [surname(5, 11, "OCHIEN")]);
    expect(fixed!.start).toBe(5);
    expect(fixed!.end).toBe(12);
    expect(text.slice(fixed!.start, fixed!.end)).toBe("OCHIENG");
    expect(fixed!.text).toBe("OCHIENG");
  });

  it("swallows a leading fragment", () => {
    const text = "Wanjiku is here";
    const [fixed] = repairSpanBoundaries(text, [surname(2, 7, "njiku")]);
    expect(text.slice(fixed!.start, fixed!.end)).toBe("Wanjiku");
  });

  it("leaves a clean word-boundary span untouched and never crosses a space", () => {
    const text = "John Doe";
    const [fixed] = repairSpanBoundaries(text, [surname(0, 4, "John")]);
    expect(fixed!.start).toBe(0);
    expect(fixed!.end).toBe(4); // does not eat the space or "Doe"
  });

  it("preserves apostrophe names like Murang'a", () => {
    const text = "from Murang'a county";
    const [fixed] = repairSpanBoundaries(text, [surname(5, 11, "Murang")]);
    expect(text.slice(fixed!.start, fixed!.end)).toBe("Murang'a");
  });

  it("withBoundaryRepair wraps an async detector end-to-end", async () => {
    const fragmenting: NerDetector = async () => [surname(5, 11, "OCHIEN")];
    const repaired = await withBoundaryRepair(fragmenting)("JOHN OCHIENG");
    expect(repaired[0]!.end).toBe(12);
    expect(repaired[0]!.text).toBe("OCHIENG");
  });
});

describe("keep-county enforcement", () => {
  const span = (text: string, label: Span["label"]): Span => ({
    start: 0,
    end: text.length,
    label,
    score: 0.9,
    source: "ner",
    text,
  });

  it("drops a model span whose text is a county, even if mislabeled as a name", () => {
    const spans = [span("Nairobi", "GIVEN_NAME"), span("Achieng", "SURNAME")];
    const kept = keepCounties(spans);
    expect(kept.map((s) => s.text)).toEqual(["Achieng"]); // Nairobi kept (not redacted)
  });

  it("tolerates a trailing ' County'", () => {
    expect(keepCounties([span("Nakuru County", "STATE")])).toEqual([]);
  });
});
