import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import type {
  EditApplicantValues,
  LoanEditValues,
  NomineeEditRow,
  RiderEditRow,
} from "@insurance-poc/common/life-assured";
import {
  absoluteApiBaseUrl,
  buildAuthServiceGetHeaders,
  createBusinessBaseQuery,
  getDrsRoleType,
  getMasterList,
  getSessionBusinessType,
  getSessionUser,
  groupBusinessUrls,
  useMock,
  userUrls,
} from "@insurance-poc/utils";
import { getGroupDrsTaskConfig } from "../config/drsTaskConfig";
import groupDrsMock from "../modules/drs/mock/groupDrs.json";
import guwDrsMock from "../../../../mock/drs/guw-informal-drs.json";
import guwHodDrsMock from "../../../../mock/drs/guw-hod-drs.json";
import guwSrUwDrsMock from "../../../../mock/drs/guw-sr-uw-drs.json";
import guwUwDecisionMock from "../../../../mock/drs/guw-uw-decision.json";
import guwClaimAuditListMock from "../../../../mock/drs/guw-claim-audit-list.json";
import guwUwDecisionHistoryMock from "../../../../mock/drs/guw-uw-decision-history.json";
import usersByRoleMock from "../../../../mock/drs/users-by-role.json";
import groupDrsApplicantSaveMock from "../modules/drs/mock/groupDrsApplicantSave.json";
import {
  GUW_LOB,
  mapGroupDrsPayload,
  mapGuwUwDecisions,
  mapRawRequirementRows,
  mapReferralDecisionHistory,
  mapUsersByRole,
  type GroupDrsData,
  type GuwAssigneeOption,
  type GuwParallelDecisionRequest,
  type GuwUwDecisionRequest,
  type GuwUwDecisionResult,
  type ReferralDecisionHistoryRow,
} from "./drsService";

export type GroupDrsQueryArg =
  | string
  | {
      applicationNo: string;
      roleType?: string;
      screenType?: string;
      businessType?: string;
      taskType?: string;
    };

/** Request of `uw-decision/fetch` (HOD / Sr UW Underwriting Decision History). */
export type GuwUwDecisionHistoryRequest = {
  applicationNumber: string;
};

export type GuwClaimAuditListRequest = {
  applicationNumber: string;
  partyId: string;
};

/** `data.commonSection` and `data.membersDetails` of the DRS response, sent back as-is with the requirement save. */
export type GuwDrsRequirementData = {
  commonSection: unknown;
  membersDetails: unknown;
};

export type SaveGroupDrsRequirementsArg = {
  applicationNo: string;
  requirements: RequirementItem[];
  initialRequirements?: RequirementItem[];
  roleType?: string;
  screenType?: string;
  businessType?: string;
  lob?: string;
  userId?: string;
  queryArg?: GroupDrsQueryArg;
  /** GUW: when set, the whole DRS response (with the updated requirements) is sent instead of the `requirementManagement` section only. */
  drsData?: GuwDrsRequirementData;
  caseType?: string;
};

export type SaveGroupDrsApplicantArg = {
  applicationNo: string;
  applicantId: string;
  partyId?: string;
  memberType?: string;
  values: EditApplicantValues;
  nominees: NomineeEditRow[];
  riders: RiderEditRow[];
  loan: LoanEditValues;
  initialValues?: Partial<EditApplicantValues>;
  initialNominees?: NomineeEditRow[];
  initialRiders?: RiderEditRow[];
  initialLoan?: Partial<LoanEditValues>;
  roleType?: string;
  screenType?: string;
  businessType?: string;
  userId?: string;
  queryArg?: GroupDrsQueryArg;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Group DRS.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

/**
 * DRS fetch request body. `roleType` / `screenType` / `businessType` come from `drsTaskConfig`
 * (keyed by the task type), unless the caller passes them explicitly. Shared by DVT and GUW (GUW / HOD / Sr UW).
 */
function buildDrsRequestBody(arg: GroupDrsQueryArg) {
  const applicationNo = typeof arg === "string" ? arg : arg.applicationNo;
  const taskType = typeof arg === "string" ? getDrsRoleType() : (arg.taskType ?? arg.roleType ?? getDrsRoleType());
  const taskConfig = getGroupDrsTaskConfig(taskType);

  return {
    applicationNo,
    roleType: (typeof arg !== "string" && arg.roleType) || taskConfig.roleType,
    screenType: (typeof arg !== "string" && arg.screenType) || taskConfig.screenType,
    businessType: (typeof arg !== "string" && arg.businessType) || taskConfig.businessType,
  };
}

const isPersistedRequirementId = (item: RequirementItem): boolean =>
  typeof item.id === "number" ||
  (typeof item.id === "string" && !item.id.startsWith("req-") && Number.isFinite(Number(item.id)) && Number(item.id) > 0);

export const toRequirementRequestItem = (item: RequirementItem) => {
  let reqId: number | undefined;
  if (typeof item.requirementId === "number") {
    reqId = item.requirementId;
  } else if (isPersistedRequirementId(item)) {
    reqId = Number(item.id);
  }

  const payload: Record<string, unknown> = {
    status: item.status || "Pending",
    ocrStatus: item.ocrStatus === "-" ? "" : (item.ocrStatus ?? ""),
    team: item.team ?? "",
    profile: item.profile ?? "",
    category: item.category ?? "",
    subCategory: item.subCategory ?? "",
    document: item.document ?? "",
    reason: item.reason ?? "",
    fupCode: item.fupCode ?? "",
    extraRemarks: item.extraRemarks ?? "",
    description: item.description ?? "",
    requirementPoolType: item.requirementPoolType || item.team || "",
  };

  if (reqId !== undefined) {
    payload.requirementId = reqId;
  }
  if (item.partyId !== undefined) {
    payload.partyId = item.partyId;
  }
  if (item.memberType !== undefined) {
    payload.memberType = item.memberType;
  }

  return payload;
};

function isRequirementRowChangedOrNew(item: RequirementItem, initialList?: RequirementItem[]): boolean {
  const isNew = Boolean(item.isNew) || (typeof item.id === "string" && item.id.startsWith("req-"));
  if (isNew) return true;

  if (!initialList || initialList.length === 0) {
    return true;
  }

  const initial = initialList.find(
    (init) =>
      init.id === item.id ||
      (typeof item.requirementId === "number" && typeof init.requirementId === "number" && init.requirementId === item.requirementId),
  );

  if (!initial) {
    return true;
  }

  return (
    toCleanString(item.status) !== toCleanString(initial.status) ||
    toCleanString(item.extraRemarks) !== toCleanString(initial.extraRemarks) ||
    toCleanString(item.description) !== toCleanString(initial.description) ||
    toCleanString(item.reason) !== toCleanString(initial.reason) ||
    toCleanString(item.profile) !== toCleanString(initial.profile) ||
    toCleanString(item.fupCode) !== toCleanString(initial.fupCode) ||
    toCleanString(item.category) !== toCleanString(initial.category) ||
    toCleanString(item.subCategory) !== toCleanString(initial.subCategory) ||
    toCleanString(item.document) !== toCleanString(initial.document) ||
    toCleanString(item.team) !== toCleanString(initial.team) ||
    toCleanString(item.ocrStatus) !== toCleanString(initial.ocrStatus) ||
    toCleanString(item.requirementPoolType) !== toCleanString(initial.requirementPoolType)
  );
}

export function buildRequirementsSavePayload(arg: SaveGroupDrsRequirementsArg) {
  const sessionUser = getSessionUser();
  const userId = arg.userId ?? sessionUser?.username ?? "dvt.user";
  const taskType = arg.roleType ?? getDrsRoleType();
  const taskConfig = getGroupDrsTaskConfig(taskType);
  const roleType = arg.roleType ?? taskConfig.roleType ?? "DVT_TASK";
  const screenType = arg.screenType ?? taskConfig.screenType ?? "DVT_INFORMAL";
  const businessType = arg.businessType ?? getSessionBusinessType() ?? taskConfig.businessType ?? "GROUP";

  const rowsToSave = arg.initialRequirements
    ? arg.requirements.filter((item) => isRequirementRowChangedOrNew(item, arg.initialRequirements))
    : arg.requirements;

  const payload = {
    applicationNo: arg.applicationNo,
    userId,
    roleType,
    screenType,
    businessType,
    data: {
      commonSection: [
        {
          name: "requirementManagement",
          rows: rowsToSave.map(toRequirementRequestItem),
        },
      ],
    },
  };

  return payload;
}

type KeyValueField = { key: string; label: string; value: string };

type FieldMapping<T> = {
  key: string;
  label: string;
  getValue: (source: T) => string | undefined;
  getInitial: (initial: Partial<T>) => string | undefined;
};

const toCleanString = (val?: string | number): string =>
  val === undefined || val === null ? "" : String(val).trim();

const isFieldChanged = (
  current?: string | number,
  initial?: string | number,
  hasInitialScope = true,
): boolean => {
  const c = toCleanString(current);
  if (!hasInitialScope) return c !== "";
  return c !== toCleanString(initial);
};

function toApplicantStatusCode(status: string | undefined): string {
  const trimmed = (status ?? "").trim();
  if (!trimmed) return "";
  const list = getMasterList("misc", "APPLICANT_STATUS");
  const match = list.find(
    (entry) =>
      entry.code.toLowerCase() === trimmed.toLowerCase() ||
      entry.description?.trim().toLowerCase() === trimmed.toLowerCase() ||
      entry.value?.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return match?.code ?? trimmed.toLowerCase();
}

const PERSONAL_KYC_MAPPINGS: FieldMapping<EditApplicantValues>[] = [
  { key: "proposerSummary.dob", label: "Date Of Birth", getValue: (v) => v.dob, getInitial: (i) => i.dob },
  { key: "proposerSummary.gender", label: "Gender", getValue: (v) => v.gender, getInitial: (i) => i.gender },
  { key: "proposerSummary.residentStatus", label: "Resident Status", getValue: (v) => v.immigrationStatus, getInitial: (i) => i.immigrationStatus },
  { key: "kycDetails.panNumber", label: "Pan Number", getValue: (v) => v.panNumber, getInitial: (i) => i.panNumber },
  { key: "kycDetails.isPanValid", label: "Pan Flag", getValue: (v) => v.isPanValid, getInitial: (i) => i.isPanValid },
  { key: "kycDetails.aadharSeedingStatus", label: "Pan Aadhar Seeding Status", getValue: (v) => v.aadharSeedingStatus, getInitial: (i) => i.aadharSeedingStatus },
  { key: "kycDetails.immigrationStatus", label: "Immigration Status", getValue: (v) => v.immigrationStatus, getInitial: (i) => i.immigrationStatus },
  { key: "personalDetails.applicantStatus", label: "Applicant Status", getValue: (v) => toApplicantStatusCode(v.applicantStatus), getInitial: (i) => toApplicantStatusCode(i.applicantStatus) },
  { key: "kycDetails.nsdlNameMatching", label: "Nsdl Name Matching", getValue: (v) => v.nsdlNameMatching, getInitial: (i) => i.nsdlNameMatching },
  { key: "kycDetails.nsdlDobMatching", label: "Nsdl Dob Matching", getValue: (v) => v.nsdlDobMatching, getInitial: (i) => i.nsdlDobMatching },
  { key: "kycDetails.dobDocument", label: "Dob Document", getValue: (v) => v.dobDocument, getInitial: (i) => i.dobDocument },
  { key: "kycDetails.genderDocument", label: "Gender Document", getValue: (v) => v.genderDocument, getInitial: (i) => i.genderDocument },
  { key: "kycDetails.pincodeDocument", label: "Pincode Document", getValue: (v) => v.pincodeDocument, getInitial: (i) => i.pincodeDocument },
];

function buildPersonalKycSection(
  values: EditApplicantValues,
  initialValues?: Partial<EditApplicantValues>,
) {
  const fields: KeyValueField[] = [];
  const keys: string[] = [];
  const hasScope = Boolean(initialValues);

  for (const mapping of PERSONAL_KYC_MAPPINGS) {
    const currentVal = mapping.getValue(values);
    const initialVal = initialValues ? mapping.getInitial(initialValues) : undefined;
    if (isFieldChanged(currentVal, initialVal, hasScope)) {
      fields.push({ key: mapping.key, label: mapping.label, value: currentVal ?? "" });
      keys.push(mapping.key);
    }
  }

  return {
    section: fields.length > 0 ? { groups: [fields] } : undefined,
    keys,
  };
}

const BASE_LOAN_MAPPINGS: FieldMapping<LoanEditValues>[] = [
  { key: "productDetail.sumAssured", label: "Base Sum Assured", getValue: (l) => l.baseSumAssured, getInitial: (i) => i.baseSumAssured },
  { key: "groupDetails.loanAmount", label: "Loan Amount", getValue: (l) => l.loanAmount, getInitial: (i) => i.loanAmount },
  { key: "groupDetails.dateOfLoanDisbursement", label: "Date of Loan Disbursement", getValue: (l) => l.loanDisbursementDate, getInitial: (i) => i.loanDisbursementDate },
  { key: "groupDetails.shareOfLoan", label: "Share of Loan", getValue: (l) => l.loanShare, getInitial: (i) => i.loanShare },
  { key: "groupDetails.loanTerm", label: "Loan Term", getValue: (l) => l.loanTerm, getInitial: (i) => i.loanTerm },
  { key: "productDetail.policyTerm", label: "Policy Term", getValue: (l) => l.policyTerm, getInitial: (i) => i.policyTerm },
  { key: "sourcingDetail.lanNumber", label: "Loan Account Number", getValue: (l) => l.loanAccountNumber, getInitial: (i) => i.loanAccountNumber },
];

function buildBaseAndLoanSection(
  loan: LoanEditValues,
  initialLoan?: Partial<LoanEditValues>,
) {
  const fields: KeyValueField[] = [];
  const keys: string[] = [];
  const hasScope = Boolean(initialLoan);

  for (const mapping of BASE_LOAN_MAPPINGS) {
    const currentVal = mapping.getValue(loan);
    const initialVal = initialLoan ? mapping.getInitial(initialLoan) : undefined;
    if (isFieldChanged(currentVal, initialVal, hasScope)) {
      fields.push({ key: mapping.key, label: mapping.label, value: currentVal ?? "" });
      keys.push(mapping.key);
    }
  }

  return {
    section: fields.length > 0 ? { value: fields } : undefined,
    keys,
  };
}

function buildContactAddressSection(
  values: EditApplicantValues,
  initialValues?: Partial<EditApplicantValues>,
) {
  const groups: Array<{ label: string; value: KeyValueField[] }> = [];
  const keys: string[] = [];
  const hasScope = Boolean(initialValues);

  if (isFieldChanged(values.zipCode, initialValues?.zipCode, hasScope)) {
    groups.push({
      label: "Communication Address",
      value: [{ key: "address.communication.pinCode", label: "Pincode", value: values.zipCode ?? "" }],
    });
    keys.push("address.communication.pinCode");
  }

  const contactFields: KeyValueField[] = [];
  if (isFieldChanged(values.mobileNo, initialValues?.mobileNo, hasScope)) {
    contactFields.push({ key: "contactDetails.mobileNo", label: "Mobile No", value: values.mobileNo ?? "" });
    keys.push("contactDetails.mobileNo");
  }
  if (isFieldChanged(values.emailId, initialValues?.emailId, hasScope)) {
    contactFields.push({ key: "contactDetails.emailId", label: "Email Id", value: values.emailId ?? "" });
    keys.push("contactDetails.emailId");
  }
  if (contactFields.length > 0) {
    groups.push({ label: "Contact Details", value: contactFields });
  }

  return {
    section: groups.length > 0 ? { value: groups } : undefined,
    keys,
  };
}

function buildFinancialSection(
  values: EditApplicantValues,
  initialValues?: Partial<EditApplicantValues>,
) {
  const fields: KeyValueField[] = [];
  const keys: string[] = [];

  if (isFieldChanged(values.annualIncome, initialValues?.annualIncome, Boolean(initialValues))) {
    fields.push({ key: "financialDetails.annualIncome", label: "Annual Income", value: values.annualIncome ?? "" });
    keys.push("financialDetails.annualIncome");
  }

  return {
    section: fields.length > 0 ? { value: fields } : undefined,
    keys,
  };
}

function buildMedicalLifestyleSection(
  values: EditApplicantValues,
  initialValues?: Partial<EditApplicantValues>,
) {
  const groups: Array<{ label: string; value: unknown }> = [];
  const keys: string[] = [];
  const hasScope = Boolean(initialValues);

  const healthFields: KeyValueField[] = [];
  if (isFieldChanged(values.height, initialValues?.height, hasScope)) {
    healthFields.push({ key: "height", label: "Height", value: values.height ?? "" });
    keys.push("height");
  }
  if (isFieldChanged(values.weight, initialValues?.weight, hasScope)) {
    healthFields.push({ key: "weight", label: "Weight", value: values.weight ?? "" });
    keys.push("weight");
  }
  if (healthFields.length > 0) {
    groups.push({ label: "Health Information", value: healthFields });
  }

  return {
    section: groups.length > 0 ? { value: groups } : undefined,
    keys,
  };
}

function buildNomineeSection(nominees: NomineeEditRow[], initialNominees?: NomineeEditRow[]) {
  const isChanged = !initialNominees || JSON.stringify(nominees) !== JSON.stringify(initialNominees);
  if (!isChanged || nominees.length === 0) {
    return { section: undefined, keys: [] };
  }

  const rows = nominees.map((n, idx) => ({
    nomineeId: (n as { nomineeId?: string }).nomineeId || `NOM${String(idx + 1).padStart(16, "0")}`,
    firstName: n.firstName,
    lastName: n.lastName,
    dob: n.dob,
    gender: n.gender,
    relationship: n.proposerNomineeRelation,
    share: n.percentage,
    accountNumber: n.accountNumber,
    ifsc: n.ifsc,
  }));

  return {
    section: { value: [{ label: "Nominee Details", rows }] },
    keys: ["nominee.rows"],
  };
}

function toRiderCode(nameOrCode: string): string {
  const trimmed = nameOrCode.trim();
  if (!trimmed) return "";
  const list = getMasterList("rider");
  const match = list.find(
    (entry) =>
      entry.code === trimmed ||
      entry.description?.trim().toLowerCase() === trimmed.toLowerCase() ||
      entry.code?.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return match?.code ?? trimmed;
}

function buildProductDetailsSection(riders: RiderEditRow[], initialRiders?: RiderEditRow[]) {
  const isChanged = !initialRiders || JSON.stringify(riders) !== JSON.stringify(initialRiders);
  if (!isChanged || riders.length === 0) {
    return { section: undefined, keys: [] };
  }

  const rows = riders.map((r) => ({
    ...((r as { productId?: string }).productId ? { productId: (r as { productId?: string }).productId } : {}),
    productName: toRiderCode(r.riderName),
    productType: "rider",
    sumAssured: r.sumAssured,
    term: r.riderTerm,
  }));

  return {
    section: { value: { rows } },
    keys: ["product_details.rows"],
  };
}

export function buildApplicantSavePayload(arg: SaveGroupDrsApplicantArg) {
  const sessionUser = getSessionUser();
  const userId = arg.userId ?? sessionUser?.username ?? "dvt.user";
  const taskType = arg.roleType ?? getDrsRoleType();
  const taskConfig = getGroupDrsTaskConfig(taskType);
  const roleType = arg.roleType ?? taskConfig.roleType ?? "DVT_TASK";
  const screenType = arg.screenType ?? taskConfig.screenType ?? "DVT_INFORMAL";
  const businessType = arg.businessType ?? getSessionBusinessType() ?? taskConfig.businessType ?? "GROUP";

  const personalKyc = buildPersonalKycSection(arg.values, arg.initialValues);
  const contactAddress = buildContactAddressSection(arg.values, arg.initialValues);
  const financial = buildFinancialSection(arg.values, arg.initialValues);
  const medicalLifestyle = buildMedicalLifestyleSection(arg.values, arg.initialValues);
  const baseAndLoan = buildBaseAndLoanSection(arg.loan, arg.initialLoan);
  const nominee = buildNomineeSection(arg.nominees, arg.initialNominees);
  const productDetails = buildProductDetailsSection(arg.riders, arg.initialRiders);

  const applicantProfileValue: Record<string, unknown> = {};
  if (personalKyc.section) applicantProfileValue.personal_kyc = personalKyc.section;
  if (contactAddress.section) applicantProfileValue.contact_and_address = contactAddress.section;
  if (financial.section) applicantProfileValue.financial_and_profession = financial.section;
  if (medicalLifestyle.section) applicantProfileValue.medical_and_lifestyle = medicalLifestyle.section;
  if (baseAndLoan.section) applicantProfileValue.base_and_loan_details = baseAndLoan.section;
  if (nominee.section) applicantProfileValue.nominee = nominee.section;
  if (productDetails.section) applicantProfileValue.product_details = productDetails.section;

  const keysSent = [
    ...personalKyc.keys,
    ...contactAddress.keys,
    ...financial.keys,
    ...medicalLifestyle.keys,
    ...baseAndLoan.keys,
    ...nominee.keys,
    ...productDetails.keys,
  ];

  const payload = {
    applicationNo: arg.applicationNo,
    userId,
    roleType,
    screenType,
    businessType,
    data: {
      membersDetails: [
        {
          memberType: arg.memberType ?? arg.applicantId ?? "lifeassured1",
          partyId: arg.partyId ?? "",
          sections: [
            {
              name: "applicantProfile",
              value: applicantProfileValue,
            },
          ],
        },
      ],
    },
  };

  return { payload, keysSent };
}

function updateFieldValues(
  fields: Array<{ label: string; value?: string | number | null }> | undefined,
  valueMap: Record<string, string | undefined>,
) {
  if (!fields) return;
  for (const field of fields) {
    const updated = valueMap[field.label.toLowerCase()];
    if (updated !== undefined && updated !== "") {
      field.value = updated;
    }
  }
}

/** Master code -> description for display ("M" -> "Male"); unknown values are kept as they are. */
function genderDescription(code: string): string {
  return getMasterList("gender").find((entry) => entry.code === code)?.description ?? code;
}

function toNomineeDisplayRows(nominees: NomineeEditRow[]) {
  return nominees.map((n) => ({
    nomineeName: `${n.firstName} ${n.lastName}`.trim(),
    nomineeDOB: n.dob,
    gender: genderDescription(n.gender),
    relationship: n.proposerNomineeRelation,
    sharePercentage: Number(n.percentage) || 0,
    isLASame: "",
    relationShipWithJL: "",
    laFlag: "",
  }));
}

function updateApplicantInGroupDrsDraft(draft: GroupDrsData, arg: SaveGroupDrsApplicantArg) {
  const applicant = draft.applicants.find(
    (a) => a.id === arg.applicantId || (arg.partyId && a.partyId === arg.partyId),
  );
  if (!applicant) return;

  applicant.editValues = { ...applicant.editValues, ...arg.values };
  applicant.editLoan = { ...applicant.editLoan, ...arg.loan };
  applicant.editNominees = arg.nominees;
  applicant.editRiders = arg.riders;

  updateFieldValues(applicant.personalFields, {
    "date of birth": arg.values.dob,
    gender: arg.values.gender,
    "resident status": arg.values.immigrationStatus,
  });

  updateFieldValues(applicant.kycFields, {
    "pan number": arg.values.panNumber,
    "pan flag": arg.values.isPanValid,
    "pan aadhar seeding status": arg.values.aadharSeedingStatus,
  });

  updateFieldValues(applicant.contactDetails, {
    "mobile number": arg.values.mobileNo,
    "email id": arg.values.emailId,
  });

  updateFieldValues(applicant.lifestyleFields, {
    height: arg.values.height,
    weight: arg.values.weight,
  });

  if (arg.nominees?.length > 0) {
    applicant.nominees = toNomineeDisplayRows(arg.nominees);
  }
}

export const groupDrsApi = createApi({
  reducerPath: "groupDrsApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getGroupDrs: build.query<GroupDrsData, GroupDrsQueryArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapGroupDrsPayload(groupDrsMock) };
        }
        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "POST",
          body: buildDrsRequestBody(arg),
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapGroupDrsPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    /** Raw DRS payload for GUW / HOD / Sr UW; mapped by `drsService` (same request body as DVT). */
    getGuwDrsPayload: build.query<unknown, GroupDrsQueryArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          const mockRole = (typeof arg === "string" ? getDrsRoleType() : (arg.taskType ?? arg.roleType ?? getDrsRoleType()))
            ?.trim()
            .toUpperCase();
          if (mockRole === "HOD" || mockRole === "HOD_TASK") return { data: guwHodDrsMock as unknown };
          if (mockRole === "SR_UW" || mockRole === "SR_UW_TASK") return { data: guwSrUwDrsMock as unknown };
          return { data: guwDrsMock as unknown };
        }
        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "POST",
          body: buildDrsRequestBody(arg),
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: result.data };
      },
    }),
    /** Underwriting Decision History of the application (HOD / Sr UW page load). */
    getGuwUwDecisionHistory: build.query<ReferralDecisionHistoryRow[], GuwUwDecisionHistoryRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) return { data: mapReferralDecisionHistory(guwUwDecisionHistoryMock) };
        const fetchUrl = groupBusinessUrls.uwDecisionFetch;
        if (fetchUrl.length === 0) {
          return { error: customError("UW decision fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "POST",
          body: {
            applicationNumber: arg.applicationNumber,
            level: "application",
            screenType: "GUW",
            lob: GUW_LOB,
          },
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: mapReferralDecisionHistory(result.data) };
      },
    }),
    /** Claim Audit list of one member (GUW "Claim Audit" button). */
    getGuwClaimAuditList: build.query<unknown, GuwClaimAuditListRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) return { data: guwClaimAuditListMock as unknown };
        const listUrl = groupBusinessUrls.claimAuditList;
        if (listUrl.length === 0) {
          return { error: customError("Claim audit list API is not configured.") };
        }

        const result = await baseQuery({
          url: listUrl,
          method: "POST",
          body: { applicationNumber: arg.applicationNumber, partyId: arg.partyId },
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: result.data };
      },
    }),
    /**
     * Member-level UW decision (decision code + remarks) for the GUW screen.
     * Raise Referral sends an array (one item per referral) and gets one saved decision per item back.
     */
    getGuwUwDecision: build.mutation<GuwUwDecisionResult[], GuwUwDecisionRequest | GuwUwDecisionRequest[]>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const sessionUser = getSessionUser();
        const fallbackUserId = sessionUser?.username ?? "";
        const payload = Array.isArray(arg)
          ? arg.map((item) => ({ ...item, userId: item.userId?.trim() || item.createdBy?.trim() || fallbackUserId }))
          : { ...arg, userId: arg.userId?.trim() || arg.createdBy?.trim() || fallbackUserId };

        console.log("[getGuwUwDecision] request payload:", payload);
        if (useMock) {
          console.log("[getGuwUwDecision] response (mock):", guwUwDecisionMock);
          return { data: mapGuwUwDecisions(guwUwDecisionMock) };
        }
        const uwDecisionUrl = groupBusinessUrls.uwDecision;
        if (uwDecisionUrl.length === 0) {
          return { error: customError("Group UW decision API is not configured.") };
        }

        const result = await baseQuery({
          url: uwDecisionUrl,
          method: "POST",
          body: payload,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) {
          console.log("[getGuwUwDecision] response error:", result.error);
          return { error: result.error };
        }
        console.log("[getGuwUwDecision] response:", result.data);

        try {
          return { data: mapGuwUwDecisions(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    /** Users of a role (HOD / Sr UW) for the "Assigned To" dropdowns; `roleName` is the last path segment. */
    getUsersByRole: build.query<GuwAssigneeOption[], string>({
      async queryFn(roleName, _api, _extra, baseQuery) {
        if (useMock) return { data: mapUsersByRole(usersByRoleMock) };
        const baseUrl = userUrls.usersByRole;
        if (baseUrl.length === 0) {
          return { error: customError("Users by role API is not configured.") };
        }

        let headers: Record<string, string>;
        try {
          headers = buildAuthServiceGetHeaders();
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }

        const result = await baseQuery({
          url: `${baseUrl}/${encodeURIComponent(roleName)}`,
          method: "GET",
          headers,
        });
        if (result.error) return { error: result.error };
        return { data: mapUsersByRole(result.data) };
      },
    }),
    /** Parallel decision (Opinion / Counter Sign / Raise Referral) for the GUW screen. */
    saveGuwParallelDecision: build.mutation<unknown, GuwParallelDecisionRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const sessionUser = getSessionUser();
        const fallbackUserId = sessionUser?.username ?? "";
        const payload: GuwParallelDecisionRequest = {
          ...arg,
          decision: "",
          remarks: " ",
          userId: arg.userId?.trim() || fallbackUserId,
        };

        console.log("[saveGuwParallelDecision] request payload:", payload);
        if (useMock) return { data: null };
        const parallelDecisionUrl = groupBusinessUrls.parallelDecision;
        if (parallelDecisionUrl.length === 0) {
          return { error: customError("Group parallel decision API is not configured.") };
        }

        const result = await baseQuery({
          url: parallelDecisionUrl,
          method: "POST",
          body: payload,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) {
          console.log("[saveGuwParallelDecision] response error:", result.error);
          return { error: result.error };
        }
        console.log("[saveGuwParallelDecision] response:", result.data);
        return { data: result.data };
      },
    }),
    saveGroupDrsRequirements: build.mutation<RequirementItem[], SaveGroupDrsRequirementsArg>({
      async queryFn(arg, api, _extra, baseQuery) {
        const body = buildRequirementsSavePayload(arg);

        console.log("[saveGroupDrsRequirements] PUT payload to send:", body);

        // Save response mirrors the applicant-save payload: the rows live in the
        // `requirementManagement` entry of `commonSection`.
        const applyResponseToCache = (responseData: unknown): RequirementItem[] => {
          const resp = isRecord(responseData) ? responseData : null;
          const respData = isRecord(resp?.data) ? resp.data : resp;
          const sections = Array.isArray(respData?.commonSection) ? respData.commonSection : respData?.sections;
          const requirementSection = Array.isArray(sections)
            ? sections.find((s) => isRecord(s) && s.name === "requirementManagement")
            : undefined;
          const updatedRequirements = mapRawRequirementRows(requirementSection);

          if (arg.queryArg) {
            api.dispatch(
              groupDrsApi.util.updateQueryData("getGroupDrs", arg.queryArg, (draft) => {
                draft.requirements = updatedRequirements;
              }),
            );
          }
          api.dispatch(
            groupDrsApi.util.updateQueryData("getGroupDrs", arg.applicationNo, (draft) => {
              draft.requirements = updatedRequirements;
            }),
          );
          return updatedRequirements;
        };

        if (useMock) {
          if (arg.requirements && arg.requirements.length > 0) {
            return { data: arg.requirements };
          }
          return { data: applyResponseToCache(groupDrsApplicantSaveMock) };
        }

        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "PUT",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });

        if (result.error) return { error: result.error };

        try {
          return { data: applyResponseToCache(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    saveGroupDrsApplicant: build.mutation<unknown, SaveGroupDrsApplicantArg>({
      async queryFn(arg, api, _extra, baseQuery) {
        const { payload: body, keysSent } = buildApplicantSavePayload(arg);

        console.log("[saveGroupDrsApplicant] PUT payload to send:", body);
        console.log("[saveGroupDrsApplicant] Keys sent in request payload:", keysSent);

        const applyResponseToCache = (responseData: unknown) => {
          let mapped: GroupDrsData;
          try {
            mapped = mapGroupDrsPayload(responseData);
          } catch (e) {
            console.warn(
              "[saveGroupDrsApplicant] Could not map full response payload, falling back to field update:",
              e,
            );
            if (arg.queryArg) {
              api.dispatch(
                groupDrsApi.util.updateQueryData("getGroupDrs", arg.queryArg, (draft) => {
                  updateApplicantInGroupDrsDraft(draft, arg);
                }),
              );
            }
            api.dispatch(
              groupDrsApi.util.updateQueryData("getGroupDrs", arg.applicationNo, (draft) => {
                updateApplicantInGroupDrsDraft(draft, arg);
              }),
            );
            return;
          }

          const updateDraft = (draft: GroupDrsData) => {
            draft.cardDetails = mapped.cardDetails;
            draft.breDecision = mapped.breDecision;
            draft.dvtDecision = mapped.dvtDecision;
            draft.requirements = mapped.requirements;
            draft.applicants = mapped.applicants;
            draft.memberTypes = mapped.memberTypes;
            draft.quickLinks = mapped.quickLinks;
            draft.rowDetails = mapped.rowDetails;
            draft.applicantName = mapped.applicantName;
            draft.grievanceHistoryTitle = mapped.grievanceHistoryTitle;
            draft.tpaGrievanceTitle = mapped.tpaGrievanceTitle;
            draft.grievanceHistoryColumns = mapped.grievanceHistoryColumns;
            draft.tpaGrievanceColumns = mapped.tpaGrievanceColumns;
            draft.grievanceHistory = mapped.grievanceHistory;
            draft.tpaGrievanceDetails = mapped.tpaGrievanceDetails;
            draft.subSections = mapped.subSections;
            draft.memberContext = mapped.memberContext;
          };

          if (arg.queryArg) {
            api.dispatch(groupDrsApi.util.updateQueryData("getGroupDrs", arg.queryArg, updateDraft));
          }
          api.dispatch(groupDrsApi.util.updateQueryData("getGroupDrs", arg.applicationNo, updateDraft));
        };

        if (useMock) {
          applyResponseToCache(groupDrsApplicantSaveMock);
          return { data: groupDrsApplicantSaveMock };
        }

        const drsDataUrl = groupBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Group DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "PUT",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });

        if (result.error) return { error: result.error };

        try {
          applyResponseToCache(result.data);
          return { data: result.data };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
  }),
});

export const {
  useGetGroupDrsQuery,
  useGetGuwDrsPayloadQuery,
  useGetGuwUwDecisionHistoryQuery,
  useLazyGetGuwClaimAuditListQuery,
  useGetGuwUwDecisionMutation,
  useGetUsersByRoleQuery,
  useSaveGuwParallelDecisionMutation,
  useSaveGroupDrsRequirementsMutation,
  useSaveGroupDrsApplicantMutation,
} = groupDrsApi;
