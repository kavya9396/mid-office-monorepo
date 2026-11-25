import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { DecisionHistoryRow } from "@insurance-poc/common/decision-history";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  getDrsRoleType,
  getSessionBusinessType,
  getSessionUser,
  retailBusinessUrls,
  useMock,
} from "@insurance-poc/utils";
import { getRetailDrsTaskConfig } from "../config/drsTaskConfig";
import retailDrsMock from "../modules/drs/mock/retailDrs.json";
import retailUwDecisionHistoryMock from "../../../../mock/drs/retail-uw-decision-history.json";
import type { CvtEditApplicantValues } from "../modules/drs/CvtEditApplicantDialog";
import {
  mapDecisionHistory,
  mapRawRequirementRows,
  mapRetailDrsPayload,
  type RetailDrsData,
} from "./drsService";

/** `lob` sent to the UW decision fetch API for Retail. */
const RETAIL_LOB = "R";

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
  initialRequirements?: RequirementItem[];
  roleType?: string;
  screenType?: string;
  businessType?: string;
  lob?: string;
  userId?: string;
  queryArg: RetailDrsQueryArg;
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

export const toRequirementRequestItem = (item: RequirementItem) => {
  const isNumericId =
    typeof item.id === "number" ||
    (typeof item.id === "string" && !item.id.startsWith("req-") && Number.isFinite(Number(item.id)) && Number(item.id) > 0);

  const reqId =
    typeof item.requirementId === "number"
      ? item.requirementId
      : isNumericId
        ? Number(item.id)
        : undefined;

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

  if (reqId !== undefined) payload.requirementId = reqId;
  if (item.partyId !== undefined) payload.partyId = item.partyId;
  if (item.memberType !== undefined) payload.memberType = item.memberType;

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

export function buildRequirementsSavePayload(arg: SaveRetailDrsRequirementsArg) {
  const sessionUser = getSessionUser();
  const userId = arg.userId ?? sessionUser?.username ?? "cvt.user";
  const taskType = arg.roleType ?? getDrsRoleType();
  const taskConfig = getRetailDrsTaskConfig(taskType);
  const roleType = arg.roleType ?? taskConfig.roleType ?? "CVT_TASK";
  const screenType = arg.screenType ?? taskConfig.screenType ?? "CVT";
  const businessType = arg.businessType ?? getSessionBusinessType() ?? taskConfig.businessType ?? "RETAIL";

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
    saveRetailDrsRequirements: build.mutation<RequirementItem[], SaveRetailDrsRequirementsArg>({
      async queryFn(arg, api, _extra, baseQuery) {
        const body = buildRequirementsSavePayload(arg);

        console.log("[saveRetailDrsRequirements] PUT payload to send:", body);

        const applyToCache = (updated: RequirementItem[]): RequirementItem[] => {
          api.dispatch(
            retailDrsApi.util.updateQueryData("getRetailDrs", arg.queryArg, (draft) => {
              draft.requirements = updated;
            }),
          );
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
  useGetRetailUwDecisionHistoryQuery,
  useSaveRetailDrsRequirementsMutation,
  useSaveRetailDrsApplicantMutation,
} = retailDrsApi;
