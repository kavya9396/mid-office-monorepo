import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "../../test/renderUi";
import { InboxScreen } from "./InboxScreen";
import type { InboxData } from "./inboxApi";
import { landingCases } from "./landingCases";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

const drsTask = vi.hoisted(() => ({
  setDrsTaskIds: vi.fn(),
  clearDrsTaskIds: vi.fn(),
}));

vi.mock("@insurance-poc/utils", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/utils")>("@insurance-poc/utils");
  return {
    ...actual,
    getLastLoginAt: () => "2026-10-06T14:10:20",
    setDrsTaskIds: drsTask.setDrsTaskIds,
    clearDrsTaskIds: drsTask.clearDrsTaskIds,
  };
});

function landingData(): InboxData {
  const [cvt, guw, formal] = landingCases();
  return {
    username: "UW001",
    poolData: {
      CVT_POOL: cvt ? [cvt] : [],
      GUW: guw ? [guw] : [],
      DVT_FORMAL: formal ? [formal] : [],
    },
  };
}

describe("InboxScreen", () => {
  it("shows the loading state", () => {
    renderUi(
      <InboxScreen businessType="RETAIL" data={null} loading error="" onRetry={vi.fn()} />,
    );
    expect(screen.getByText("Loading inbox...")).toBeInTheDocument();
  });

  it("shows an error and retries", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderUi(
      <InboxScreen
        businessType="RETAIL"
        data={null}
        loading={false}
        error="Unable to load the Retail inbox."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Unable to load the Retail inbox.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("switches sidebar tabs and updates the table title and rows", async () => {
    const user = userEvent.setup();
    const onLoadColumns = vi.fn(async () => []);
    const onSaveColumns = vi.fn(async (_poolKey: string, selected: string[]) => selected);
    renderUi(
      <InboxScreen
        businessType="RETAIL"
        data={landingData()}
        loading={false}
        error=""
        onRetry={vi.fn()}
        onLoadColumns={onLoadColumns}
        onSaveColumns={onSaveColumns}
      />,
    );

    expect(screen.getByText("ALL CASES Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RET-CVT-001" })).toBeInTheDocument();
    expect(screen.queryByText("CUW")).not.toBeInTheDocument();

    await user.click(screen.getByText("GUW"));
    expect(await screen.findByText("GUW Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RET-GUW-001" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-CVT-001" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Configure columns")).toBeInTheDocument();
  });

  it("opens a case through the table", async () => {
    const user = userEvent.setup();
    navigate.mockReset();
    renderUi(
      <InboxScreen
        businessType="RETAIL"
        data={landingData()}
        loading={false}
        error=""
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "RET-CVT-001" }));
    expect(drsTask.setDrsTaskIds).toHaveBeenCalledWith("RT-1001", "RI-1001");
    expect(navigate).toHaveBeenCalledWith("/app/RET-CVT-001/drs?applicationNo=RET-CVT-001&role=CVT+Pool&roleType=CVT_POOL");
  });

  it("claims task and redirects to DRS when errorCode is 200", async () => {
    const user = userEvent.setup();
    navigate.mockReset();
    const onClaimTask = vi.fn(async () => ({
      id: "2078.569",
      state: "claim",
      message: "Task claim success",
      success: true,
      errorCode: "200",
    }));

    const data: InboxData = {
      username: "UW001",
      poolData: {
        CVT_POOL: [
          {
            rowId: "CVT-1",
            poolName: "CVT_POOL",
            applicationNo: "RET-CVT-001",
            fields: {
              applicationNo: "RET-CVT-001",
              taskId: "510",
            },
          },
        ],
      },
    };

    renderUi(
      <InboxScreen
        businessType="RETAIL"
        data={data}
        loading={false}
        error=""
        onRetry={vi.fn()}
        onClaimTask={onClaimTask}
      />,
    );

    await user.click(screen.getByRole("button", { name: "RET-CVT-001" }));
    expect(onClaimTask).toHaveBeenCalledWith("510");
    expect(navigate).toHaveBeenCalledWith("/app/RET-CVT-001/drs?applicationNo=RET-CVT-001&role=CVT+Pool&roleType=CVT_POOL");
  });

  it("shows error snackbar and stays on inbox page when errorCode is 400", async () => {
    const user = userEvent.setup();
    navigate.mockReset();
    const onClaimTask = vi.fn(async () => ({
      id: "569",
      state: "claim",
      message: "Task already claimed by other user",
      success: false,
      errorCode: "400",
    }));

    const data: InboxData = {
      username: "UW001",
      poolData: {
        CVT_POOL: [
          {
            rowId: "CVT-1",
            poolName: "CVT_POOL",
            applicationNo: "RET-CVT-001",
            fields: {
              applicationNo: "RET-CVT-001",
              taskId: "510",
            },
          },
        ],
      },
    };

    renderUi(
      <InboxScreen
        businessType="RETAIL"
        data={data}
        loading={false}
        error=""
        onRetry={vi.fn()}
        onClaimTask={onClaimTask}
      />,
    );

    await user.click(screen.getByRole("button", { name: "RET-CVT-001" }));
    expect(onClaimTask).toHaveBeenCalledWith("510");
    expect(navigate).not.toHaveBeenCalled();
    expect(await screen.findByText("Task already claimed by other user")).toBeInTheDocument();
  });
});
