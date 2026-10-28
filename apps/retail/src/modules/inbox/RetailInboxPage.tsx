import { InboxScreen } from "@insurance-poc/common/inbox-screen";
import { useGetRetailInboxQuery } from "../../services/inboxApi";

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

  return (
    <InboxScreen
      businessType="RETAIL"
      data={inbox.data ?? null}
      loading={inbox.isLoading || inbox.isFetching}
      error={inbox.isError ? readQueryError(inbox.error) : ""}
      onRetry={() => {
        void inbox.refetch();
      }}
    />
  );
}
