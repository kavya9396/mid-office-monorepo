import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { DecisionHistoryRow } from "@insurance-poc/common/decision-history";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import {
  absoluteApiBaseUrl,
  buildAuthServiceGetHeaders,
  createBusinessBaseQuery,
  getDrsRoleType,
  getSessionBusinessType,
  getSessionUser,
  retailBusinessUrls,
  useMock,
  userUrls,
} from "@insurance-poc/utils";
import { getRetailDrsTaskConfig } from "../config/drsTaskConfig";
import retailDrsMock from "../modules/drs/mock/retailDrs.json";
import retailUwDecisionHistoryMock from "../../../../mock/drs/retail-uw-decision-history.json";
import cuwDrsMock from "../../../../mock/drs/cuw-informal-drs.json";
import cuwHodDrsMock from "../../../../mock/drs/cuw-hod-drs.json";
import cuwSrUwDrsMock from "../../../../mock/drs/cuw-sr-uw-drs.json";
import cuwUwDecisionMock from "../../../../mock/drs/cuw-uw-decision.json";
import cuwClaimAuditListMock from "../../../../mock/drs/cuw-claim-audit-list.json";
import cuwUwDecisionHistoryMock from "../../../../mock/drs/cuw-uw-decision-history.json";
import usersByRoleMock from "../../../../mock/drs/users-by-role.json";
import type { CvtEditApplicantValues } from "../modules/drs/CvtEditApplicantDialog";
import {
  CUW_LOB,
  mapCuwUwDecisions,
  mapDecisionHistory,
  mapRawRequirementRows,
  mapReferralDecisionHistory,
  mapRetailDrsPayload,
  mapUsersByRole,
  type CuwAssigneeOption,
  type CuwParallelDecisionRequest,
  type CuwUwDecisionRequest,
  type CuwUwDecisionResult,
  type ReferralDecisionHistoryRow,
  type RetailDrsData,
} from "./drsService";

/** `lob` sent to the UW decision fetch API for Retail. */
const RETAIL_LOB = CUW_LOB;

/** Request of `uw-decision/fetch` (HOD / Sr UW Underwriting Decision History). */
export type CuwUwDecisionHistoryRequest = {
  applicationNumber: string;
};

export type CuwClaimAuditListRequest = {
  applicationNumber: string;
  partyId: string;
};

/** `data.commonSection` and `data.membersDetails` of the DRS response, sent back as-is with the requirement save. */
export type CuwDrsRequirementData = {
  commonSection: unknown;
  membersDetails: unknown;
};

/** Request of `uw-decision/fetch` (CVT Decision History). */
export type RetailUwDecisionHistoryRequest = {
  applicationNumber: string;
};

export type RetailDrsQueryArg = {
  applicationNo: string;
  roleType?: string;
  screenType?: string;
  businessType?: string;
};

export type SaveRetailDrsRequirementsArg = {
  applicationNo: string;
  requirements: RequirementItem[];
  roleType?: string;
  lob?: string;
  userId?: string;
  queryArg?: RetailDrsQueryArg;
  /** CUW: when set, the whole DRS response (with the updated requirements) is sent instead of the `requirementManagement` section only. */
  drsData?: CuwDrsRequirementData;
  caseType?: string;
};

export type SaveRetailDrsApplicantArg = {
  applicationNo: string;
  applicantId: string;
  partyId?: string;
  memberType?: string;
  values: CvtEditApplicantValues;
  initialValues?: CvtEditApplicantValues;
  roleType?: string;
  screenType?: string;
  businessType?: string;
  userId?: string;
  queryArg: RetailDrsQueryArg;
};

type KeyValueField = { key: string; label: string; value: string };

type FieldMapping = {
  key: string;
  label: string;
  field: keyof CvtEditApplicantValues;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to load the Retail DRS.";
}

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

/** DRS fetch request body. `roleType` / `screenType` / `businessType` come from `drsTaskConfig` unless passed explicitly. */
function buildDrsRequestBody(arg: RetailDrsQueryArg) {
  const taskConfig = getRetailDrsTaskConfig(arg.roleType ?? getDrsRoleType());
  return {
    applicationNo: arg.applicationNo,
    roleType: arg.roleType || taskConfig.roleType,
    screenType: arg.screenType || taskConfig.screenType,
    businessType: arg.businessType || taskConfig.businessType,
  };
}

const isPersistedRequirementId = (item: RequirementItem): boolean =>
  typeof item.id === "number" ||
  (typeof item.id === "string" && !item.id.startsWith("req-") && Number.isFinite(Number(item.id)) && Number(item.id) > 0);

/** Saved requirements keep their numeric `requirementId`; a newly added one has none, so it is sent blank. */
function toCuwRequirementRow(item: RequirementItem, original?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...original,
    status: item.status,
    ocrStatus: item.ocrStatus,
    team: item.team,
    profile: item.profile,
    category: item.category,
    subCategory: item.subCategory,
    document: item.document,
    reason: item.reason,
    fupCode: item.fupCode,
    extraRemarks: item.extraRemarks,
    description: item.description,
    requirementId: isPersistedRequirementId(item) ? Number(item.id) : "",
  };
}

/** `commonSection` with the rows of `requirementManagement` replaced by the updated requirements. */
function buildCuwCommonSection(commonSection: unknown, requirements: RequirementItem[]): unknown {
  if (!Array.isArray(commonSection)) return commonSection;
  return commonSection.map((section) => {
    if (!isRecord(section) || section.name !== "requirementManagement") return section;

    const rowsHolder = isRecord(section.value) && Array.isArray(section.value.rows) ? section.value : section;
    const originalRows = Array.isArray(rowsHolder.rows) ? rowsHolder.rows.filter(isRecord) : [];
    const originalById = new Map(originalRows.map((row) => [String(row.requirementId), row]));
    const rows = requirements.map((item) =>
      toCuwRequirementRow(item, isPersistedRequirementId(item) ? originalById.get(String(item.id)) : undefined),
    );

    return rowsHolder === section ? { ...section, rows } : { ...section, value: { ...rowsHolder, rows } };
  });
}

export const toRequirementRequestItem = (item: RequirementItem) => {
  const isNumericId = isPersistedRequirementId(item);

  const payload: Record<string, unknown> = {
    status: item.status || "Pending",
    profile: item.profile || "",
    fupCode: item.fupCode || "",
    category: item.category || "",
    subCategory: item.subCategory || "",
    document: item.document || "",
    extraRemarks: item.extraRemarks || "",
  };

  if (isNumericId) payload.requirementId = Number(item.id);
  if (item.team) payload.team = item.team;
  if (item.reason) payload.reason = item.reason;
  if (item.description) payload.description = item.description;
  if (item.ocrStatus) payload.ocrStatus = item.ocrStatus;

  return payload;
};

const PERSONAL_KYC_MAPPINGS: FieldMapping[] = [
  { key: "proposerSummary.dob", label: "Date Of Birth", field: "dob" },
  { key: "proposerSummary.gender", label: "Gender", field: "gender" },
  { key: "proposerSummary.residentStatus", label: "Resident Status", field: "residentialStatus" },
  { key: "kycDetails.panNumber", label: "Pan Number", field: "panNumber" },
  { key: "kycDetails.isPanValid", label: "Pan Flag", field: "panFlag" },
  { key: "kycDetails.pranNo", label: "Pran Number", field: "pranNumber" },
  { key: "kycDetails.dobDocument", label: "Dob Document", field: "ageProof" },
  { key: "kycDetails.genderDocument", label: "Gender Document", field: "identityProof" },
  { key: "kycDetails.pincodeDocument", label: "Pincode Document", field: "addressProof" },
];

const ADDRESS_MAPPINGS: Array<FieldMapping & { groupLabel: string }> = [
  {
    groupLabel: "Communication Address",
    key: "address.communication.pinCode",
    label: "Pincode",
    field: "communicationPincode",
  },
  {
    groupLabel: "Permanent Address",
    key: "address.permanent.pinCode",
    label: "Pincode",
    field: "permanentPincode",
  },
];

const toCleanString = (value?: string): string => (value === undefined ? "" : value.trim());

const isChanged = (arg: SaveRetailDrsApplicantArg, field: keyof CvtEditApplicantValues): boolean =>
  toCleanString(arg.values[field]) !== toCleanString(arg.initialValues?.[field]);

/** Only the edited fields are sent, each with the `key` the DRS response uses for it. */
export function buildRetailApplicantSavePayload(arg: SaveRetailDrsApplicantArg) {
  const taskConfig = getRetailDrsTaskConfig(arg.roleType ?? getDrsRoleType());
  const userId = arg.userId ?? getSessionUser()?.username ?? "cvt.user";

  const personalFields: KeyValueField[] = PERSONAL_KYC_MAPPINGS.filter((mapping) => isChanged(arg, mapping.field)).map(
    (mapping) => ({ key: mapping.key, label: mapping.label, value: arg.values[mapping.field] }),
  );
  const addressGroups = ADDRESS_MAPPINGS.filter((mapping) => isChanged(arg, mapping.field)).map((mapping) => ({
    label: mapping.groupLabel,
    value: [{ key: mapping.key, label: mapping.label, value: arg.values[mapping.field] }],
  }));

  const applicantProfileValue: Record<string, unknown> = {};
  if (personalFields.length > 0) applicantProfileValue.personal_kyc = { groups: [personalFields] };
  if (addressGroups.length > 0) applicantProfileValue.contact_and_address = { value: addressGroups };

  const keysSent = [
    ...personalFields.map((field) => field.key),
    ...addressGroups.flatMap((group) => group.value.map((field) => field.key)),
  ];

  const payload = {
    applicationNo: arg.applicationNo,
    userId,
    roleType: arg.roleType ?? taskConfig.roleType,
    screenType: arg.screenType ?? taskConfig.screenType,
    businessType: arg.businessType ?? getSessionBusinessType() ?? taskConfig.businessType,
    data: {
      membersDetails: [
        {
          memberType: arg.memberType ?? arg.applicantId,
          partyId: arg.partyId ?? "",
          sections: [{ name: "applicantProfile", value: applicantProfileValue }],
        },
      ],
    },
  };

  return { payload, keysSent };
}

export const retailDrsApi = createApi({
  reducerPath: "retailDrsApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getRetailDrs: build.query<RetailDrsData, RetailDrsQueryArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          return { data: mapRetailDrsPayload(retailDrsMock) };
        }
        const drsDataUrl = retailBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Retail DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "POST",
          body: buildDrsRequestBody(arg),
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapRetailDrsPayload(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    /** Decision History of the application (CVT page load). */
    getRetailUwDecisionHistory: build.query<DecisionHistoryRow[], RetailUwDecisionHistoryRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) return { data: mapDecisionHistory(retailUwDecisionHistoryMock) };
        const fetchUrl = retailBusinessUrls.uwDecisionFetch;
        if (fetchUrl.length === 0) {
          return { error: customError("UW decision fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "POST",
          body: {
            applicationNumber: arg.applicationNumber,
            level: "application",
            screenType: "CVT",
            lob: RETAIL_LOB,
          },
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: mapDecisionHistory(result.data) };
      },
    }),
    /** Raw DRS payload for CUW / HOD / Sr UW; mapped by `drsService` (same request body as CVT). */
    getCuwDrsPayload: build.query<unknown, RetailDrsQueryArg & { taskType?: string }>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) {
          const mockRole = (arg.taskType ?? arg.roleType ?? getDrsRoleType())?.trim().toUpperCase();
          if (mockRole === "HOD" || mockRole === "HOD_TASK") return { data: cuwHodDrsMock as unknown };
          if (mockRole === "SR_UW" || mockRole === "SR_UW_TASK") return { data: cuwSrUwDrsMock as unknown };
          return { data: cuwDrsMock as unknown };
        }
        const drsDataUrl = retailBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Retail DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "POST",
          body: buildDrsRequestBody({ ...arg, roleType: arg.roleType ?? arg.taskType }),
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: result.data };
      },
    }),
    /** Underwriting Decision History of the application (HOD / Sr UW page load). */
    getCuwUwDecisionHistory: build.query<ReferralDecisionHistoryRow[], CuwUwDecisionHistoryRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) return { data: mapReferralDecisionHistory(cuwUwDecisionHistoryMock) };
        const fetchUrl = retailBusinessUrls.uwDecisionFetch;
        if (fetchUrl.length === 0) {
          return { error: customError("UW decision fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "POST",
          body: {
            applicationNumber: arg.applicationNumber,
            level: "application",
            screenType: "CUW",
            lob: CUW_LOB,
          },
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: mapReferralDecisionHistory(result.data) };
      },
    }),
    /** Claim Audit list of one member (CUW "Claim Audit" button). */
    getCuwClaimAuditList: build.query<unknown, CuwClaimAuditListRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        if (useMock) return { data: cuwClaimAuditListMock as unknown };
        const listUrl = retailBusinessUrls.claimAuditList;
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
     * Member-level UW decision (decision code + remarks) for the CUW screen.
     * Raise Referral sends an array (one item per referral) and gets one saved decision per item back.
     */
    getCuwUwDecision: build.mutation<CuwUwDecisionResult[], CuwUwDecisionRequest | CuwUwDecisionRequest[]>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const sessionUser = getSessionUser();
        const fallbackUserId = sessionUser?.username ?? "";
        const payload = Array.isArray(arg)
          ? arg.map((item) => ({ ...item, userId: item.userId?.trim() || item.createdBy?.trim() || fallbackUserId }))
          : { ...arg, userId: arg.userId?.trim() || arg.createdBy?.trim() || fallbackUserId };

        if (useMock) return { data: mapCuwUwDecisions(cuwUwDecisionMock) };
        const uwDecisionUrl = retailBusinessUrls.uwDecision;
        if (uwDecisionUrl.length === 0) {
          return { error: customError("Retail UW decision API is not configured.") };
        }

        const result = await baseQuery({
          url: uwDecisionUrl,
          method: "POST",
          body: payload,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          return { data: mapCuwUwDecisions(result.data) };
        } catch (reason: unknown) {
          return { error: customError(readError(reason)) };
        }
      },
    }),
    /** Users of a role (HOD / Sr UW) for the "Assigned To" dropdowns; `roleName` is the last path segment. */
    getUsersByRole: build.query<CuwAssigneeOption[], string>({
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
    /** Parallel decision (Opinion / Counter Sign / Raise Referral) for the CUW screen. */
    saveCuwParallelDecision: build.mutation<unknown, CuwParallelDecisionRequest>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const sessionUser = getSessionUser();
        const fallbackUserId = sessionUser?.username ?? "";
        const payload: CuwParallelDecisionRequest = {
          ...arg,
          decision: "",
          remarks: " ",
          userId: arg.userId?.trim() || fallbackUserId,
        };

        if (useMock) return { data: null };
        const parallelDecisionUrl = retailBusinessUrls.parallelDecision;
        if (parallelDecisionUrl.length === 0) {
          return { error: customError("Retail parallel decision API is not configured.") };
        }

        const result = await baseQuery({
          url: parallelDecisionUrl,
          method: "POST",
          body: payload,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };
        return { data: result.data };
      },
    }),
    saveRetailDrsRequirements: build.mutation<RequirementItem[], SaveRetailDrsRequirementsArg>({
      async queryFn(arg, api, _extra, baseQuery) {
        const taskConfig = getRetailDrsTaskConfig(arg.roleType ?? getDrsRoleType());
        const userId = arg.userId ?? getSessionUser()?.username ?? "cvt.user";
        const roleType = arg.roleType ?? taskConfig.roleType;
        const body = arg.drsData
          ? {
              applicationNo: arg.applicationNo,
              userId,
              screenType: taskConfig.screenType,
              businessType: taskConfig.businessType,
              roleType,
              caseType: arg.caseType ?? "",
              data: {
                commonSection: buildCuwCommonSection(arg.drsData.commonSection, arg.requirements),
                membersDetails: arg.drsData.membersDetails,
                memberDetails: arg.drsData.membersDetails,
              },
            }
          : {
              applicationNo: arg.applicationNo,
              lob: arg.lob ?? "R",
              userId,
              roleType,
              sections: ["requirementManagement"],
              data: {
                requirementManagement: arg.requirements.map(toRequirementRequestItem),
              },
            };

        const applyToCache = (updated: RequirementItem[]): RequirementItem[] => {
          if (arg.queryArg) {
            api.dispatch(
              retailDrsApi.util.updateQueryData("getRetailDrs", arg.queryArg, (draft) => {
                draft.requirements = updated;
              }),
            );
          }
          return updated;
        };

        if (useMock) return { data: applyToCache(arg.requirements) };

        const drsDataUrl = retailBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Retail DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "PUT",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        // The save response carries the rows in the `requirementManagement` entry of `commonSection`.
        const response = isRecord(result.data) ? result.data : null;
        const responseData = isRecord(response?.data) ? response.data : response;
        const sections = Array.isArray(responseData?.commonSection) ? responseData.commonSection : [];
        const requirementSection = sections.find((s) => isRecord(s) && s.name === "requirementManagement");
        return { data: applyToCache(mapRawRequirementRows(requirementSection)) };
      },
    }),
    saveRetailDrsApplicant: build.mutation<unknown, SaveRetailDrsApplicantArg>({
      async queryFn(arg, api, _extra, baseQuery) {
        const { payload: body, keysSent } = buildRetailApplicantSavePayload(arg);
        console.log("[saveRetailDrsApplicant] Keys sent in request payload:", keysSent);

        /** Shows the saved dialog values straight away, without waiting for a full response. */
        const patchEditValues = () => {
          api.dispatch(
            retailDrsApi.util.updateQueryData("getRetailDrs", arg.queryArg, (draft) => {
              draft.editValues[arg.applicantId] = arg.values;
            }),
          );
        };

        if (useMock) {
          patchEditValues();
          return { data: null };
        }

        const drsDataUrl = retailBusinessUrls.drsData;
        if (drsDataUrl.length === 0) {
          return { error: customError("Retail DRS data API is not configured.") };
        }

        const result = await baseQuery({
          url: drsDataUrl,
          method: "PUT",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        try {
          const mapped = mapRetailDrsPayload(result.data);
          api.dispatch(
            retailDrsApi.util.updateQueryData("getRetailDrs", arg.queryArg, (draft) => {
              draft.cardDetails = mapped.cardDetails;
              draft.breDecision = mapped.breDecision;
              draft.requirements = mapped.requirements;
              draft.applicants = mapped.applicants;
              draft.editValues = mapped.editValues;
            }),
          );
        } catch {
          patchEditValues();
        }
        return { data: result.data };
      },
    }),
  }),
});

export const {
  useGetRetailDrsQuery,
  useGetCuwUwDecisionHistoryQuery,
  useGetUsersByRoleQuery,
  useLazyGetCuwClaimAuditListQuery,
  useGetCuwUwDecisionMutation,
  useSaveCuwParallelDecisionMutation,
  useGetRetailUwDecisionHistoryQuery,
  useSaveRetailDrsRequirementsMutation,
  useSaveRetailDrsApplicantMutation,
} = retailDrsApi;
