import { describe, expect, it } from "vitest";
import {
  buildNsdlNotice,
  hasPendingPanPendcode,
  isPanValidated,
  nsdlSelectValues,
  panFlagFromValidation,
  resetPanFlagOnChange,
} from "../components/LifeAssured/editApplicant.validation";
import { PAN_NOT_VALIDATED_MESSAGE, RAISE_PAN_PENDCODE_MESSAGE, requiredMessage } from "../components/LifeAssured/editApplicant.messages";

describe("panFlagFromValidation", () => {
  it("is YES only for a valid PAN", () => {
    expect(panFlagFromValidation(true)).toBe("YES");
    expect(panFlagFromValidation(false)).toBe("NO");
  });
});

describe("resetPanFlagOnChange", () => {
  const current = { panNumber: "ACBPJ4468N", dob: "1967-06-03", isPanValid: "YES" };

  it("keeps the flag when PAN No and Birthdate are unchanged", () => {
    expect(resetPanFlagOnChange(current, { panNumber: "ACBPJ4468N", dob: "1967-06-03" })).toBe("YES");
  });

  it("resets to NO when PAN No changes", () => {
    expect(resetPanFlagOnChange(current, { panNumber: "ACBPJ4468M", dob: "1967-06-03" })).toBe("NO");
  });

  it("resets to NO when Birthdate changes", () => {
    expect(resetPanFlagOnChange(current, { panNumber: "ACBPJ4468N", dob: "1967-06-04" })).toBe("NO");
  });
});

describe("isPanValidated", () => {
  it("allows Save only when the flag is YES", () => {
    expect(isPanValidated("YES")).toBe(true);
    expect(isPanValidated("NO")).toBe(false);
    expect(isPanValidated("")).toBe(false);
  });
});

describe("nsdlSelectValues", () => {
  it("maps each matched flag to YES", () => {
    expect(nsdlSelectValues({ nameMatching: true, dobMatching: true, aadharSeeding: true })).toEqual({
      nsdlNameMatching: "YES",
      nsdlDobMatching: "YES",
      aadharSeedingStatus: "YES",
    });
  });

  it("maps each flag on its own", () => {
    expect(nsdlSelectValues({ nameMatching: true, dobMatching: false, aadharSeeding: false })).toEqual({
      nsdlNameMatching: "YES",
      nsdlDobMatching: "NO",
      aadharSeedingStatus: "NO",
    });
  });

  it("gives NO for all three when the data is not available", () => {
    expect(nsdlSelectValues(undefined)).toEqual({
      nsdlNameMatching: "NO",
      nsdlDobMatching: "NO",
      aadharSeedingStatus: "NO",
    });
  });
});

describe("buildNsdlNotice", () => {
  it("shows only the API message when no pendcode is needed", () => {
    expect(buildNsdlNotice("Existing and Valid PAN", false)).toBe("Existing and Valid PAN");
  });

  it("adds the raise-pendcode line after the API message", () => {
    expect(buildNsdlNotice("NSDL down", true)).toBe(`NSDL down ${RAISE_PAN_PENDCODE_MESSAGE}`);
  });

  it("shows just the pendcode line when the API sent no message", () => {
    expect(buildNsdlNotice("  ", true)).toBe(RAISE_PAN_PENDCODE_MESSAGE);
  });
});

describe("hasPendingPanPendcode", () => {
  it("matches fupCode PAN with status pending, ignoring case", () => {
    expect(hasPendingPanPendcode([{ fupCode: "pan", status: "Pending" }])).toBe(true);
  });

  it("ignores other codes and other statuses", () => {
    expect(
      hasPendingPanPendcode([
        { fupCode: "PAL", status: "pending" },
        { fupCode: "PAN", status: "Accept" },
        {},
      ]),
    ).toBe(false);
    expect(hasPendingPanPendcode([])).toBe(false);
  });
});

describe("messages", () => {
  it("keeps the agreed wording", () => {
    expect(PAN_NOT_VALIDATED_MESSAGE).toBe("Please validate PAN with NSDL before saving");
    expect(RAISE_PAN_PENDCODE_MESSAGE).toBe("Please raise a PAN pendcode.");
    expect(requiredMessage("PAN No")).toBe("PAN No is required");
  });
});
