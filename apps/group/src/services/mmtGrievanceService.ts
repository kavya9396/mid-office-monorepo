import type { BannerRowDetail } from "@insurance-poc/common/applicant-banner";
import {
  grievanceColumns,
  type GrievanceHistoryRow,
} from "@insurance-poc/common/grievance-history";
import type { Column } from "@insurance-poc/ui";
import {
  formatDateTime,
  getDrsRoleType,
  getSessionBusinessType,
  getSessionUser,
} from "@insurance-poc/utils";

export type MmtGrievanceFetchRequest = {
  applicationNo: string;
  lob: string;
  partyId?: string;
  lifeNumber?: string;
  partyFilterComplete?: boolean;
};

export type MmtGrievanceMemberContext = {
  applicationNo: string;
  partyId?: string;
  lifeNumber?: string;
  transactionId?: string | null;
};

export type MmtDrsShell = {
  applicationNo: string;
  applicantName: string;
  applicationLabel: string;
  rowDetails: BannerRowDetail[];
  grievanceHistoryTitle: string;
  tpaGrievanceTitle: string;
  grievanceHistoryColumns: Column<GrievanceHistoryRow>[];
  tpaGrievanceColumns: Column<GrievanceHistoryRow>[];
  memberContext: MmtGrievanceMemberContext;
};

export type MmtGrievanceTables = {
  grievanceHistory: GrievanceHistoryRow[];
  openGrievances: GrievanceHistoryRow[];
};

export type MmtGrievanceSaveRow = {
  fupCode: string;
  profile: string;
  userRemarks: string;
};

export type MmtGrievanceSaveRequest = {
  transactionTime: string;
  transactionId: string | null;
  applicationNo: string;
  partyId?: string;
  lifeNumber?: string;
  userId: string;
  userRole: string;
  grievances: MmtGrievanceSaveRow[];
};

const GRIEVANCE_ROW_KEYS: (keyof GrievanceHistoryRow)[] = [
  "userName",
  "fupCode",
  "profile",
  "grievanceRemarks",
  "tpaRemark",
  "raisedDate",
  "updatedDate",
  "raisedBy",
  "updatedBy",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function payloadData(payload: unknown): Record<string, unknown> {
  const root = isRecord(payload) ? payload : {};
  return isRecord(root.data) ? root.data : root;
}

function findCommonSection(
  commonSection: unknown,
  name: string,
): Record<string, unknown> | null {
  if (!Array.isArray(commonSection)) return null;
  return commonSection.filter(isRecord).find((entry) => entry.name === name) ?? null;
}

function headerText(column: unknown): string {
  return isRecord(column) ? readText(column.label) : readText(column);
}

export function mapRowDetails(rowDetails: unknown): BannerRowDetail[] {
  if (!Array.isArray(rowDetails)) return [];
  return rowDetails.filter(isRecord).map((row, index) => ({
    id: typeof row.id === "number" || typeof row.id === "string" ? row.id : index,
    fields: Array.isArray(row.fields)
      ? row.fields
          .filter(isRecord)
          .map((field) => ({ name: readText(field.name), value: readText(field.value) }))
      : [],
  }));
}

function fieldValue(fields: BannerRowDetail["fields"] | undefined, name: string): string {
  return readText(fields?.find((field) => field.name === name)?.value);
}

function buildGrievanceColumns(sectionValue: unknown): Column<GrievanceHistoryRow>[] {
  const section = isRecord(sectionValue) ? sectionValue : {};
  const labels = Array.isArray(section.columns)
    ? section.columns.map((column) => headerText(column))
    : [];
  const defaults = new Map(grievanceColumns.map((column) => [column.key, column]));
  return GRIEVANCE_ROW_KEYS.map((key, index) => {
    const fallback = defaults.get(key);
    return {
      key,
      header: labels[index] || fallback?.header || key,
      width: fallback?.width,
    };
  });
}

function readApplicantProfile(member: Record<string, unknown>): Record<string, unknown> | null {
  const subSections = member.subSections;
  if (!Array.isArray(subSections)) return null;
  const profileSection = subSections
    .filter(isRecord)
    .find((entry) => entry.name === "applicantProfile");
  const value = profileSection?.value;
  return isRecord(value) ? value : null;
}

export function mapMmtDrsShell(payload: unknown, requestedApplicationNo: string): MmtDrsShell | null {
  const root = payloadData(payload);
  const members = Array.isArray(root.membersDetails)
    ? root.membersDetails.filter(isRecord)
    : [];
  const member = members[0];
  if (!member) return null;

  const rowDetails = mapRowDetails(member.rowDetails);
  if (rowDetails.length === 0) return null;

  const nameRow = rowDetails.find((row) => row.id === 0);
  const applicantName = fieldValue(nameRow?.fields, "Name");
  const appNoFromBanner =
    fieldValue(nameRow?.fields, "App No.") || fieldValue(nameRow?.fields, "App No");
  const applicationNo = readText(root.applicationNo) || appNoFromBanner || requestedApplicationNo;

  const historySection = findCommonSection(root.commonSection, "grievanceHistory");
  const tpaSection = findCommonSection(root.commonSection, "tpaGrievanceDetails");
  const profile = readApplicantProfile(member);

  return {
    applicationNo,
    applicantName,
    applicationLabel: appNoFromBanner ? `App No. - ${appNoFromBanner}` : `App No. - ${applicationNo}`,
    rowDetails,
    grievanceHistoryTitle: readText(historySection?.label) || "Grievance History",
    tpaGrievanceTitle: readText(tpaSection?.label) || "TPA Grievance Details",
    grievanceHistoryColumns: buildGrievanceColumns(historySection?.value),
    tpaGrievanceColumns: buildGrievanceColumns(tpaSection?.value),
    memberContext: {
      applicationNo,
      partyId: readText(profile?.partyId) || undefined,
      lifeNumber: readText(profile?.lifeNumber) || undefined,
      transactionId: readText(root.transactionId) || null,
    },
  };
}

function formatGrievanceDate(value: unknown): string {
  const raw = readText(value);
  if (!raw) return "-";
  const formatted = formatDateTime(raw);
  return formatted.length > 0 ? formatted : raw;
}

function mapGrievanceApiRow(row: Record<string, unknown>): GrievanceHistoryRow {
  const raisedBy = readText(row.raisedBy);
  return {
    userName: raisedBy || readText(row.raisedRole),
    fupCode: readText(row.fupCode),
    profile: readText(row.profile),
    grievanceRemarks: readText(row.userRemarks),
    tpaRemark: readText(row.tpaRemark),
    raisedDate: formatGrievanceDate(row.raisedDate),
    updatedDate: formatGrievanceDate(row.updatedDate),
    raisedBy,
    updatedBy: readText(row.updatedBy) || "-",
  };
}

export function mapMmtGrievanceFetchPayload(payload: unknown): MmtGrievanceTables {
  const envelope = isRecord(payload) ? payload : {};
  if (readText(envelope.status).toUpperCase() === "FAILURE") {
    throw new Error(readText(envelope.message) || "Unable to fetch grievances.");
  }

  const data = isRecord(envelope.data) ? envelope.data : envelope;
  const history = Array.isArray(data.grievanceHistory)
    ? data.grievanceHistory.filter(isRecord).map(mapGrievanceApiRow)
    : [];
  const open = Array.isArray(data.openGrievances)
    ? data.openGrievances.filter(isRecord).map(mapGrievanceApiRow)
    : [];

  return { grievanceHistory: history, openGrievances: open };
}

export function buildMmtGrievanceFetchRequest(
  context: MmtGrievanceMemberContext,
): MmtGrievanceFetchRequest {
  const businessType = getSessionBusinessType();
  const lob = businessType === "RETAIL" ? "R" : "G";

  const request: MmtGrievanceFetchRequest = {
    applicationNo: context.applicationNo,
    lob,
    partyFilterComplete: true,
  };

  if (context.partyId) request.partyId = context.partyId;
  if (context.lifeNumber) request.lifeNumber = context.lifeNumber;
  return request;
}

export function buildMmtGrievanceSaveRequest(
  context: MmtGrievanceMemberContext,
  rows: GrievanceHistoryRow[],
): MmtGrievanceSaveRequest {
  const user = getSessionUser();
  const userId = user?.username?.trim() ?? "";
  const userRole = getDrsRoleType().trim() || "MMT";

  return {
    transactionTime: new Date().toISOString().slice(0, 19),
    transactionId: context.transactionId ?? null,
    applicationNo: context.applicationNo,
    partyId: context.partyId,
    lifeNumber: context.lifeNumber,
    userId,
    userRole,
    grievances: rows.map((row) => ({
      fupCode: row.fupCode,
      profile: row.profile,
      userRemarks: row.tpaRemark.trim(),
    })),
  };
}

export function readGrievanceApiMessage(payload: unknown): string {
  if (!isRecord(payload)) return "Request failed.";
  return readText(payload.message) || "Request failed.";
}

export function isGrievanceApiFailure(payload: unknown): boolean {
  return readText(isRecord(payload) ? payload.status : "").toUpperCase() === "FAILURE";
}
