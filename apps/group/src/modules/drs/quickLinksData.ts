import type { AuditTrailItem } from "@insurance-poc/common/audit-trail";
import type { OpenTaskItem } from "@insurance-poc/common/open-tasks";
import type {
  PreviousPolicyData,
  PreviousPolicyMember,
  PreviousPolicyRow,
} from "@insurance-poc/common/previous-policy";
import type { RiskMember } from "@insurance-poc/common/risk-details";

type JsonRecord = Record<string, unknown>;

/** Data of the DRS `subSections` that the Quick Link pages (opened as separate pages) show. */
export interface QuickLinksSubSections {
  previousPolicy?: PreviousPolicyData;
  openTasks?: OpenTaskItem[];
  auditTrail?: AuditTrailItem[];
  riskDetails?: RiskMember[];
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asRecord = (value: unknown): JsonRecord => (isRecord(value) ? value : {});

const recordList = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const str = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

/** Table rows from the API; rows with every value empty are dropped so the table shows "No data available". */
const tableRows = (value: unknown): JsonRecord[] =>
  recordList(value).filter((row) =>
    Object.values(row).some((cell) => (typeof cell === "string" ? cell.trim() !== "" : cell != null)),
  );

/** Finds an entry of `data.subSections[]` by name and returns its `value`. */
const findSubSection = (subSections: unknown, name: string): unknown => {
  const entry = recordList(subSections).find((item) => item.name === name);
  return entry?.value;
};

const toRow = (source: JsonRecord): PreviousPolicyRow => {
  const row: PreviousPolicyRow = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string" || typeof value === "number") row[key] = value;
  }
  return row;
};

/* ---- Previous policies ---- */

// API key -> key used by the Previous Policy table columns
const IPRU_ALIASES: Record<string, string> = { sumAssured: "appliedSumAssured" };
const IIB_ALIASES: Record<string, string> = { questCompanyName: "questCompanyNumber" };

const toAliasedRow = (source: JsonRecord, aliases: Record<string, string>): PreviousPolicyRow => {
  const row = toRow(source);
  for (const [from, to] of Object.entries(aliases)) {
    if (from in row && !(to in row)) row[to] = row[from] ?? "";
  }
  return row;
};

function mapPreviousPolicyMember(member: JsonRecord, index: number): PreviousPolicyMember {
  const ipruSource = tableRows(member.ipru);
  const memberKey = str(member.memberKey) || `member-${index}`;
  const clientRole = memberKey.toLowerCase().includes("proposer") ? "Proposer" : "Life Assured";

  return {
    key: memberKey,
    label: str(member.label) || memberKey,
    dedupe: tableRows(member.dedupePosidex).map(toRow),
    ipru: ipruSource.map((policy, policyIndex) => {
      const { riderDetails: _riderDetails, ...fields } = policy;
      return { ...toAliasedRow(fields, IPRU_ALIASES), riderIndex: policyIndex };
    }),
    riders: ipruSource.map((policy) =>
      tableRows(policy.riderDetails).map((rider) => ({ clientRole, ...toRow(rider) })),
    ),
    iib: tableRows(member.iibNonIpru).map((row) => toAliasedRow(row, IIB_ALIASES)),
    applicationForm: tableRows(member.applicationFormDetails).map(toRow),
  };
}

function mapPreviousPolicies(value: unknown): PreviousPolicyData | undefined {
  if (!isRecord(value)) return undefined;
  return {
    members: recordList(value.members).map(mapPreviousPolicyMember),
    familyPolicies: tableRows(value.familyPolicies).map(toRow),
  };
}

/* ---- Open tasks ---- */

function mapOpenTasks(value: unknown): OpenTaskItem[] | undefined {
  const section = asRecord(value);
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(section.rows)
      ? section.rows
      : Array.isArray(section.value)
        ? section.value
        : null;
  if (!rows) return undefined;
  return tableRows(rows).map((row, index) => ({
    id: `open-task-${index}`,
    callLogDate: str(row.callLogDate),
    serviceCallId: str(row.callId) || str(row.serviceCallId),
    ct: str(row.ct),
    st: str(row.st),
    callDetails: str(row.callDetails),
    userPool: str(row.userPoll) || str(row.userPool),
    source: str(row.source),
  }));
}

/* ---- Audit trail ---- */

function mapAuditTrail(value: unknown): AuditTrailItem[] | undefined {
  const section = asRecord(value);
  const rows = Array.isArray(value)
    ? value
    : Array.isArray(section.rows)
      ? section.rows
      : Array.isArray(section.value)
        ? section.value
        : null;
  if (!rows) return undefined;
  return tableRows(rows).map((row, index) => ({
    id: `audit-${index}`,
    userId: str(row.userId),
    userName: str(row.userName),
    poolName: str(row.poolName),
    caseStatus: str(row.caseStatus),
    decision: str(row.Decision) || str(row.decision),
    comments: str(row.comments),
    dateUpdatedOn: str(row.updatedDate) || str(row.dateUpdatedOn) || str(row.updatedOn),
  }));
}

/* ---- Risk details ---- */

function mapRiskMember(entry: JsonRecord, index: number): RiskMember {
  const risk = asRecord(entry.risk_details);
  const fields = (section: unknown) =>
    recordList(asRecord(section).value).map((field) => ({
      label: str(field.label),
      value: str(field.value),
    }));
  const decision = asRecord(risk.riskDecision);

  return {
    id: `risk-member-${index}`,
    name: str(risk.member) || `Member ${index + 1}`,
    details: fields(risk.memberDetails),
    // The API spells this key "riskAssessament"
    assessment: fields(risk.riskAssessament ?? risk.riskAssessment).map((field, fieldIndex) => ({
      id: `f${fieldIndex}`,
      ...field,
    })),
    remark: str(decision.riskRemark),
    decision: str(decision.riskCode),
  };
}

function mapRiskDetails(value: unknown): RiskMember[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return recordList(value).map(mapRiskMember);
}

/** Maps `data.subSections[]` of the DRS payload to the data the Quick Link pages show. */
export function mapQuickLinksSubSections(subSections: unknown): QuickLinksSubSections {
  return {
    previousPolicy: mapPreviousPolicies(findSubSection(subSections, "previousPolicies")),
    openTasks: mapOpenTasks(findSubSection(subSections, "openOtherTasks")),
    auditTrail: mapAuditTrail(findSubSection(subSections, "auditTrail")),
    riskDetails: mapRiskDetails(findSubSection(subSections, "riskDetails")),
  };
}
