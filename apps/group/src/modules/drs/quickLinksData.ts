import type { AuditTrailItem } from "@insurance-poc/common/audit-trail";
import type { OpenTaskItem } from "@insurance-poc/common/open-tasks";
import type { PreviousPolicyData } from "@insurance-poc/common/previous-policy";
import type { RiskMember } from "@insurance-poc/common/risk-details";
import { mapMembersPreviousPolicy } from "./previousPolicyData";

type JsonRecord = Record<string, unknown>;

/** Data of the Quick Link pages, read from `data.membersDetails[].subSections[]` (DVT). */
export interface QuickLinksSubSections {
  previousPolicy?: PreviousPolicyData;
  openTasks?: OpenTaskItem[];
  auditTrail?: AuditTrailItem[];
  riskDetails?: RiskMember[];
}

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const recordList = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const str = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

/** `value` of the `subSections[]` entry with this name, for every member that has it. */
const subSectionValues = (members: JsonRecord[], name: string): unknown[] =>
  members
    .map((member) => recordList(member.subSections).find((item) => item.name === name)?.value)
    .filter((value) => value !== undefined);

/* ---- Open tasks ---- */

function mapOpenTasks(values: unknown[]): OpenTaskItem[] | undefined {
  const first = values.find(isRecord);
  if (!first) return undefined;
  return recordList(first.rows).map((row, index) => ({
    id: `open-task-${index + 1}`,
    callLogDate: str(row.callLogDate),
    serviceCallId: str(row.callId),
    ct: str(row.ct),
    st: str(row.st),
    callDetails: str(row.callDetails),
    userPool: str(row.userPoll),
    source: str(row.source),
  }));
}

/* ---- Audit trail ---- */

function mapAuditTrail(values: unknown[]): AuditTrailItem[] | undefined {
  const first = values.find(isRecord);
  if (!first) return undefined;
  return recordList(first.value).map((row, index) => ({
    id: `audit-${index + 1}`,
    userId: str(row.userId),
    userName: str(row.userName),
    poolName: str(row.poolName),
    caseStatus: str(row.caseStatus),
    decision: str(row.Decision) || str(row.decision),
    comments: str(row.comments),
    dateUpdatedOn: str(row.updatedDate),
  }));
}

/* ---- Risk details (one entry per member) ---- */

const labelValues = (value: unknown) =>
  recordList(value).map((item) => ({ label: str(item.label), value: str(item.value) }));

function mapRiskMember(entry: JsonRecord, index: number): RiskMember {
  const details = labelValues(
    isRecord(entry.risk_details) && isRecord(entry.risk_details.memberDetails)
      ? entry.risk_details.memberDetails.value
      : undefined,
  );
  const assessment = isRecord(entry.riskAssessament) ? entry.riskAssessament : {};
  const decision = isRecord(entry.riskDecision) ? entry.riskDecision : {};
  return {
    id: `risk-member-${index + 1}`,
    name: details.find((field) => field.label === "Customer Name")?.value || `Member ${index + 1}`,
    details,
    assessment: labelValues(assessment.value).map((field, fieldIndex) => ({
      id: `f${fieldIndex}`,
      ...field,
    })),
    remark: str(decision.riskRemark),
    decision: str(decision.riskCode),
  };
}

function mapRiskDetails(values: unknown[]): RiskMember[] | undefined {
  const entries = values.filter(Array.isArray).flatMap(recordList);
  return entries.length > 0 ? entries.map(mapRiskMember) : undefined;
}

/**
 * DVT: maps `data.membersDetails[]` — every member carries its own `subSections[]`.
 * Previous policies and risk details are collected member-wise; open tasks and audit trail
 * use the first member that has them.
 */
export function mapMembersQuickLinks(membersDetails: unknown): QuickLinksSubSections {
  const members = recordList(membersDetails);
  return {
    previousPolicy: mapMembersPreviousPolicy(membersDetails),
    openTasks: mapOpenTasks(subSectionValues(members, "openOtherTasks")),
    auditTrail: mapAuditTrail(subSectionValues(members, "auditTrail")),
    riskDetails: mapRiskDetails(subSectionValues(members, "riskDetails")),
  };
}
