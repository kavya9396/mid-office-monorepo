export type RequirementMstRequest = {
  types: ["requirement_mst"];
  requirementMst: {
    team?: string;
    category?: string;
    subCategory?: string;
    document?: string;
    reason?: string;
    fupCode?: string;
  };
};

export type RequirementMstRequirementRow = {
  code: string;
  description: string;
  isActive: string;
  ocrReq?: string;
};

export type RequirementMstLevelResult =
  | { level: "category"; options: string[] }
  | { level: "subCategory"; options: string[] }
  | { level: "document"; options: string[] }
  | { level: "reason"; options: string[] }
  | { level: "fupCode"; options: string[] }
  | {
      level: "requirement";
      description: string;
      ocrStatus: string;
    };

export const REQUIREMENT_MST_CASCADE_KEYS = [
  "category",
  "subCategory",
  "document",
  "reason",
  "fupCode",
] as const;

export type RequirementMstCascadeKey = (typeof REQUIREMENT_MST_CASCADE_KEYS)[number];