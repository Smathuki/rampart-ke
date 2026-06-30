import type { KenyanLabel } from "./types.js";

/** Human-readable descriptions, shown in the demo's detected-entity list. */
export const LABEL_DESCRIPTIONS: Record<KenyanLabel, string> = {
  KRA_PIN: "KRA PIN (tax)",
  MPESA_CODE: "M-Pesa transaction code",
  MPESA_PAYBILL: "M-Pesa Paybill / Till",
  KE_PHONE: "Kenyan phone number",
  NATIONAL_ID: "National ID number",
  MAISHA_NAMBA: "Maisha Namba",
  SHIF: "SHA / SHIF number",
  NHIF: "NHIF number (legacy)",
  NSSF: "NSSF number",
  BANK_ACCOUNT: "Bank account number",
  PASSPORT: "Passport number",
  ORG_KE: "Company / organisation",
  LOCATION_KE: "Local area / estate / road",
  NAME_KE: "Personal name (Swahili/Sheng cue)",
};
