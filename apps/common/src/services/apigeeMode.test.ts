import { afterEach, describe, expect, it, vi } from "vitest";
import { authUrls } from "@insurance-poc/utils";

describe("apigee mode login url", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the mid-office login url when apigee mode is off", () => {
    vi.stubEnv("VITE_USE_APIGEE", "false");
    vi.stubEnv("VITE_AUTH_LOGIN_API", "https://midoffice.test/login");
    vi.stubEnv("VITE_APIGEE_AUTH_LOGIN_API", "https://apigee.test/login");

    expect(authUrls.login).toBe("https://midoffice.test/login");
  });

  it("uses the apigee login url when apigee mode is on", () => {
    vi.stubEnv("VITE_USE_APIGEE", "true");
    vi.stubEnv("VITE_AUTH_LOGIN_API", "https://midoffice.test/login");
    vi.stubEnv("VITE_APIGEE_AUTH_LOGIN_API", "https://apigee.test/login");

    expect(authUrls.login).toBe("https://apigee.test/login");
  });
});
