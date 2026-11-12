import type { GrievanceHistoryRow } from "@insurance-poc/common/grievance-history";
import mmtGrievanceDrsMock from "../../../../mock/drs/mmt-grievance-drs.json";
import mmtGrievanceRowsMock from "../../../../mock/drs/mmt-grievance-rows.json";

export interface MmtBannerLine {
  text: string;
  emphasis?: boolean;
}

export interface MmtGrievanceDrsRecord {
  applicationNo: string;
  applicantName: string;
  applicationLabel: string;
  lines: MmtBannerLine[];
  grievanceHistory: GrievanceHistoryRow[];
  grievanceDecision: GrievanceHistoryRow[];
}

export interface MmtGrievanceDrsData {
  record: MmtGrievanceDrsRecord;
}

type GrievanceRowsKind = "history" | "decision";

const useMock = import.meta.env.VITE_USE_MOCK !== "false";

const grievanceApi: Record<GrievanceRowsKind, { real: string }> = {
  history: { real: import.meta.env.VITE_MMT_GRIEVANCE_HISTORY_URL ?? "" },
  decision: { real: import.meta.env.VITE_MMT_GRIEVANCE_DECISION_URL ?? "" },
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toGrievanceRows(payload: unknown): GrievanceHistoryRow[] {
  return Array.isArray(payload) ? (payload as GrievanceHistoryRow[]) : [];
}

async function callGrievanceApi(
  kind: GrievanceRowsKind,
  applicationNo: string,
): Promise<GrievanceHistoryRow[]> {
  const baseUrl = grievanceApi[kind].real;
  if (!baseUrl) {
    throw new Error(
      `MMT grievance ${kind} API URL is not configured. Set VITE_MMT_GRIEVANCE_${kind.toUpperCase()}_URL or use mock mode.`,
    );
  }

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set("applicationNo", applicationNo);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `MMT grievance ${kind} request failed (${response.status}).`,
    );
  }
  return toGrievanceRows(await response.json());
}

async function fetchGrievanceRows(
  kind: GrievanceRowsKind,
  applicationNo: string,
): Promise<GrievanceHistoryRow[]> {
  if (!useMock) {
    return callGrievanceApi(kind, applicationNo);
  }

  await wait(150);
  const record = mmtGrievanceRowsMock.records.find(
    (item) => item.applicationNo === applicationNo,
  );
  return record ? record[kind] : [];
}

export function fetchGrievanceHistory(
  applicationNo: string,
): Promise<GrievanceHistoryRow[]> {
  return fetchGrievanceRows("history", applicationNo);
}

export function fetchGrievanceDecision(
  applicationNo: string,
): Promise<GrievanceHistoryRow[]> {
  return fetchGrievanceRows("decision", applicationNo);
}

export async function fetchMmtGrievanceDrs(
  applicationNo: string,
): Promise<MmtGrievanceDrsData | null> {
  await wait(250);

  const matched = mmtGrievanceDrsMock.records.find(
    (item) => item.applicationNo === applicationNo,
  );
  const banner = matched ?? (useMock ? mmtGrievanceDrsMock.records[0] : undefined);
  if (!banner) {
    return null;
  }

  const rowApplicationNo = matched ? applicationNo : banner.applicationNo;
  const [grievanceHistory, grievanceDecision] = await Promise.all([
    fetchGrievanceHistory(rowApplicationNo),
    fetchGrievanceDecision(rowApplicationNo),
  ]);

  return {
    record: { ...banner, applicationNo, grievanceHistory, grievanceDecision },
  };
}
