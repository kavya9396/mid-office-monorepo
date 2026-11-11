import pivvDrsMock from "../../../../mock/drs/pivv-drs.json";

export interface PivvBannerLine {
  text: string;
  emphasis?: boolean;
}

export interface PivvDetails {
  fupCode: string;
  profile: string;
  raisedDate: string;
  raisedRemark: string;
}

export interface PivvDrsRecord {
  applicationNo: string;
  applicantName: string;
  applicationLabel: string;
  lines: PivvBannerLine[];
  pivvDetails: PivvDetails;
}

export interface PivvDrsData {
  record: PivvDrsRecord;
  decisionOptions: string[];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchPivvDrs(
  applicationNo: string,
): Promise<PivvDrsData | null> {
  await wait(250);

  const record = pivvDrsMock.records.find(
    (item) => item.applicationNo === applicationNo,
  );

  return record
    ? { record, decisionOptions: pivvDrsMock.pivvDecisionOptions }
    : null;
}
