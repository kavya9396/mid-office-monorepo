const DRS_TASK_CONTEXT_KEY = "drsTaskContext";

export type DrsTaskContext = {
  taskId?: string;
  instanceId?: string;
  /** Pool / task key for DRS screen dispatch (session only; not in the URL). */
  roleType?: string;
};

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readContext(): DrsTaskContext {
  const raw = readStorage()?.getItem(DRS_TASK_CONTEXT_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const record = parsed as Record<string, unknown>;
    return {
      taskId: readText(record.taskId),
      instanceId: readText(record.instanceId),
      roleType: readText(record.roleType),
    };
  } catch {
    return {};
  }
}

function writeContext(context: DrsTaskContext): void {
  const storage = readStorage();
  if (!storage) return;
  const taskId = readText(context.taskId);
  const instanceId = readText(context.instanceId);
  const roleType = readText(context.roleType);
  if (taskId.length === 0 && instanceId.length === 0 && roleType.length === 0) {
    storage.setItem(
      DRS_TASK_CONTEXT_KEY,
      JSON.stringify({ taskId: "", instanceId: "", roleType: "" }),
    );
    return;
  }
  storage.setItem(
    DRS_TASK_CONTEXT_KEY,
    JSON.stringify({
      taskId,
      instanceId,
      roleType,
    }),
  );
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
  return readContext().roleType ?? "";
}

/** Inbox → DRS: task ids + pool key in session (`/app/{applicationNo}/drs` has no query). */
export function setDrsOpenContext(context: DrsTaskContext): void {
  writeContext({
    taskId: readText(context.taskId),
    instanceId: readText(context.instanceId),
    roleType: readText(context.roleType),
  });
}

export function getDrsTaskIds(): { taskId: string; instanceId: string } {
  const { taskId = "", instanceId = "" } = readContext();
  return { taskId, instanceId };
}

export function hasDrsTaskIds(): boolean {
  const { taskId, instanceId } = getDrsTaskIds();
  return taskId.length > 0 && instanceId.length > 0;
}

export function clearDrsTaskIds(): void {
  writeContext({ taskId: "", instanceId: "", roleType: "" });
}

export function removeDrsTaskContext(): void {
  readStorage()?.removeItem(DRS_TASK_CONTEXT_KEY);
}
