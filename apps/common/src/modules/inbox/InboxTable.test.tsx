import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "../../test/renderUi";
import type { InboxData } from "./inboxApi";
import { InboxTable } from "./InboxTable";
import { landingCases } from "./landingCases";

const guwCase = landingCases()[1]!;

const guwInboxData: InboxData = {
  username: "UW001",
  poolData: { GUW: [guwCase] },
};

function renderTable(
  props: Partial<ComponentProps<typeof InboxTable>> = {},
) {
  const onOpen = props.onOpen ?? vi.fn();
  renderUi(
    <InboxTable
      title="ALL CASES Details"
      cases={landingCases()}
      onOpen={onOpen}
      {...props}
    />,
  );
  return { onOpen };
}

describe("InboxTable", () => {
  it("shows an empty state when there are no cases", () => {
    renderTable({ cases: [] });
    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("renders the title, rows, priority tabs and hides column settings on All Cases", () => {
    renderTable();

    expect(screen.getByText("ALL CASES Details")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RET-CVT-001" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RET-GUW-001" })).toBeInTheDocument();
    expect(screen.getByText("High Priority")).toBeInTheDocument();
    expect(screen.getByText("At Risk")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.queryByLabelText("Configure columns")).not.toBeInTheDocument();
  });

  it("opens a case from the application number", async () => {
    const user = userEvent.setup();
    const { onOpen } = renderTable();

    await user.click(screen.getByRole("button", { name: "RET-GUW-001" }));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ applicationNo: "RET-GUW-001" }));
  });

  it("filters rows with the High Priority, At Risk and Normal tabs", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByText("High Priority"));
    expect(screen.getByRole("button", { name: "RET-CVT-001" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-GUW-001" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-DVTF-001" })).not.toBeInTheDocument();

    await user.click(screen.getByText("At Risk"));
    expect(screen.getByRole("button", { name: "RET-GUW-001" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-CVT-001" })).not.toBeInTheDocument();

    await user.click(screen.getByText("Normal"));
    expect(screen.getByRole("button", { name: "RET-DVTF-001" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-GUW-001" })).not.toBeInTheDocument();

    await user.click(screen.getByText("Normal"));
    expect(screen.getByRole("button", { name: "RET-CVT-001" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RET-GUW-001" })).toBeInTheDocument();
  });

  it("searches visible columns and restores all rows when the query is cleared", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByLabelText("Search cases"));
    const search = screen.getByPlaceholderText("Search...");
    await user.type(search, "RET-GUW");

    expect(screen.getByRole("button", { name: "RET-GUW-001" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-CVT-001" })).not.toBeInTheDocument();

    await user.clear(search);
    expect(screen.getByRole("button", { name: "RET-CVT-001" })).toBeInTheDocument();
  });

  it("applies and clears a column filter", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByLabelText("Filter cases"));
    const filterDialog = await screen.findByRole("dialog");
    expect(within(filterDialog).getByText("FILTER")).toBeInTheDocument();
    await user.click(within(filterDialog).getByText("Channel"));
    await user.click(within(filterDialog).getByLabelText("Agency"));
    await user.click(within(filterDialog).getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(screen.getByRole("button", { name: "RET-CVT-001" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "RET-GUW-001" })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Filter cases"));
    const cleared = await screen.findByRole("dialog");
    await user.click(within(cleared).getByRole("button", { name: "Clear All" }));
    await user.click(within(cleared).getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(screen.getByRole("button", { name: "RET-GUW-001" })).toBeInTheDocument();
  });

  it("saves a column configuration for a selected pool", async () => {
    const user = userEvent.setup();
    const onSaveColumns = vi.fn(async (_poolKey: string, selectedFields: string[]) => selectedFields);
    const onLoadColumns = vi.fn(async () => ["applicationNo", "productCode"]);
    renderTable({
      title: "GUW Details",
      columnContextKey: "GUW",
      inboxData: guwInboxData,
      cases: [guwCase],
      onLoadColumns,
      onSaveColumns,
    });

    await user.click(screen.getByLabelText("Configure columns"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Configure Columns")).toBeInTheDocument();
    expect(within(dialog).getByText("Available Columns")).toBeInTheDocument();
    expect(within(dialog).getByText("Selected Columns")).toBeInTheDocument();

    const selected = within(dialog).getByText("Selected Columns").closest("div")?.parentElement;
    expect(selected).toBeTruthy();
    const selectedBoxes = within(selected as HTMLElement).getAllByRole("checkbox");
    await user.click(selectedBoxes[1]!);
    await user.click(within(dialog).getByLabelText("Move checked columns to available"));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSaveColumns).toHaveBeenCalledWith("GUW", expect.arrayContaining(["applicationNo"])));
  });

  it("loads saved columns for a pool", async () => {
    const onLoadColumns = vi.fn(async () => ["applicationNo", "productCode"]);
    renderTable({
      title: "GUW Details",
      columnContextKey: "GUW",
      inboxData: guwInboxData,
      cases: [guwCase],
      onLoadColumns,
    });

    expect(await screen.findByText("Product Code")).toBeInTheDocument();
    expect(onLoadColumns).toHaveBeenCalledWith("GUW");
  });

  it("falls back to role-list defaults when pool-columns returns an empty list in mock mode", async () => {
    const onLoadColumns = vi.fn(async () => []);
    renderTable({
      useMockOverride: true,
      columnContextKey: "GUW",
      inboxData: guwInboxData,
      cases: [guwCase],
      onLoadColumns,
    });

    expect(await screen.findByText("Channel")).toBeInTheDocument();
    expect(screen.getByText("Product Code")).toBeInTheDocument();
  });

  it("falls back to selected pool role-list defaults when pool-columns is empty in real API mode", async () => {
    const onLoadColumns = vi.fn(async () => []);
    renderTable({
      useMockOverride: false,
      columnContextKey: "GUW",
      inboxData: guwInboxData,
      cases: [guwCase],
      onLoadColumns,
    });

    expect(await screen.findByText("Channel")).toBeInTheDocument();
    expect(screen.getByText("Product Code")).toBeInTheDocument();
    expect(screen.queryByText("No columns returned for this pool")).not.toBeInTheDocument();
  });

  it("uses the selected pool's field order for defaults, not another pool", async () => {
    const formalCase = landingCases()[2]!;
    const formalData: InboxData = {
      username: "UW001",
      poolData: { DVT_FORMAL: [formalCase] },
    };
    const onLoadColumns = vi.fn(async () => []);
    renderTable({
      useMockOverride: false,
      title: "DVT FORMAL Details",
      columnContextKey: "DVT_FORMAL",
      inboxData: formalData,
      cases: [formalCase],
      onLoadColumns,
    });

    expect(await screen.findByText("Policy No")).toBeInTheDocument();
    expect(screen.getByText("Member Name")).toBeInTheDocument();
    expect(screen.queryByText("Master Plan No")).not.toBeInTheDocument();
  });

  it("uses API selectedFields when pool-columns is non-empty", async () => {
    const onLoadColumns = vi.fn(async () => ["applicationNo", "caseType"]);
    renderTable({
      useMockOverride: false,
      columnContextKey: "GUW",
      inboxData: guwInboxData,
      cases: [guwCase],
      onLoadColumns,
    });

    await waitFor(() => expect(onLoadColumns).toHaveBeenCalledWith("GUW"));
    expect(await screen.findByText("Case Type")).toBeInTheDocument();
    expect(screen.queryByText("Product Code")).not.toBeInTheDocument();
  });

  it("downloads the visible rows as Excel", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:landing");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click);

    renderTable();
    await user.click(screen.getByRole("button", { name: "Download Excel" }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
