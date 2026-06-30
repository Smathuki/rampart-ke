import { describe, expect, it } from "vitest";
import {
  kraPinRecognizer,
  phoneRecognizer,
  mpesaCodeRecognizer,
  mpesaPaybillRecognizer,
  nationalIdRecognizer,
  maishaNambaRecognizer,
  healthRecognizer,
  bankAccountRecognizer,
  passportRecognizer,
  orgRecognizer,
  locationRecognizer,
} from "../src/recognizers";

/** Helper: the redacted substrings a recognizer extracts from text. */
const values = (r: { detect: (t: string) => { value: string }[] }, t: string) =>
  r.detect(t).map((m) => m.value);

describe("KRA PIN", () => {
  it("matches A/P + 9 digits + letter", () => {
    expect(values(kraPinRecognizer, "PIN is A012345678Z today")).toEqual(["A012345678Z"]);
    expect(values(kraPinRecognizer, "company pin p987654321b")).toEqual(["P987654321B"]);
  });
  it("ignores wrong shapes", () => {
    expect(values(kraPinRecognizer, "B012345678Z and A01234567Z")).toEqual([]);
  });
});

describe("Kenyan phone", () => {
  it("matches +254 / 254 / 07 / 01 forms", () => {
    expect(values(phoneRecognizer, "call +254712345678")).toEqual(["+254712345678"]);
    expect(values(phoneRecognizer, "or 0712 345 678")).toEqual(["0712 345 678"]);
    expect(values(phoneRecognizer, "new line 0110000000")).toEqual(["0110000000"]);
  });
  it("ignores non-Kenyan / wrong length", () => {
    expect(values(phoneRecognizer, "us number 0612345678 length ok? no 6")).toEqual([]);
  });
});

describe("M-Pesa code", () => {
  it("matches a 10-char code with nearby context", () => {
    expect(values(mpesaCodeRecognizer, "QFT3X1AB9Z Confirmed. Ksh500 received.")).toEqual([
      "QFT3X1AB9Z",
    ]);
  });
  it("does NOT match a bare 10-char token without context", () => {
    const longNoContext =
      "Your shipment ABCD123456 left the central warehouse this morning as planned.";
    expect(values(mpesaCodeRecognizer, longNoContext)).toEqual([]);
  });
  it("ignores all-letter shouting words", () => {
    expect(values(mpesaCodeRecognizer, "MPESA MANAGEMENT confirmed the plan")).toEqual([]);
  });
});

describe("M-Pesa paybill", () => {
  it("matches a keyworded short code only", () => {
    expect(values(mpesaPaybillRecognizer, "lipa kwa Paybill 888880 leo")).toEqual(["888880"]);
    expect(values(mpesaPaybillRecognizer, "the year 888880 passed")).toEqual([]);
  });
});

describe("National ID / Maisha Namba", () => {
  it("captures only the digits after an ID cue", () => {
    expect(values(nationalIdRecognizer, "National ID No. 23456789.")).toEqual(["23456789"]);
    expect(values(nationalIdRecognizer, "Kitambulisho 1234567")).toEqual(["1234567"]);
  });
  it("ignores bare numbers without a cue", () => {
    expect(values(nationalIdRecognizer, "invoice 12345678 is due")).toEqual([]);
  });
  it("matches Maisha Namba", () => {
    expect(values(maishaNambaRecognizer, "Maisha Namba 123456789012")).toEqual(["123456789012"]);
  });
});

describe("Health & social security", () => {
  it("labels SHA/SHIF/NHIF/NSSF distinctly", () => {
    expect(healthRecognizer.detect("SHA number 1122334455")[0]?.label).toBe("SHIF");
    expect(healthRecognizer.detect("old NHIF 998877")[0]?.label).toBe("NHIF");
    expect(healthRecognizer.detect("NSSF no 445566")[0]?.label).toBe("NSSF");
  });
});

describe("Bank & passport", () => {
  it("captures account digits after a cue", () => {
    expect(values(bankAccountRecognizer, "a/c 0112345678 at the bank")).toEqual(["0112345678"]);
  });
  it("captures a passport number after the cue", () => {
    expect(values(passportRecognizer, "Passport No. A1234567")).toEqual(["A1234567"]);
  });
});

describe("Company names", () => {
  it("matches capitalised tokens + suffix", () => {
    expect(values(orgRecognizer, "I work at Acme Holdings now")).toEqual(["Acme Holdings"]);
    expect(values(orgRecognizer, "paid Safaricom PLC today")).toEqual(["Safaricom PLC"]);
  });
  it("ignores lowercase common words", () => {
    expect(values(orgRecognizer, "this is a limited time offer group hug")).toEqual([]);
  });
});

describe("Locations", () => {
  it("redacts estates, roads and P.O. boxes", () => {
    expect(values(locationRecognizer, "I live in Roysambu")).toEqual(["Roysambu"]);
    expect(values(locationRecognizer, "drive along Ngong Road today")).toContain("Ngong Road");
    expect(values(locationRecognizer, "P.O. Box 12345-00100")).toContain("P.O. Box 12345-00100");
  });
  it("KEEPS counties (does not redact them)", () => {
    expect(values(locationRecognizer, "Nairobi Nakuru Kisumu")).toEqual([]);
  });
});
