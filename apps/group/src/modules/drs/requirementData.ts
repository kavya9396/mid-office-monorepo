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

type RawRequirement = Omit<RequirementItem, "id" | "profile" | "extraRemarks"> & {
  requirementId: number;
};

// Mock API response (requirementManagement in /mock/drs/drs.mock.json of dvt-drs.html)
const rawRequirements: RawRequirement[] = [
  {
    requirementId: 11792,
    status: "pending",
    ocrStatus: "pass",
    team: "UW",
    category: "Consent",
    subCategory: "Policy confirmation",
    document: "OTP",
    reason: "Document not uplaoded",
    fupCode: "OTP",
    description: "OTP-Policy confirmation/ consent code required",
  },
  {
    requirementId: 11790,
    status: "Accept",
    ocrStatus: "pass",
    team: "COPS",
    category: "KYC",
    subCategory: "Ageproof",
    document: "PAN Card",
    reason: "Documents not submitted",
    fupCode: "AGE",
    description:
      "AGE-Age proof of life assured (Passport - front & back or Driving License or Pan Card or Aadhaar - front & back)",
  },
  {
    requirementId: 11791,
    status: "pending",
    ocrStatus: "pass",
    team: "COPS",
    category: "KYC",
    subCategory: "PAN Card",
    document: "PAN /Form 60",
    reason: "Documents not submitted",
    fupCode: "PAL",
    description: "PAL- Please submit PAN Card copy linked with your Aadhaar",
  },
  {
    requirementId: 11795,
    status: "pending",
    ocrStatus: "pass",
    team: "COPS",
    category: "KYC",
    subCategory: "PAN Card",
    document: "Photo",
    reason: "Documents not submitted",
    fupCode: "KYP",
    description: "KYP- Upload recent photograph of proposer",
  },
  {
    requirementId: 11793,
    status: "waived",
    ocrStatus: "pass",
    team: "COPS",
    category: "KYC",
    subCategory: "ID proof",
    document: "Drving License",
    reason: "Documents not submitted",
    fupCode: "IDM",
    description:
      "IDM- Upload valid ID proof of proposer (Passport - front & back or Driving License or Pan Card or Aadhaar - front & back)",
  },
  {
    requirementId: 11794,
    status: "Accept",
    ocrStatus: "pass",
    team: "COPS",
    category: "KYC",
    subCategory: "Address Proof",
    document: "Driving License",
    reason: "Documents not submitted",
    fupCode: "ADP",
    description:
      "ADP-Address proof of the proposer matching with application form (Passport - front & back or Aadhaar - front & back or Driving License or Voter id)",
  },
  {
    requirementId: 12069,
    status: "pending",
    ocrStatus: "",
    team: "COPS",
    category: "Medical",
    subCategory: "SPAARC call",
    document: "SPAARC call ID",
    reason: "Call ID to be raised for details mismatch in Application form",
    fupCode: "SCI",
    description:
      "SPAARC call ID to be raised (related to Name, address, DOB, Pin Code, gender & residential status mismatch as per the IUW form)",
  },
];

export const mockRequirements: RequirementItem[] = rawRequirements.map(
  ({ requirementId, ...rest }) => ({
    ...rest,
    id: requirementId,
    status: normaliseStatus(rest.status),
    profile: "",
    extraRemarks: "",
  }),
);

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
