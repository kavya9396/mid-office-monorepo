import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDrsTaskIds,
  setDrsTaskIds,
  setSessionUser,
} from "@insurance-poc/utils";
import {
  buildCompleteTaskRequestBody,
  resolveCompleteTaskContext,
  type CompleteTaskBaseQuery,
} from "./completeTask";

describe("complete task request", () => {
  beforeEach(() => {
    sessionStorage.clear();
    setSessionUser({ username: "UW002", displayName: "UW Two" });
    setDrsTaskIds("TASK-9", "INST-9");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("builds requestContext body", () => {
    expect(
      buildCompleteTaskRequestBody({
        appNo: "GRP-DVT-001",
        userId: "UW002",
        taskId: "TASK-9",
        instanceId: "INST-9",
        decision: "Accept",
        remarks: "Ok",
      }),
    ).toEqual({
      requestContext: {
        appNo: "GRP-DVT-001",
        userId: "UW002",
        taskId: "TASK-9",
        instanceId: "INST-9",
        decision: "Accept",
        remarks: "Ok",
      },
    });
  });

  it("requires taskId and instanceId in session", () => {
    clearDrsTaskIds();
    const resolved = resolveCompleteTaskContext({
      appNo: "GRP-DVT-001",
      decision: "Accept",
      remarks: "",
    });
    expect("error" in resolved).toBe(true);
  });

  it("posts complete-task body in real mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.resetModules();
    const { mutateCompleteTask: mutate } = await import("./completeTask");

    const posted: { body?: unknown } = {};
    const baseQuery: CompleteTaskBaseQuery = vi.fn(async (args) => {
      if (typeof args === "object" && args !== null && "body" in args) {
        posted.body = (args as { body: unknown }).body;
      }
      return { data: { response_code: 200, error: false, message: "Done" } };
    });

    const result = await mutate(baseQuery, "https://example.test/complete-task/group", {
      appNo: "GRP-DVT-001",
      decision: "Accept",
      remarks: "Approved",
    });

    expect("data" in result).toBe(true);
    expect(posted.body).toEqual({
      requestContext: {
        appNo: "GRP-DVT-001",
        userId: "UW002",
        taskId: "TASK-9",
        instanceId: "INST-9",
        decision: "Accept",
        remarks: "Approved",
      },
    });
  });

  it("surfaces API error message from failure body", async () => {
    vi.stubEnv("VITE_USE_MOCK", "false");
    vi.resetModules();
    const { mutateCompleteTask: mutate } = await import("./completeTask");

    const baseQuery: CompleteTaskBaseQuery = vi.fn(async () => ({
      data: {
        message: "unable to store final decision",
        error: "BPM_INTEGRATION_ERROR",
      },
    }));

    const result = await mutate(baseQuery, "https://example.test/complete-task/group", {
      appNo: "GRP-DVT-001",
      decision: "Accept",
      remarks: "",
    });

    expect("error" in result).toBe(true);
    if ("error" in result && "error" in result.error) {
      expect(result.error.error).toBe("unable to store final decision");
    }
  });

  it("returns mock success in mock mode", async () => {
    vi.stubEnv("VITE_USE_MOCK", "true");
    vi.resetModules();
    const { mutateCompleteTask: mutate } = await import("./completeTask");
    const result = await mutate(vi.fn() as CompleteTaskBaseQuery, "", {
      appNo: "GRP-DVT-001",
      decision: "Accept",
      remarks: "",
    });
    expect("data" in result && result.data.message).toContain("success");
  });
});
