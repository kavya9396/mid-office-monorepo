import { useEffect, useState } from "react";
import type { RequirementColumnKey, RequirementItem } from "./types";

export const isNewRequirement = (row: RequirementItem): boolean =>
  Boolean(row.isNew) || (typeof row.id === "string" && row.id.startsWith("req-"));

export const createEmptyRequirement = (template?: Partial<RequirementItem>): RequirementItem => ({
  id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  status: "Pending",
  ocrStatus: "",
  team: "",
  profile: "",
  category: "",
  subCategory: "",
  document: "",
  reason: "",
  fupCode: "",
  extraRemarks: "",
  description: "",
  isNew: true,
  ...template,
});

/** Local copy of the rows (edits / removals live here until Save) plus the Save flow. */
export function useRequirementRows(
  requirements: RequirementItem[],
  onSave?: (requirements: RequirementItem[]) => void | Promise<void>,
) {
  const [rows, setRows] = useState<RequirementItem[]>(requirements);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(requirements);
  }, [requirements]);

  const addRow = (template?: Partial<RequirementItem>) => {
    const newRow = createEmptyRequirement(template);
    setRows((current) => [newRow, ...current]);
    return newRow;
  };

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

  return { rows, saving, addRow, updateRow, removeRow, save };
}
