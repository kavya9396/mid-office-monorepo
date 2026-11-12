import type {
  PreviousPolicyData,
  PreviousPolicyIpru,
  PreviousPolicyMember,
  PreviousPolicyRow,
} from "@insurance-poc/common/previous-policy";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const recordList = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

/** Keeps the string / number cells of an API object; other values are dropped. */
function toRow(source: JsonRecord, aliases: Record<string, string> = {}): PreviousPolicyRow {
  const row: PreviousPolicyRow = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string" || typeof value === "number") row[aliases[key] ?? key] = value;
  }
  return row;
}

// API key -> key used by the table column
const IPRU_ALIASES: Record<string, string> = { sumAssured: "appliedSumAssured" };
const IIB_ALIASES: Record<string, string> = { questCompanyName: "questCompanyNumber" };

function mapIpru(source: JsonRecord): PreviousPolicyIpru {
  const row = toRow(source, IPRU_ALIASES);
  return {
    row,
    riders: recordList(source.riderDetails).map((rider) => ({
      clientRole: row.clientRole ?? "",
      ...toRow(rider),
      policyNumber: row.policyNumber ?? "",
    })),
  };
}

function mapMember(source: JsonRecord, index: number): PreviousPolicyMember {
  const key = typeof source.memberKey === "string" ? source.memberKey : `member${index + 1}`;
  return {
    key,
    label: typeof source.label === "string" && source.label !== "" ? source.label : key,
    dedupePosidex: recordList(source.dedupePosidex).map((item) => toRow(item)),
    ipru: recordList(source.ipru).map(mapIpru),
    iibNonIpru: recordList(source.iibNonIpru).map((item) => toRow(item, IIB_ALIASES)),
    applicationForm: recordList(source.applicationFormDetails).map((item) => toRow(item)),
  };
}

/** `subSections[]` entry named `previousPolicies` -> its `value`. */
function findPreviousPolicies(subSections: unknown): JsonRecord | undefined {
  const section = recordList(subSections).find((item) => item.name === "previousPolicies");
  return isRecord(section?.value) ? section.value : undefined;
}

/**
 * DVT: `data.membersDetails[]` holds one object per member, each with its own `subSections`.
 * - one accordion per member, from that member's `previousPolicies.members` (object or list);
 * - `familyPolicies` come from the first member's `previousPolicies`.
 */
export function mapMembersPreviousPolicy(membersDetails: unknown): PreviousPolicyData | undefined {
  const sections = recordList(membersDetails)
    .map((member) => findPreviousPolicies(member.subSections))
    .filter((section): section is JsonRecord => section !== undefined);
  if (sections.length === 0) return undefined;

  const members = sections
    .flatMap((section) => (Array.isArray(section.members) ? recordList(section.members) : isRecord(section.members) ? [section.members] : []))
    .map(mapMember);

  return {
    members,
    familyPolicies: recordList(sections[0]?.familyPolicies).map((item) => toRow(item)),
  };
}
