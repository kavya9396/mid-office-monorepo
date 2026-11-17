export type CmoRemarksHistoryEntry = {
  role: string;
  name: string;
  ntid: string;
  date: string;
  decision: string;
  remarks: string;
};

export type DecisionHistoryRow = {
  id: string;
  fupCode: string;
  profile: string;
  medicalTest: string;
  raisedDate: string;
  receivedDate: string;
  repeatTestCounter: string;
  cmoRemarks: string;
  cmoDecision: string;
  remarksHistory: CmoRemarksHistoryEntry[];
};

export const CMO_DECISIONS = [
  "STD",
  "Sub STD",
  "Cannot Opine",
  "Refer to 2nd Opinion",
  "DC Error",
] as const;

export const SPECIAL_MEDICAL_OPTIONS = [
  "2D ECHO",
  "CXR",
  "ECG",
  "TMT",
  "CBC",
  "Lipid Profile",
] as const;

export const ADDITIONAL_REPORT_OPTION = "Additional Report";
