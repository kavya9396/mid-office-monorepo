const DRS_TASK_CONTEXT_KEY = "drsTaskContext";

export type DrsTaskContext = {
  taskId?: string;
  instanceId?: string;
  /** Pool / task key for DRS screen dispatch (session only; not in the URL). */
  roleType?: string;
  applicationNo?: string;
  memberId?: string;
  memberCount?: number;
  /** Inbox/header display label (`role` field); not the pool `roleType`. */
  roleLabel?: string;
};

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readMemberCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readContext(): Required<DrsTaskContext> {
  const empty: Required<DrsTaskContext> = {
    taskId: "",
    instanceId: "",
    roleType: "",
    applicationNo: "",
    memberId: "",
    memberCount: 0,
    roleLabel: "",
  };
  const raw = readStorage()?.getItem(DRS_TASK_CONTEXT_KEY);
  if (!raw) return empty;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return empty;
    const record = parsed as Record<string, unknown>;
    return {
      taskId: readText(record.taskId),
      instanceId: readText(record.instanceId),
      roleType: readText(record.roleType),
      applicationNo: readText(record.applicationNo),
      memberId: readText(record.memberId),
      memberCount: readMemberCount(record.memberCount),
      roleLabel: readText(record.roleLabel),
    };
  } catch {
    return empty;
  }
}

function writeContext(context: DrsTaskContext): void {
  const storage = readStorage();
  if (!storage) return;
  const next: Required<DrsTaskContext> = {
    taskId: readText(context.taskId),
    instanceId: readText(context.instanceId),
    roleType: readText(context.roleType),
    applicationNo: readText(context.applicationNo),
    memberId: readText(context.memberId),
    memberCount: readMemberCount(context.memberCount),
    roleLabel: readText(context.roleLabel),
  };
  const hasData =
    next.taskId.length > 0 ||
    next.instanceId.length > 0 ||
    next.roleType.length > 0 ||
    next.applicationNo.length > 0 ||
    next.memberId.length > 0 ||
    next.memberCount > 0 ||
    next.roleLabel.length > 0;
  if (!hasData) {
    storage.setItem(
      DRS_TASK_CONTEXT_KEY,
      JSON.stringify({ taskId: "", instanceId: "", roleType: "" }),
    );
    return;
  }
  storage.setItem(DRS_TASK_CONTEXT_KEY, JSON.stringify(next));
}

/** Persists BPM task identifiers when opening a case from the inbox. */
export function setDrsTaskIds(taskId: string, instanceId: string): void {
  const current = readContext();
  writeContext({
    ...current,
    taskId: readText(taskId),
    instanceId: readText(instanceId),
  });
}

export function getDrsRoleType(): string {
  return readContext().roleType;
}

export function getDrsApplicationNo(): string {
  return readContext().applicationNo;
}

export function getDrsMemberId(): string {
  return readContext().memberId;
}

export function getDrsMemberCount(): number {
  return readContext().memberCount;
}

export function getDrsRoleLabel(): string {
  return readContext().roleLabel;
}

/** Inbox → DRS: task ids + pool key in session (`/app/{applicationNo}/drs` has no query). */
export function setDrsOpenContext(context: Partial<DrsTaskContext>): void {
  writeContext({ ...readContext(), ...context });
}

/** Reads legacy `?applicationNo=&roleType=&memberId=&memberCount=&role=` into session. */
export function absorbDrsQueryFromSearch(params: URLSearchParams): boolean {
  const applicationNo = readText(params.get("applicationNo"));
  const roleType = readText(params.get("roleType"));
  const memberId = readText(params.get("memberId"));
  const memberCount = readMemberCount(params.get("memberCount"));
  const roleLabel = readText(params.get("role"));
  const hasQuery =
    applicationNo.length > 0 ||
    roleType.length > 0 ||
    memberId.length > 0 ||
    roleLabel.length > 0 ||
    memberCount > 0;
  if (!hasQuery) return false;
  setDrsOpenContext({
    ...(applicationNo.length > 0 ? { applicationNo } : {}),
    ...(roleType.length > 0 ? { roleType } : {}),
    ...(memberId.length > 0 ? { memberId } : {}),
    ...(memberCount > 0 ? { memberCount } : {}),
    ...(roleLabel.length > 0 ? { roleLabel } : {}),
  });
  return true;
}

export function getDrsTaskIds(): { taskId: string; instanceId: string } {
  const { taskId, instanceId } = readContext();
  return { taskId, instanceId };
}

export function hasDrsTaskIds(): boolean {
  const { taskId, instanceId } = getDrsTaskIds();
  return taskId.length > 0 && instanceId.length > 0;
}

export function clearDrsTaskIds(): void {
  writeContext({
    taskId: "",
    instanceId: "",
    roleType: "",
    applicationNo: "",
    memberId: "",
    memberCount: 0,
    roleLabel: "",
  });
}

export function removeDrsTaskContext(): void {
  readStorage()?.removeItem(DRS_TASK_CONTEXT_KEY);
}