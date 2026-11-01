import { useState } from "react";
import type { RequirementColumnKey, RequirementItem } from "./types";

/** Local copy of the rows (edits / removals live here until Save) plus the Save flow. */
export function useRequirementRows(
  requirements: RequirementItem[],
  onSave?: (requirements: RequirementItem[]) => void | Promise<void>,
) {
  const [rows, setRows] = useState<RequirementItem[]>(requirements);
  const [saving, setSaving] = useState(false);

  const updateRow = (row: RequirementItem, key: RequirementColumnKey, value: string) =>
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, [key]: value } : item)));

  const removeRow = (id: RequirementItem["id"]) =>
    setRows((current) => current.filter((item) => item.id !== id));

  const save = async () => {
    if (!onSave || saving) return;
    setSaving(true);
    try {
      await onSave(rows);
    } finally {
      setSaving(false);
    }
  };

  return { rows, saving, updateRow, removeRow, save };
}
