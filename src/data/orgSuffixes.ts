/**
 * Company / organisation name suffixes common in Kenya. The org recognizer
 * captures the capitalised tokens immediately preceding one of these.
 *
 * Kept case-sensitive in the recognizer so that ordinary lowercase words
 * ("limited time", "the group") do not trigger a match.
 */
export const ORG_SUFFIXES: readonly string[] = [
  "Limited",
  "Ltd",
  "PLC",
  "LLP",
  "LLC",
  "SACCO",
  "Sacco",
  "Enterprises",
  "Holdings",
  "Investments",
  "Ventures",
  "Agencies",
  "Contractors",
  "Company",
  "Group",
];
