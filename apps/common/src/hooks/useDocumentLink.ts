import { useEffect, useState } from "react";
import { fetchDocumentLink, type DocumentLinkType } from "../services/documentLink";

/**
 * UDS viewer link for the application's documents of `type`, fetched when the screen loads and again when
 * the application changes. `null` while loading, when the API sends no link, and when the call fails.
 */
export function useDocumentLink(
  applicationNumber: string | undefined,
  type: DocumentLinkType,
): string | null {
  const [link, setLink] = useState<string | null>(null);
  useEffect(() => {
    setLink(null);
    if (!applicationNumber) return undefined;
    let cancelled = false;
    void fetchDocumentLink(applicationNumber, type).then((result) => {
      if (!cancelled && "link" in result) setLink(result.link);
    });
    return () => {
      cancelled = true;
    };
  }, [applicationNumber, type]);
  return link;
}
