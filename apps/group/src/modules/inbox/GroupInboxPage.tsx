import { useCallback, useEffect } from "react";
import { clearBreRetriggerCount, clearInboxNavigationLoading } from "@insurance-poc/utils";
import { InboxScreen } from "@insurance-poc/common/inbox-screen";
import {
  useClaimGroupTaskMutation,
  useGetGroupInboxQuery,
  useLazyFetchGroupPoolColumnsQuery,
  useSaveGroupPoolColumnsMutation,
} from "../../services/inboxApi";

function readQueryError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    if ("error" in error && typeof error.error === "string" && error.error.length > 0) {
      return error.error;
    }
    if ("message" in error && typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  return "Unable to load the Group inbox.";
}

export function GroupInboxPage() {
  useEffect(() => {
    clearBreRetriggerCount();
    clearInboxNavigationLoading();
  }, []);

  const inbox = useGetGroupInboxQuery();
  const [loadColumns] = useLazyFetchGroupPoolColumnsQuery();
  const [saveColumns] = useSaveGroupPoolColumnsMutation();
  const [claimTask] = useClaimGroupTaskMutation();
  const onLoadColumns = useCallback(
    (poolKey: string) => loadColumns(poolKey).unwrap(),
    [loadColumns],
  );
  const onSaveColumns = useCallback(
    (poolKey: string, selectedFields: string[]) => saveColumns({ poolKey, selectedFields }).unwrap(),
    [saveColumns],
  );
  const onClaimTask = useCallback(
    (taskId: string) => claimTask({ taskId }).unwrap(),
    [claimTask],
  );

  return (
    <InboxScreen
      businessType="GROUP"
      data={inbox.data ?? null}
      loading={inbox.isLoading}
      error={inbox.isError ? readQueryError(inbox.error) : ""}
      onRetry={() => {
        void inbox.refetch();
      }}
      onLoadColumns={onLoadColumns}
      onSaveColumns={onSaveColumns}
      onClaimTask={onClaimTask}
    />
  );
}
