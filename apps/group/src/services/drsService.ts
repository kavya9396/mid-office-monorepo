import groupMock from "../../../../mock/drs/group-drs.json";

export interface DrsRecord {
  applicationNo: string;
  taskId: string;
  customerName: string;
  productName: string;
  businessType: string;
  appliedSa?: number | string | null;
  annualPremium?: number | string | null;
  policyTerm?: number;
  premiumPayingTerm?: number;
  status?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchGroupDrsRecord(
  applicationNo: string,
): Promise<DrsRecord | undefined> {
  await wait(250);

  return groupMock.records.find(
    (record) => record.applicationNo === applicationNo,
  );
}
