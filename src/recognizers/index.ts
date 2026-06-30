import type { Recognizer } from "../types";
import { kraPinRecognizer } from "./kra";
import { phoneRecognizer } from "./phone";
import { mpesaCodeRecognizer, mpesaPaybillRecognizer } from "./mpesa";
import { nationalIdRecognizer, maishaNambaRecognizer } from "./nationalId";
import { healthRecognizer } from "./health";
import { bankAccountRecognizer, passportRecognizer } from "./bank";
import { orgRecognizer } from "./org";
import { locationRecognizer } from "./location";

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
};
