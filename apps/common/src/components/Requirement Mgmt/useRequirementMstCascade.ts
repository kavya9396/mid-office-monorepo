import { useCallback, useMemo, useState } from "react";
import type { RequirementColumnKey, RequirementItem, RequirementStatusOption } from "./types";
import { buildRequirementMstRequest, fetchRequirementMstLevel } from "./requirementMstApi";
import {
  getRequirementMstRowSession,
  setRequirementMstRowSession,
  type RequirementMstRowSession,
} from "./requirementMstSession";
import type { RequirementMstCascadeKey, RequirementMstRequest } from "./requirementMstTypes";
import { isNewRequirement } from "./useRequirementRows";

const CASCADE_KEYS: RequirementMstCascadeKey[] = [
  "category",
  "subCategory",
  "document",
  "reason",
  "fupCode",
];

const CLEAR_AFTER: Record<string, RequirementColumnKey[]> = {
  team: ["category", "subCategory", "document", "reason", "fupCode", "description", "ocrStatus"],
  category: ["subCategory", "document", "reason", "fupCode", "description", "ocrStatus"],
  subCategory: ["document", "reason", "fupCode", "description", "ocrStatus"],
  document: ["reason", "fupCode", "description", "ocrStatus"],
  reason: ["fupCode", "description", "ocrStatus"],
  fupCode: ["description"],
};

function rowId(row: RequirementItem): string {
  return String(row.id);
}

function toOptions(values: string[]): RequirementStatusOption[] {
  return values.map((value) => ({ label: value, value }));
}

function disableFrom(field: RequirementMstCascadeKey): RequirementMstCascadeKey[] {
  const index = CASCADE_KEYS.indexOf(field);
  return CASCADE_KEYS.filter((_, i) => i > index);
}

function resetCascadeSession(current: RequirementMstRowSession, fromKey: RequirementColumnKey): RequirementMstRowSession {
  const next: RequirementMstRowSession = {
    options: { ...current.options },
    enabled: { ...current.enabled },
  };

  if (fromKey === "team") {
    for (const key of CASCADE_KEYS) {
      delete next.options[key];
      delete next.enabled[key];
    }
    return next;
  }

  const fromCascade = fromKey as RequirementMstCascadeKey;
  if (!CASCADE_KEYS.includes(fromCascade)) return next;

  for (const key of disableFrom(fromCascade)) {
    delete next.options[key];
    next.enabled[key] = false;
  }
  return next;
}

function buildMstBody(row: RequirementItem): RequirementMstRequest["requirementMst"] {
  return {
    team: row.team.trim() || undefined,
    category: row.category.trim() || undefined,
    subCategory: row.subCategory.trim() || undefined,
    document: row.document.trim() || undefined,
    reason: row.reason.trim() || undefined,
    fupCode: row.fupCode.trim() || undefined,
  };
}

type PatchRow = (
  id: RequirementItem["id"],
  patch: Partial<RequirementItem>,
) => void;

export function useRequirementMstCascade(patchRow: PatchRow) {
  const [sessionRevision, setSessionRevision] = useState(0);
  const bumpSessionRevision = useCallback(
    () => setSessionRevision((value) => value + 1),
    [],
  );

  const resolveRowFieldOptions = useCallback(
    (row: RequirementItem, key: RequirementColumnKey): RequirementStatusOption[] | undefined => {
      if (!isNewRequirement(row)) return undefined;
      if (!CASCADE_KEYS.includes(key as RequirementMstCascadeKey)) return undefined;
      const session = getRequirementMstRowSession(rowId(row));
      const list = session.options[key as RequirementMstCascadeKey];
      if (!list) return [];
      return toOptions(list);
    },
    [],
  );

  const isRowFieldDisabled = useCallback((row: RequirementItem, key: RequirementColumnKey): boolean => {
    if (!isNewRequirement(row)) return false;
    if (!CASCADE_KEYS.includes(key as RequirementMstCascadeKey)) return false;
    const session = getRequirementMstRowSession(rowId(row));
    return session.enabled[key as RequirementMstCascadeKey] !== true;
  }, []);

  const applyCascadeResult = useCallback(
    (row: RequirementItem, session: RequirementMstRowSession, result: Awaited<ReturnType<typeof fetchRequirementMstLevel>>) => {
      const id = rowId(row);
      if (result.level === "requirement") {
        patchRow(row.id, {
          description: result.description,
        });
        setRequirementMstRowSession(id, session);
        bumpSessionRevision();
        return;
      }

      const nextKey = result.level;
      session.options[nextKey] = result.options;
      session.enabled[nextKey] = result.options.length > 0;
      for (const key of disableFrom(nextKey)) {
        delete session.options[key];
        session.enabled[key] = false;
      }
      setRequirementMstRowSession(id, session);
      bumpSessionRevision();
    },
    [bumpSessionRevision, patchRow],
  );

  const onCascadeFieldChange = useCallback(
    async (row: RequirementItem, key: RequirementColumnKey, value: string) => {
      if (!isNewRequirement(row)) return;

      const id = rowId(row);
      const toClear = CLEAR_AFTER[key] ?? [];
      const patch: Partial<RequirementItem> = { [key]: value };
      for (const field of toClear) {
        patch[field] = field === "ocrStatus" ? "-" : "";
      }
      patchRow(row.id, patch);

      if (key === "team" && value.trim().length === 0) return;

      const triggers: RequirementColumnKey[] = ["team", "category", "subCategory", "document", "reason", "fupCode"];
      if (!triggers.includes(key)) return;

      let session = getRequirementMstRowSession(id);
      session = resetCascadeSession(session, key);

      const bodyRow: RequirementItem = { ...row, ...patch };
      try {
        const result = await fetchRequirementMstLevel(buildRequirementMstRequest(buildMstBody(bodyRow)));
        applyCascadeResult(bodyRow, session, result);
      } catch {
        setRequirementMstRowSession(id, session);
        bumpSessionRevision();
      }
    },
    [applyCascadeResult, bumpSessionRevision, patchRow],
  );

  return useMemo(
    () => ({
      resolveRowFieldOptions,
      isRowFieldDisabled,
      onCascadeFieldChange,
    }),
    [isRowFieldDisabled, onCascadeFieldChange, resolveRowFieldOptions, sessionRevision],
  );
}