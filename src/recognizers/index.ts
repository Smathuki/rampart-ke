import type { Recognizer } from "../types.js";
import { kraPinRecognizer } from "./kra.js";
import { phoneRecognizer } from "./phone.js";
import { mpesaCodeRecognizer, mpesaPaybillRecognizer } from "./mpesa.js";
import { nationalIdRecognizer, maishaNambaRecognizer } from "./nationalId.js";
import { healthRecognizer } from "./health.js";
import { bankAccountRecognizer, passportRecognizer } from "./bank.js";
import { orgRecognizer } from "./org.js";
import { locationRecognizer } from "./location.js";
import { swahiliNameRecognizer } from "./swahiliName.js";

/** The full built-in Kenyan recognizer set, used by default. */
export const DEFAULT_RECOGNIZERS: readonly Recognizer[] = [
  kraPinRecognizer,
  mpesaCodeRecognizer,
  mpesaPaybillRecognizer,
  phoneRecognizer,
  passportRecognizer,
  bankAccountRecognizer,
  maishaNambaRecognizer,
  nationalIdRecognizer,
  healthRecognizer,
  swahiliNameRecognizer,
  orgRecognizer,
  locationRecognizer,
];

export {
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
  swahiliNameRecognizer,
};
