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

vi.mock("@insurance-poc/utils", async () => {
  const actual = await vi.importActual<typeof import("@insurance-poc/utils")>("@insurance-poc/utils");
  return {
    ...actual,
    getLastLoginAt: () => "2026-10-06T14:10:20",
  };
});

function landingData(): InboxData {
  const [cvt, guw, formal] = landingCases();
  return {
    userId: "UW001",
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
    renderUi(
      <InboxScreen
        businessType="RETAIL"
        data={landingData()}
        loading={false}
        error=""
        onRetry={vi.fn()}
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
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining("/drs?applicationNo=RET-CVT-001"));
  });
});
