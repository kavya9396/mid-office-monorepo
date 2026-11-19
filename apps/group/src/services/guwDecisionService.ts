/** Form values the `uw-decision` request is built from (see `buildGuwUwDecisionRequest`). */
export interface GuwDecisionRowInput {
  productName: string;
  productCode: string;
  isRider: boolean;
  type: string;
  bstdCode: string;
  sa: string;
  changedSa: string;
  pt: string;
  changedPt: string;
  loadingClass: string;
  loadingReason: string;
}

/** One selected Raise Referral row (Refer To / Reason / Remarks / Assigned To). */
export interface GuwReferralRowInput {
  /** Referral row code, e.g. REF_HOD. Sent as `referTo`. */
  target: string;
  reason: string;
  remarks: string;
  assignedTo: string;
}

export interface GuwDecisionFormInput {
  applicationNo: string;
  partyId: string;
  roleType: string;
  screenType: string;
  createdBy: string;
  /** Decision code sent as `decision` and `decisionCode` (STD, BOR_STD, REJ, DC, POSTP, CO, EP, HOLD, APPROVER ...). */
  decision: string;
  uwRemarks: string;
  /** Multi-select Reasons of Borderline Standard / Reject / Decline / Postpone / Counter Offer / Extra Premium. */
  reasons: string[];
  holdReason: string;
  postponePeriod: string;
  reconsiderPossible: string;
  reconsiderAfter: string;
  reconsiderReqType: string;
  reconsiderReqDetails: string;
  /** Counter Sign fields, set when the Counter Sign form is part of this submit. */
  approver?: { reason: string; referTo: string; assignedTo: string };
  rows: GuwDecisionRowInput[];
}

/** One Decision Details table row sent with Borderline Standard / Counter Offer / Extra Premium. */
export interface GuwUwDecisionProduct {
  productLineId: number;
  partyId: string;
  applicationNumber: string;
  productCode: string;
  productName: string;
  lineType: "BASE" | "RIDER";
  deciType: string;
  bstdCode: string | null;
  sa: string | null;
  changedSa: string | null;
  pt: string | null;
  changedPt: string | null;
  ppt: string | null;
  changedPpt: string | null;
  loadingClass: string | null;
  loadingReason: string | null;
  createdBy: string;
  updatedBy: string;
}

/**
 * Request of the GUW `uw-decision` API (`/api/v1/drs/uw-decision`), sent when the member decision is submitted.
 * The optional fields depend on the decision: Borderline Standard / Counter Offer / Extra Premium carry
 * `products`; Reject / Decline / Postpone carry the reconsideration fields; Hold carries `reasons`;
 * Counter Sign (APPROVER) carries `reason`, `referTo` and `assignedTo`.
 */
export interface GuwUwDecisionRequest {
  applicationNo: string;
  partyId: string;
  roleType: string;
  level: "member";
  screenType: string;
  decision: string;
  decisionCode: string;
  uwRemarks: string;
  reasons?: string | string[];
  recAllowed?: string;
  reconsiderAfter?: string;
  requirementType?: string;
  requirementDetails?: string;
  postponePeriod?: string;
  reason?: string;
  referTo?: string;
  assignedTo?: string;
  products?: GuwUwDecisionProduct[];
  createdBy: string;
}

/** Saved decision returned by the `uw-decision` API. */
export interface GuwUwDecisionResult {
  uwDecisionId: string;
  level: string;
  screenType: string;
  applicationNumber: string;
  partyId: string;
  roleType: string;
  caseUwDecision: string;
  decision: string;
  decisionCode: string;
  uwRemarks: string;
  reasons: string;
  outlier: string;
  smokerStatus: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/** "₹50,00,000" -> "5000000"; a blank or dash value -> null. */
function toAmount(value: string): string | null {
  const digits = value.replace(/[^\d.]/g, "");
  return digits.length > 0 ? digits : null;
}

function orNull(value: string): string | null {
  const text = value.trim();
  return text.length > 0 ? text : null;
}

/** One reason is sent as text, several as a list. */
function toReasons(reasons: string[]): string | string[] {
  return reasons.length === 1 ? reasons[0] : reasons;
}

const RECONSIDER_DECISIONS = ["REJ", "DC", "POSTP"];
const PRODUCT_DECISIONS = ["BOR_STD", "CO", "EP"];

/**
 * Domain -> `uw-decision` DTO. Which fields are sent depends on the decision:
 * STD: base fields only. BOR_STD / CO / EP: reasons + products. REJ / DC / POSTP: reasons, recAllowed,
 * requirementDetails, reconsiderAfter + requirementType (only when reconsideration is allowed), postponePeriod (POSTP).
 * HOLD: reasons. APPROVER: reason, referTo, assignedTo.
 */
export function buildGuwUwDecisionRequest(input: GuwDecisionFormInput): GuwUwDecisionRequest {
  const { decision } = input;
  const request: GuwUwDecisionRequest = {
    applicationNo: input.applicationNo,
    partyId: input.partyId,
    roleType: input.roleType,
    level: "member",
    screenType: input.screenType,
    decision,
    decisionCode: decision,
    uwRemarks: input.uwRemarks,
    createdBy: input.createdBy,
  };

  if (PRODUCT_DECISIONS.includes(decision) || RECONSIDER_DECISIONS.includes(decision)) {
    if (input.reasons.length > 0) request.reasons = toReasons(input.reasons);
  }

  if (PRODUCT_DECISIONS.includes(decision)) {
    request.products = input.rows.map((row, index) => ({
      productLineId: index + 1,
      partyId: input.partyId,
      applicationNumber: input.applicationNo,
      productCode: row.productCode,
      productName: row.productName,
      lineType: row.isRider ? "RIDER" : "BASE",
      deciType: row.type,
      bstdCode: orNull(row.bstdCode),
      sa: toAmount(row.sa),
      changedSa: toAmount(row.changedSa),
      pt: toAmount(row.pt),
      changedPt: toAmount(row.changedPt),
      ppt: null,
      changedPpt: null,
      loadingClass: orNull(row.loadingClass),
      loadingReason: orNull(row.loadingReason),
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
    }));
  }

  if (RECONSIDER_DECISIONS.includes(decision)) {
    if (decision === "POSTP") request.postponePeriod = input.postponePeriod;
    request.recAllowed = input.reconsiderPossible;
    if (input.reconsiderPossible === "Yes") {
      request.reconsiderAfter = input.reconsiderAfter;
      request.requirementType = input.reconsiderReqType;
    }
    request.requirementDetails = input.reconsiderReqDetails;
  }

  if (decision === "HOLD") request.reasons = input.holdReason;

  if (input.approver) {
    request.reason = input.approver.reason;
    request.referTo = input.approver.referTo;
    request.assignedTo = input.approver.assignedTo;
  }

  return request;
}

/** Base fields shared by every referral request (the per-row fields are added by the caller). */
export type GuwReferralBaseInput = Pick<GuwDecisionFormInput, "applicationNo" | "partyId" | "roleType" | "screenType" | "createdBy">;

/**
 * Raise Referral: one `uw-decision` request per selected referral row, sent together as an array.
 * Each item carries `reason`, `referTo`, `uwRemarks` and (when entered) `assignedTo`.
 */
export function buildGuwUwReferralRequests(
  base: GuwReferralBaseInput,
  rows: GuwReferralRowInput[],
): GuwUwDecisionRequest[] {
  return rows.map((row) => {
    const request: GuwUwDecisionRequest = {
      applicationNo: base.applicationNo,
      partyId: base.partyId,
      roleType: base.roleType,
      level: "member",
      screenType: base.screenType,
      decision: "REFERRAL",
      decisionCode: "REFERRAL",
      uwRemarks: row.remarks.trim(),
      reason: row.reason,
      referTo: row.target,
      createdBy: base.createdBy,
    };
    const assignedTo = row.assignedTo.trim();
    if (assignedTo) request.assignedTo = assignedTo;
    return request;
  });
}

/** Action sent as `action` to the `parallel-decision` API. */
export type GuwParallelDecisionAction = "OPINION" | "COUNTER_SIGN" | "RAISE_REFERRAL";

/** One `parallelDecision` item: who the case is referred to and (optionally) who it is assigned to. */
export interface GuwParallelDecisionItem {
  referTo: {
    referValue: string;
    description: string;
    referName: string;
    remarks: string;
    reason: string;
  };
  assignedTo?: {
    name: string;
    description: string;
    value: string;
  };
}

/** Request of the GUW `parallel-decision` API (`/api/v1/drs/parallel-decision`). */
export interface GuwParallelDecisionRequest {
  screenType: string;
  parallelDecision: GuwParallelDecisionItem[];
  appNo: string;
  partyId: string;
  action: GuwParallelDecisionAction;
  userId: string;
}

export type GuwParallelDecisionBaseInput = Pick<GuwDecisionFormInput, "applicationNo" | "partyId" | "screenType"> & {
  userId: string;
};

/** Referral rows whose Refer To is an opinion (Sr UW Opinion / HOD Opinion); every other row is a plain referral. */
const OPINION_REFERRALS = ["REF_SR_UW", "REF_HOD"];

function toParallelDecisionRequest(
  base: GuwParallelDecisionBaseInput,
  action: GuwParallelDecisionAction,
  parallelDecision: GuwParallelDecisionItem[],
): GuwParallelDecisionRequest {
  return {
    screenType: base.screenType,
    parallelDecision,
    appNo: base.applicationNo,
    partyId: base.partyId,
    action,
    userId: base.userId,
  };
}

/**
 * Raise Referral: selected rows -> `parallel-decision` requests. `action` is one value per request, so
 * Sr UW / HOD Opinion rows are sent as OPINION and the other rows as RAISE_REFERRAL (one request each, when present).
 */
export function buildGuwReferralParallelDecisionRequests(
  base: GuwParallelDecisionBaseInput,
  rows: (GuwReferralRowInput & { label: string })[],
): GuwParallelDecisionRequest[] {
  const toItem = (row: GuwReferralRowInput & { label: string }): GuwParallelDecisionItem => {
    const assignedTo = row.assignedTo.trim();
    return {
      referTo: {
        referValue: row.target,
        description: row.label,
        referName: row.label,
        remarks: row.remarks.trim(),
        reason: row.reason,
      },
      ...(assignedTo ? { assignedTo: { name: assignedTo, description: assignedTo, value: assignedTo } } : {}),
    };
  };
  const opinions = rows.filter((row) => OPINION_REFERRALS.includes(row.target)).map(toItem);
  const referrals = rows.filter((row) => !OPINION_REFERRALS.includes(row.target)).map(toItem);
  const requests: GuwParallelDecisionRequest[] = [];
  if (opinions.length > 0) requests.push(toParallelDecisionRequest(base, "OPINION", opinions));
  if (referrals.length > 0) requests.push(toParallelDecisionRequest(base, "RAISE_REFERRAL", referrals));
  return requests;
}

/** Counter Sign: Reason / Refer To / Assigned To / UW Remarks -> one `parallel-decision` request. */
export function buildGuwCounterSignParallelDecisionRequest(
  base: GuwParallelDecisionBaseInput,
  input: { reason: string; referTo: string; assignedTo: string; remarks: string },
): GuwParallelDecisionRequest {
  return toParallelDecisionRequest(base, "COUNTER_SIGN", [
    {
      referTo: {
        referValue: input.referTo,
        description: input.referTo,
        referName: input.referTo,
        remarks: input.remarks.trim(),
        reason: input.reason,
      },
      assignedTo: { name: input.assignedTo, description: input.assignedTo, value: input.assignedTo },
    },
  ]);
}

/** Fixed request value for the GUW screen. */
export const GUW_UW_DECISION_SCREEN_TYPE = "GUW";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/**
 * DTO -> domain list. Accepts a bare object, an array, or either one wrapped in `{ data }`
 * (Raise Referral returns one saved decision per referral); throws when it is none of these.
 */
export function mapGuwUwDecisions(payload: unknown): GuwUwDecisionResult[] {
  const root = isRecord(payload) && "data" in payload ? payload.data : payload;
  if (Array.isArray(root)) return root.map((item) => mapGuwUwDecision(item));
  return [mapGuwUwDecision(root)];
}

/** DTO -> domain. Accepts the bare object or one wrapped in `{ data }`; throws when it is neither. */
export function mapGuwUwDecision(payload: unknown): GuwUwDecisionResult {
  const root = isRecord(payload) ? payload : null;
  const dto = root && isRecord(root.data) ? root.data : root;
  if (!dto) throw new Error("GUW UW decision response is not in the expected format.");
  return {
    uwDecisionId: readText(dto.uwDecisionId),
    level: readText(dto.level),
    screenType: readText(dto.screenType),
    applicationNumber: readText(dto.applicationNumber),
    partyId: readText(dto.partyId),
    roleType: readText(dto.roleType),
    caseUwDecision: readText(dto.caseUwDecision),
    decision: readText(dto.decision),
    decisionCode: readText(dto.decisionCode),
    uwRemarks: readText(dto.uwRemarks),
    reasons: readText(dto.reasons),
    outlier: readText(dto.outlier),
    smokerStatus: readText(dto.smokerStatus),
    createdAt: readText(dto.createdAt),
    createdBy: readText(dto.createdBy),
    updatedAt: readText(dto.updatedAt),
    updatedBy: readText(dto.updatedBy),
  };
}
