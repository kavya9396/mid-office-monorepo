import groupMock from "../../../../mock/drs/group-drs.json";
import retailMock from "../../../../mock/drs/retail-drs.json";

export type SummaryBusinessType = "RETAIL" | "GROUP";

export interface SummaryRecord {
  applicationNo: string;
  taskId: string;
  customerName: string;
  productName: string;
  businessType: string;
  appliedSa?: number | string | null;
  annualPremium?: number | string | null;
  status?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchSummaryRecord(
  businessType: SummaryBusinessType,
  applicationNo: string,
): Promise<SummaryRecord | undefined> {
  await wait(250);

  const records =
    businessType === "RETAIL" ? retailMock.records : groupMock.records;

  return records.find((record) => record.applicationNo === applicationNo);
}
