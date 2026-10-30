import type {
  RequirementItem,
  RequirementStatusOption,
} from "@insurance-poc/common/requirement-mgmt";

// Same normalisation as the prototype: anything that is not Pending / Waived is Accept.
const normaliseStatus = (status: string) => {
  const value = status.trim().toUpperCase();
  if (value === "PENDING") return "Pending";
  if (value === "WAIVE" || value === "WAIVED") return "Waived";
  return "Accept";
};

export type RawRequirement = Omit<RequirementItem, "id" | "profile" | "extraRemarks"> & {
  requirementId: number;
};

export function mapRequirements(rawRequirements: RawRequirement[]): RequirementItem[] {
  return rawRequirements.map(({ requirementId, ...rest }) => ({
    ...rest,
    id: requirementId,
    status: normaliseStatus(rest.status),
    profile: "",
    extraRemarks: "",
  }));
}

export const requirementStatusOptions: RequirementStatusOption[] = [
  { label: "Pending", value: "Pending" },
  { label: "Accept", value: "Accept" },
  { label: "Waived", value: "Waived" },
];

export const requirementStatusOrder = ["Accept", "Reject", "Cancelled", "Waived", "Received", "Pending"];

export const requirementStatusVariants = {
  Pending: "Pending",
  Accept: "Accept",
  Reject: "Reject",
  Cancelled: "Cancelled",
  Waived: "Waived",
  Received: "Received",
} as const;
