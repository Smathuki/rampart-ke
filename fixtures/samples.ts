/** Sample inputs shared by the integration test and the browser demo. All
 *  names/numbers are fictional. Each sample exercises several recognizers so a
 *  demo viewer sees the breadth of Kenyan PII handled on-device. */
export interface Sample {
  readonly title: string;
  readonly text: string;
}

export const SAMPLES: readonly Sample[] = [
  {
    title: "M-Pesa confirmation SMS",
    text:
      "QFT3X1AB9Z Confirmed. Ksh2,500.00 sent to JOHN OCHIENG 0712345678 on " +
      "30/6/26 at 1:05 PM. New M-PESA balance is Ksh10,300.00.",
  },
  {
    title: "Government / eCitizen intake form",
    text:
      "My name is Wanjiku Kamau. KRA PIN A012345678Z, National ID No. 23456789. " +
      "I live in Kilimani, Nairobi along Ngong Road, P.O. Box 12345-00100. " +
      "Email wanjiku@example.co.ke. SHA number 1122334455.",
  },
  {
    title: "Swahili / Sheng mix",
    text:
      "Jina langu ni Kamau na ninaishi Roysambu, Nairobi. Nipigie 0722123456 " +
      "au lipa kwa Paybill 888880. Kampuni yangu ni Acme Holdings.",
  },
  {
    title: "Telemedicine / health intake",
    text:
      "Patient: Achieng Otieno, phone 0733221100. SHIF number 778899001, " +
      "legacy NHIF 1234567. Reports chest pain; lives in Buruburu, Nairobi. " +
      "Next of kin Hassan Abdi on +254722000111.",
  },
  {
    title: "Fintech loan application",
    text:
      "Applicant Kipchoge Cheruiyot, ID number 29384756, KRA PIN A004567812K. " +
      "Salary paid to A/c 0123456789 at Equity. Repay via Paybill 522522. " +
      "Mobile 0110234567. Maisha Namba 100200300.",
  },
  {
    title: "Customer support chat",
    text:
      "Hi, I'm Mwangi Njoroge. I paid Till 832909 but the goods never came. " +
      "My M-PESA code is SJ38XK21LP and my number is 0700111222. Help please!",
  },
  {
    title: "HR / payroll record",
    text:
      "Employee Were Wafula. KRA PIN P051234567Q, NSSF No. 998877, " +
      "Passport No. A1234567. Net pay to A/c 4455667788, Co-op Bank. " +
      "Based in Nakuru.",
  },
  {
    title: "Business KYC / supplier onboarding",
    text:
      "Vendor: Tunaweza Logistics Limited, KRA PIN P987654321B. " +
      "Pay via Paybill 247247. Director Atieno Were, +254733445566. " +
      "Offices on Thika Road, Kasarani, Nairobi County.",
  },
  {
    title: "Clean text (no PII — should NOT redact)",
    text:
      "The quarterly review meeting is scheduled for Tuesday at 10am. Please " +
      "bring the printed agenda and the updated budget figures for the team.",
  },
];
