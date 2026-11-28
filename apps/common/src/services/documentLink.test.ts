import { afterEach, describe, expect, it, vi } from "vitest";
import reinsurerDocMock from "../../../../mock/reinsurer/reinsurer-doc-fetch.json";
import { buildDocumentLinkRequest, fetchDocumentLink, readDocumentLink } from "./documentLink";

describe("document link", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("builds the request body; only type differs between documents", () => {
    expect(buildDocumentLinkRequest(" OB25175115 ", "medical")).toEqual({
      applicationNumber: "OB25175115",
      type: "medical",
      uds_type: "link",
    });
    expect(buildDocumentLinkRequest("OB25175115", "finance")).toEqual({
      applicationNumber: "OB25175115",
      type: "finance",
      uds_type: "link",
    });
  });

  it("reads the link of the requested doc_type, or null when absent", () => {
    expect(readDocumentLink(reinsurerDocMock, "medical")).toContain("MOCK_MEDICAL_TOKEN");
    expect(readDocumentLink(reinsurerDocMock, "finance")).toContain("MOCK_FINANCE_TOKEN");
    expect(readDocumentLink({ success: true, data: [] }, "medical")).toBeNull();
    expect(readDocumentLink({ data: [{ doc_type: "medical", link: "" }] }, "medical")).toBeNull();
    expect(readDocumentLink({ data: [{ doc_type: "finance", link: "x" }] }, "medical")).toBeNull();
    expect(readDocumentLink(null, "medical")).toBeNull();
  });

  it("returns the mock link of the requested type in mock mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "true");
    vi.resetModules();
    const { fetchDocumentLink: fetchLink } = await import("./documentLink");
    expect(await fetchLink("OB25175115", "finance")).toEqual({
      link: readDocumentLink(reinsurerDocMock, "finance"),
    });
  });

  it("posts the request and returns the link in real mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.stubEnv("VITE_REINSURER_DOC_FETCH_API", "https://example.test/reinsurer/doc/fetch");
    vi.resetModules();
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(reinsurerDocMock), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchDocumentLink: fetchLink } = await import("./documentLink");

    const result = await fetchLink("OB25175115", "finance");

    expect(result).toEqual({ link: readDocumentLink(reinsurerDocMock, "finance") });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://example.test/reinsurer/doc/fetch");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      applicationNumber: "OB25175115",
      type: "finance",
      uds_type: "link",
    });
  });

  it("returns an error for an empty application number", async () => {
    expect(await fetchDocumentLink("  ", "medical")).toEqual({
      error: "Application number is required to load the documents.",
    });
  });
});
