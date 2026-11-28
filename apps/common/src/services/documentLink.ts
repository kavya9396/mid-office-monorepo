import {
  absoluteApiBaseUrl,
  applyBusinessApiAuthHeaders,
  isApiFailureBody,
  readApiErrorMessage,
  reinsurerDocUrls,
  useMock,
} from "@insurance-poc/utils";
import reinsurerDocMock from "../../../../mock/reinsurer/reinsurer-doc-fetch.json";

const MOCK_DOCUMENT_LINK_DELAY_MS = 100;

/** Values of `type` (request) / `doc_type` (response) the document fetch API accepts. */
export type DocumentLinkType = "medical" | "finance";

/** Request body of the reinsurer doc fetch API. Only `type` differs between documents. */
export interface DocumentLinkRequest {
  applicationNumber: string;
  type: DocumentLinkType;
  uds_type: "link";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseJsonSafely(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function buildDocumentLinkRequest(
  applicationNumber: string,
  type: DocumentLinkType,
): DocumentLinkRequest {
  return { applicationNumber: applicationNumber.trim(), type, uds_type: "link" };
}

/** Link of the `data[]` entry whose `doc_type` is `type`; `null` when the response has none. */
export function readDocumentLink(payload: unknown, type: DocumentLinkType): string | null {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return null;
  const entry = payload.data.find(
    (item): item is Record<string, unknown> => isRecord(item) && item.doc_type === type,
  );
  const link = typeof entry?.link === "string" ? entry.link.trim() : "";
  return link.length > 0 ? link : null;
}

function resolveUrl(): string {
  const endpoint = reinsurerDocUrls.fetch;
  if (!endpoint) return "";
  return endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${absoluteApiBaseUrl}${endpoint}`;
}

/**
 * Fetches the UDS viewer link of an application's documents of the given `type`.
 * Resolves with `{ link: null }` when the API sends none, and `{ error }` when the call fails.
 */
export async function fetchDocumentLink(
  applicationNumber: string,
  type: DocumentLinkType,
): Promise<{ link: string | null } | { error: string }> {
  const request = buildDocumentLinkRequest(applicationNumber, type);
  if (request.applicationNumber.length === 0) {
    return { error: "Application number is required to load the documents." };
  }

  if (useMock) {
    await waitMs(MOCK_DOCUMENT_LINK_DELAY_MS);
    return { link: readDocumentLink(reinsurerDocMock, type) };
  }

  const url = resolveUrl();
  if (!url) return { error: "Documents API is not configured." };

  try {
    const headers = new Headers();
    headers.set("Accept", "*/*");
    headers.set("Content-Type", "application/json");
    applyBusinessApiAuthHeaders(headers);

    const response = await fetch(url, { method: "POST", body: JSON.stringify(request), headers });
    const payload = parseJsonSafely(await response.text());

    if (!response.ok || isApiFailureBody(payload)) {
      return { error: readApiErrorMessage(payload, `Documents request failed (${response.status}).`) };
    }
    return { link: readDocumentLink(payload, type) };
  } catch (reason: unknown) {
    return { error: reason instanceof Error ? reason.message : "Unable to load the documents." };
  }
}
