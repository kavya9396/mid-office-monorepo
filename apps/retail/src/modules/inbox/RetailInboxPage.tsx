import { useCallback } from "react";
import { InboxScreen } from "@insurance-poc/common/inbox-screen";
import {
  useGetRetailInboxQuery,
  useLazyFetchRetailPoolColumnsQuery,
  useSaveRetailPoolColumnsMutation,
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
  return "Unable to load the Retail inbox.";
}

export function RetailInboxPage() {
  const inbox = useGetRetailInboxQuery();
  const [loadColumns] = useLazyFetchRetailPoolColumnsQuery();
  const [saveColumns] = useSaveRetailPoolColumnsMutation();
  const onLoadColumns = useCallback(
    (poolKey: string) => loadColumns(poolKey).unwrap(),
    [loadColumns],
  );
  const onSaveColumns = useCallback(
    (poolKey: string, selectedFields: string[]) => saveColumns({ poolKey, selectedFields }).unwrap(),
    [saveColumns],
  );

  return (
    <InboxScreen
      businessType="RETAIL"
      data={inbox.data ?? null}
      loading={inbox.isLoading || inbox.isFetching}
      error={inbox.isError ? readQueryError(inbox.error) : ""}
      onRetry={() => {
        void inbox.refetch();
      }}
      onLoadColumns={onLoadColumns}
      onSaveColumns={onSaveColumns}
    />
  );
}
