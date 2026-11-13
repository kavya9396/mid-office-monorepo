import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";

const normaliseStatus = (status: string) => {
  const value = status.trim().toUpperCase();
  if (value === "PENDING") return "Pending";
  if (value === "WAIVE" || value === "WAIVED") return "Waived";
  if (value === "ACCEPT" || value === "ACCEPTED") return "Accept";
  if (value === "REJECT" || value === "REJECTED") return "Reject";
  if (value === "CANCELLED" || value === "CANCEL") return "Cancelled";
  if (value === "RECEIVED") return "Received";
  return status.trim().length > 0 ? status.trim().charAt(0).toUpperCase() + status.trim().slice(1) : "";
};

export type RawRequirement = Omit<RequirementItem, "id"> & {
  requirementId: number;
};

export function mapRequirements(rawRequirements: RawRequirement[]): RequirementItem[] {
  return rawRequirements.map(({ requirementId, ...rest }) => ({
    ...rest,
    id: requirementId,
    status: normaliseStatus(rest.status),
  }));
}

export const requirementStatusOrder = ["Accept", "Reject", "Cancelled", "Waived", "Received", "Pending"];

export const requirementStatusVariants = {
  Pending: "Pending",
  Accept: "Accept",
  Reject: "Reject",
  Cancelled: "Cancelled",
  Waived: "Waived",
  Received: "Received",
} as const;
