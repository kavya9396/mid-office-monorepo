import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { GrievanceHistoryRow } from "@insurance-poc/common/grievance-history";
import {
  absoluteApiBaseUrl,
  createBusinessBaseQuery,
  formatDateTime,
  getDrsRoleType,
  getSessionBusinessType,
  getSessionUser,
  mmtGrievanceUrls,
  useMock,
} from "@insurance-poc/utils";
import mmtGrievanceFetchMock from "../modules/drs/mock/mmt-grievance-fetch.json";

export type MmtGrievanceFetchRequest = {
  applicationNo: string;
  lob: string;
  partyId?: string;
  lifeNumber: string;
  partyFilterComplete?: boolean;
};

export type MmtGrievanceMemberContext = {
  applicationNo: string;
  partyId?: string;
  lifeNumber?: string;
  transactionId?: string | null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
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
    lifeNumber: context.lifeNumber ?? "",
    partyFilterComplete: true,
  };

  if (context.partyId) request.partyId = context.partyId;
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

export type MmtGrievanceSaveResult = {
  message: string;
};

export type MmtGrievanceSaveArg = {
  context: MmtGrievanceMemberContext;
  rows: GrievanceHistoryRow[];
};

function customError(error: string): FetchBaseQueryError {
  return { status: "CUSTOM_ERROR", error };
}

/** Grievance fetch and save. Retail DRS stays in `drsApi`. */
export const retailMmtGrievanceApi = createApi({
  reducerPath: "retailMmtGrievanceApi",
  baseQuery: createBusinessBaseQuery(absoluteApiBaseUrl),
  endpoints: (build) => ({
    getRetailMmtGrievances: build.query<MmtGrievanceTables, MmtGrievanceMemberContext>({
      async queryFn(context, _api, _extra, baseQuery) {
        const request = buildMmtGrievanceFetchRequest(context);
        if (useMock) {
          try {
            return { data: mapMmtGrievanceFetchPayload(mmtGrievanceFetchMock) };
          } catch (reason: unknown) {
            return {
              error: customError(reason instanceof Error ? reason.message : "Unable to load grievances."),
            };
          }
        }

        const fetchUrl = mmtGrievanceUrls.fetch;
        if (fetchUrl.length === 0) {
          return { error: customError("MMT grievance fetch API is not configured.") };
        }

        const result = await baseQuery({
          url: fetchUrl,
          method: "POST",
          body: request,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        if (isGrievanceApiFailure(result.data)) {
          return { error: customError(readGrievanceApiMessage(result.data)) };
        }

        try {
          return { data: mapMmtGrievanceFetchPayload(result.data) };
        } catch (reason: unknown) {
          return {
            error: customError(reason instanceof Error ? reason.message : "Unable to load grievances."),
          };
        }
      },
    }),
    saveRetailMmtGrievances: build.mutation<MmtGrievanceSaveResult, MmtGrievanceSaveArg>({
      async queryFn(arg, _api, _extra, baseQuery) {
        const body: MmtGrievanceSaveRequest = buildMmtGrievanceSaveRequest(arg.context, arg.rows);

        if (useMock) {
          return { data: { message: "Grievances saved successfully." } };
        }

        const saveUrl = mmtGrievanceUrls.save;
        if (saveUrl.length === 0) {
          return { error: customError("MMT grievance save API is not configured.") };
        }

        const result = await baseQuery({
          url: saveUrl,
          method: "POST",
          body,
          headers: { accept: "*/*", "Content-Type": "application/json" },
        });
        if (result.error) return { error: result.error };

        if (isGrievanceApiFailure(result.data)) {
          return { error: customError(readGrievanceApiMessage(result.data)) };
        }

        return {
          data: {
            message: readGrievanceApiMessage(result.data) || "Grievances saved successfully.",
          },
        };
      },
    }),
  }),
});

export const { useGetRetailMmtGrievancesQuery, useSaveRetailMmtGrievancesMutation } = retailMmtGrievanceApi;
