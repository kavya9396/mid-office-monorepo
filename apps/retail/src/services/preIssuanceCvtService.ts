import type { BannerField, BannerRow } from "@insurance-poc/common/applicant-banner";
import { formatDateTime, formatIndianCurrency } from "@insurance-poc/utils";

export const PRE_ISSUANCE_SERVICING_TITLE = "Pre Issuance Servicing Details";
export const PRE_ISSUANCE_HISTORY_TITLE = "Pre Issuance Servicing History";

export type ServicingChangeField = {
  name: string;
  oldValue: string;
  newValue: string;
};

export type ServicingChangeGroup = {
  changeType: string;
  fields: ServicingChangeField[];
};

/** `oldRiders[]` / `newRiders[]` entry of the response. */
export type ServicingRider = {
  code: string;
  sumAssured: string;
  policyTerm: string;
  status: string;
};

export type ServicingDetails = {
  title: string;
  serviceId: string;
  ct: string;
  st: string;
  receivedDate: string;
  /** `servicingOverview.profileTitle` — heading of the change table. */
  memberLabel: string;
  groups: ServicingChangeGroup[];
  oldRiders: ServicingRider[];
  newRiders: ServicingRider[];
};

export type ServicingHistoryRow = {
  id: string;
  callDate: string;
  serviceId: string;
  ct: string;
  st: string;
  callDetails: string;
  source: string;
  changes: ServicingChangeField[];
};

/** Decision sent to the save (`/ui/decision`) and complete-task APIs. */
export type PreIssuanceCvtDecision = "ACCEPT" | "REJECT";

/** Body of the Pre Issuance CVT decision (save) API. */
export type PreIssuanceCvtDecisionRequest = {
  callId: string;
  applicationNo: string;
  decision: PreIssuanceCvtDecision;
  userId: string;
  rejectionRemarks: string;
};

export type PreIssuanceCvtDecisionResult = {
  message: string;
};

export type PreIssuanceCvtDrsData = {
  applicationNo: string;
  /** `servicingOverview.callId`; used for the decision API when the URL has no `callId`. */
  callId: string;
  bannerRows: BannerRow[];
  servicing: ServicingDetails;
  historyTitle: string;
  history: ServicingHistoryRow[];
};

/** Query params of the fetch API (`applicationNo`, `callId`). */
export type PreIssuanceCvtDrsQueryArg = {
  applicationNo: string;
  callId?: string;
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const recordList = (value: unknown): JsonRecord[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const text = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const dateText = (value: unknown): string => {
  const raw = text(value);
  return raw.length > 0 ? formatDateTime(raw) : "";
};

const currency = (value: unknown): string =>
  typeof value === "number" ? formatIndianCurrency(value) : text(value);

/** "₹ 15,00,000" -> "15,00,000" (the banner shows riders as "WOP - SA 15,00,000"). */
const amountOnly = (value: unknown): string =>
  typeof value === "number" ? formatIndianCurrency(value).replace(/^₹\s*/, "") : text(value);

type BannerEntry = { label: string; value: string; labelSeparator?: string };

/** Fields with an empty value are left out, so the banner never shows "Label: —". */
function bannerFields(rowId: string, entries: readonly BannerEntry[]): BannerField[] {
  return entries
    .filter((entry) => entry.value.length > 0)
    .map((entry, index) => ({
      id: `${rowId}-${index}`,
      label: entry.label,
      labelSeparator: entry.labelSeparator,
      value: entry.value,
    }));
}

/** `productName` plus `productCode`, as in the prototype ("ICICI Pru GIFT Pro - E36"). */
function productLabel(banner: JsonRecord): string {
  const name = text(banner.productName);
  const code = text(banner.productCode);
  if (name.length > 0 && code.length > 0 && !name.includes(code)) return `${name} - ${code}`;
  return name || code;
}

/** `headerBanner` -> the three banner lines of the prototype (product, policy / agent, riders). */
function mapBannerRows(headerBanner: JsonRecord): BannerRow[] {
  const rows: BannerRow[] = [
    {
      id: "product",
      fields: bannerFields("product", [
        { label: "Product", value: productLabel(headerBanner) },
        { label: "Channel", value: text(headerBanner.channel) },
        { label: "SA", value: currency(headerBanner.sumAssured), labelSeparator: " - " },
        { label: "Face Value", value: currency(headerBanner.faceValue), labelSeparator: " - " },
      ]),
    },
    {
      id: "agent",
      fields: bannerFields("agent", [
        { label: "Policy Type", value: text(headerBanner.policyType) },
        { label: "Agent Name", value: text(headerBanner.agentName) },
        { label: "Agent Code", value: text(headerBanner.agentCode) },
        { label: "Customer Type", value: text(headerBanner.customerType) },
      ]),
    },
    {
      id: "riders",
      label: "Riders",
      separator: " / ",
      fields: bannerFields(
        "riders",
        recordList(headerBanner.riders).map((rider) => ({
          label: text(rider.riderCode),
          labelSeparator: " - ",
          value: `SA ${amountOnly(rider.sumAssured)}`,
        })),
      ),
    },
  ];
  return rows.filter((row) => row.fields.length > 0);
}

const mapChange = (change: JsonRecord): ServicingChangeField & { changeType: string } => ({
  changeType: text(change.changeType),
  name: text(change.fieldName),
  oldValue: text(change.oldValue),
  newValue: text(change.newValue),
});

const mapChangeFields = (value: unknown): ServicingChangeField[] =>
  recordList(value)
    .map(mapChange)
    .map(({ name, oldValue, newValue }) => ({ name, oldValue, newValue }));

/** The API returns one flat `changes[]`; rows sharing a `changeType` are grouped (first-appearance order). */
function groupChanges(value: unknown): ServicingChangeGroup[] {
  const groups = new Map<string, ServicingChangeField[]>();
  for (const { changeType, ...field } of recordList(value).map(mapChange)) {
    const fields = groups.get(changeType) ?? [];
    fields.push(field);
    groups.set(changeType, fields);
  }
  return Array.from(groups, ([changeType, fields]) => ({ changeType, fields }));
}

const mapRiders = (value: unknown): ServicingRider[] =>
  recordList(value).map((rider) => ({
    code: text(rider.riderCode),
    sumAssured: currency(rider.sumAssured),
    policyTerm: text(rider.policyTerm),
    status: text(rider.status),
  }));

function mapHistoryRow(row: JsonRecord, index: number): ServicingHistoryRow {
  return {
    id: `history-${index + 1}`,
    callDate: dateText(row.callDate),
    serviceId: text(row.serviceId) || text(row.callId),
    ct: text(row.ct),
    st: text(row.st),
    callDetails: text(row.details),
    source: text(row.source),
    changes: mapChangeFields(row.changes),
  };
}

/**
 * Maps the Pre Issuance servicing task response (`headerBanner`, `servicingOverview`, `changes`,
 * `oldRiders`, `newRiders`, `history`). Used for the API response and the mock alike.
 * Returns `null` when there is no `servicingOverview` (the screen renders a "not found" state) and
 * throws the API `message` when `success` is false.
 */
export function mapPreIssuanceCvtDrsPayload(payload: unknown): PreIssuanceCvtDrsData | null {
  const root = isRecord(payload) ? payload : {};
  if (root.success === false) {
    throw new Error(text(root.message) || "Unable to load the Pre Issuance CVT DRS.");
  }

  const overview = root.servicingOverview;
  if (!isRecord(overview)) return null;

  const headerBanner = isRecord(root.headerBanner) ? root.headerBanner : {};

  return {
    applicationNo: text(headerBanner.applicationNo),
    callId: text(overview.callId),
    bannerRows: mapBannerRows(headerBanner),
    servicing: {
      title: PRE_ISSUANCE_SERVICING_TITLE,
      serviceId: text(overview.serviceId),
      ct: text(overview.callType),
      st: text(overview.subType),
      receivedDate: dateText(overview.receivedDate),
      memberLabel: text(overview.profileTitle),
      groups: groupChanges(root.changes),
      oldRiders: mapRiders(root.oldRiders),
      newRiders: mapRiders(root.newRiders),
    },
    historyTitle: PRE_ISSUANCE_HISTORY_TITLE,
    history: recordList(root.history).map(mapHistoryRow),
  };
}
