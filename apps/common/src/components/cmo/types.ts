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
