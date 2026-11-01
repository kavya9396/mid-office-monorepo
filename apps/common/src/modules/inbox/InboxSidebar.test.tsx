import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "../../test/renderUi";
import type { RolePoolKey } from "./inboxApi";
import { InboxSidebar } from "./InboxSidebar";

const pools: RolePoolKey[] = ["CVT_POOL", "GUW", "DVT_FORMAL"];
const counts = {
  CVT_POOL: 2,
  GUW: 1,
  DVT_FORMAL: 1,
} as Record<RolePoolKey, number>;

function renderSidebar(
  props: Partial<ComponentProps<typeof InboxSidebar>> = {},
) {
  const onSelectTask = props.onSelectTask ?? vi.fn();
  const onToggleCollapsed = props.onToggleCollapsed ?? vi.fn();
  const onToggleCases = props.onToggleCases ?? vi.fn();
  renderUi(
    <InboxSidebar
      pools={pools}
      counts={counts}
      totalCount={4}
      selectedTask="ALL_CASES"
      collapsed={false}
      casesOpen
      lastLoginAt="2026-10-06T14:10:20"
      onToggleCollapsed={onToggleCollapsed}
      onToggleCases={onToggleCases}
      onSelectTask={onSelectTask}
      {...props}
    />,
  );
  return { onSelectTask, onToggleCollapsed, onToggleCases };
}

function StatefulSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [casesOpen, setCasesOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState("ALL_CASES");
  return (
    <InboxSidebar
      pools={pools}
      counts={counts}
      totalCount={4}
      selectedTask={selectedTask}
      collapsed={collapsed}
      casesOpen={casesOpen}
      lastLoginAt="2026-10-06T14:10:20"
      onToggleCollapsed={() => setCollapsed((current) => !current)}
      onToggleCases={() => setCasesOpen((current) => !current)}
      onSelectTask={setSelectedTask}
    />
  );
}

describe("InboxSidebar", () => {
  it("renders All Cases, pool tabs, counts, search label and last login", () => {
    renderSidebar();

    expect(screen.getByText("All Cases")).toBeInTheDocument();
    expect(screen.getByText("CVT Pool")).toBeInTheDocument();
    expect(screen.getByText("GUW")).toBeInTheDocument();
    expect(screen.getByText("DVT Formal")).toBeInTheDocument();
    expect(screen.getByText("Search Applications")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(/Last login:/)).toBeInTheDocument();
  });

  it("selects a pool tab and All Cases", async () => {
    const user = userEvent.setup();
    const { onSelectTask } = renderSidebar();

    await user.click(screen.getByText("GUW"));
    expect(onSelectTask).toHaveBeenCalledWith("GUW");

    await user.click(screen.getByText("All Cases"));
    expect(onSelectTask).toHaveBeenCalledWith("ALL_CASES");
  });

  it("selects a pool with the keyboard", () => {
    const { onSelectTask } = renderSidebar();
    fireEvent.keyDown(screen.getByText("DVT Formal"), { key: "Enter" });
    expect(onSelectTask).toHaveBeenCalledWith("DVT_FORMAL");
  });

  it("collapses the task list and shows initials instead of full labels", async () => {
    const user = userEvent.setup();
    renderUi(<StatefulSidebar />);

    await user.click(screen.getByLabelText("Collapse task list"));
    expect(screen.queryByText("Search Applications")).not.toBeInTheDocument();
    expect(screen.queryByText("CVT Pool")).not.toBeInTheDocument();
    expect(screen.queryByText(/Last login:/)).not.toBeInTheDocument();
    expect(screen.getByText("CP")).toBeInTheDocument();
    expect(screen.getByLabelText("Expand task list")).toBeInTheDocument();
  });

  it("hides pool tabs when the All Cases accordion is closed", async () => {
    const user = userEvent.setup();
    renderUi(<StatefulSidebar />);

    expect(screen.getByText("GUW")).toBeInTheDocument();
    await user.click(screen.getByText("4"));
    expect(screen.queryByText("GUW")).not.toBeInTheDocument();
    expect(screen.getByText("All Cases")).toBeInTheDocument();
  });
});
