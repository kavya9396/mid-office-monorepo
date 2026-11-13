import type { AuditTrailItem } from "@insurance-poc/common/audit-trail";
import type { OpenTaskItem } from "@insurance-poc/common/open-tasks";
import type { PreviousPolicyData } from "@insurance-poc/common/previous-policy";
import type { RiskMember } from "@insurance-poc/common/risk-details";
import type { LifeAssuredApplicant, FieldData, NomineeRow } from "@insurance-poc/common/life-assured";
import { mapMembersPreviousPolicy } from "./previousPolicyData";

type JsonRecord = Record<string, unknown>;

/** Data of the Quick Link pages, read from `data.membersDetails[].subSections[]` (DVT). */
export interface QuickLinksSubSections {
  previousPolicy?: PreviousPolicyData;
  openTasks?: OpenTaskItem[];
  auditTrail?: AuditTrailItem[];
  riskDetails?: RiskMember[];
  applicantProfile?: LifeAssuredApplicant[];
  /** `proposalFormAndDocuments.value.link` — opened in a new browser tab. */
  proposalFormLink?: string;
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

/** Rows of a table section: either a bare list or `{ columns, rows }`. */
const tableRows = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? recordList(value) : isRecord(value) ? recordList(value.rows) : [];

/**
 * Mapped rows of the first member that has any non-empty row; `[]` when members have the
 * section but no data; `undefined` when no member has the section at all.
 */
function firstFilledRows<T extends object>(
  values: unknown[],
  mapRow: (row: JsonRecord, index: number) => T,
): T[] | undefined {
  if (values.length === 0) return undefined;
  const lists = values.map((value) =>
    tableRows(value)
      .map(mapRow)
      .filter((item) => Object.values(item).some((cell) => typeof cell === "string" && cell !== "")),
  );
  return lists.find((list) => list.length > 0) ?? [];
}

/* ---- Open tasks ---- */

function mapOpenTasks(values: unknown[]): OpenTaskItem[] | undefined {
  const tasks = firstFilledRows(values, (row, index) => ({
    callLogDate: str(row.callLogDate),
    serviceCallId: str(row.callId) || str(row.serviceCallId),
    ct: str(row.ct),
    st: str(row.st),
    callDetails: str(row.callDetails),
    userPool: str(row.userPoll) || str(row.userPool),
    source: str(row.source),
    index,
  }));
  return tasks?.map(({ index, ...task }) => ({ id: `open-task-${index + 1}`, ...task }));
}

/* ---- Audit trail ---- */

function mapAuditTrail(values: unknown[]): AuditTrailItem[] | undefined {
  const items = firstFilledRows(values, (row, index) => ({
    userId: str(row.userId),
    userName: str(row.userName),
    poolName: str(row.poolName),
    caseStatus: str(row.caseStatus),
    decision: str(row.Decision) || str(row.decision),
    comments: str(row.comments),
    dateUpdatedOn: str(row.updatedDate) || str(row.dateUpdatedOn),
    index,
  }));
  return items?.map(({ index, ...item }) => ({ id: `audit-${index + 1}`, ...item }));
}

/* ---- Proposal form & documents ---- */

function mapProposalFormLink(values: unknown[]): string | undefined {
  for (const value of values) {
    const link = isRecord(value) ? str(value.link).trim() : "";
    if (/^https?:\/\//i.test(link)) return link;
  }
  return undefined;
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

/* ---- Applicant profile (one entry per member) ---- */

const fieldList = (value: unknown): FieldData[] =>
  recordList(value).map((item) => ({ label: str(item.label), value: str(item.value) }));

/** `value` list of the group called `label` inside `contact_and_address.value[]`. */
const addressGroup = (groups: JsonRecord[], label: string): FieldData[] =>
  fieldList(groups.find((group) => str(group.label) === label)?.value);

const hasText = (row: JsonRecord): boolean => Object.values(row).some((cell) => str(cell) !== "");

function mapApplicantProfile(
  profile: JsonRecord,
  memberLabel: string,
  index: number,
): LifeAssuredApplicant {
  const imageDetails = isRecord(profile.image_details) ? profile.image_details : {};
  const personalKyc = isRecord(profile.personal_kyc) ? profile.personal_kyc : {};
  const contact = isRecord(profile.contact_and_address) ? profile.contact_and_address : {};
  const nominee = isRecord(profile.nominee) ? profile.nominee : {};
  const product = isRecord(profile.product_details) ? profile.product_details : {};

  const imageValue = isRecord(imageDetails.value) ? imageDetails.value : {};
  const kycGroups = Array.isArray(personalKyc.groups) ? personalKyc.groups : [];
  const contactGroups = recordList(contact.value);
  const productValue = isRecord(product.value) ? product.value : {};
  const nomineeRows = recordList(recordList(nominee.value)[0]?.rows).filter(hasText);
  const memberType = str(profile.memberType);

  return {
    id: memberType || `member-${index + 1}`,
    partyId: str(profile.partyId) || undefined,
    memberType: memberType || undefined,
    label: memberLabel,
    imageRecords: recordList(imageValue.rows).map((row) => ({
      imageType: str(row.imageType),
      document: str(row.document),
      faceMatchScore: str(row.faceMatchScore),
      imageQuality: str(row.imageQuality),
      remarks: str(row.remarks),
    })),
    personalFields: fieldList(kycGroups[0]),
    kycFields: fieldList(kycGroups[1]),
    communicationAddress: addressGroup(contactGroups, "Communication Address"),
    permanentAddress: addressGroup(contactGroups, "Permanent Address"),
    contactDetails: addressGroup(contactGroups, "Contact Details"),
    productFields: fieldList(productValue.value),
    nominees: nomineeRows.map(
      (row): NomineeRow => ({
        nomineeName: str(row.name),
        nomineeDOB: str(row.dob),
        gender: str(row.gender),
        relationship: str(row.relationship),
        sharePercentage: Number(str(row.share)) || 0,
        isLASame: "",
        relationShipWithJL: "",
        laFlag: "",
      }),
    ),
    appointees: [],
    lifestyleFields: [],
  };
}

function mapApplicantProfiles(members: JsonRecord[]): LifeAssuredApplicant[] | undefined {
  const applicants = members.flatMap((member, index) => {
    const profile = recordList(member.subSections).find((item) => item.name === "applicantProfile")
      ?.value;
    if (!isRecord(profile)) return [];
    const memberField = recordList(
      recordList(member.rowDetails).find((row) => row.id === 0)?.fields,
    ).find((field) => str(field.name) === "Member");
    return [mapApplicantProfile(profile, str(memberField?.value) || `Life Assured ${index + 1}`, index)];
  });
  return applicants.length > 0 ? applicants : undefined;
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
    applicantProfile: mapApplicantProfiles(members),
    proposalFormLink: mapProposalFormLink(subSectionValues(members, "proposalFormAndDocuments")),
  };
}
