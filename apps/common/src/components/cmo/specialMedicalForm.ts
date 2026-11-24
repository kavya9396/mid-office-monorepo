import { MEDICAL_GROUPS, type MedicalSection } from "../../modules/Medical/medical.config";

/** Special Medical section whose title matches the master description. */
export function findSpecialMedicalSection(description: string): MedicalSection | undefined {
  const title = description.trim().toLowerCase();
  if (title.length === 0) return undefined;
  const group = MEDICAL_GROUPS.find((item) => item.key === "special_medical");
  return group?.sections.find((section) => section.title.trim().toLowerCase() === title);
}

const firstFilled = (values: Readonly<Record<string, string>>, labels: readonly string[]) =>
  labels.map((label) => values[label]?.trim() ?? "").find((value) => value.length > 0) ?? "";

/** Maps a section's field values onto the draft the decision table already reads. */
export function draftFromSpecialMedical(
  medicalTest: string,
  values: Readonly<Record<string, string>>,
) {
  return {
    medicalTest,
    testDate: firstFilled(values, ["Test Date", "Date"]),
    findings: firstFilled(values, ["Findings"]),
    examineeName: firstFilled(values, ["Examinee Name"]),
    examineeAge: firstFilled(values, ["Examinee Age"]),
    diagnosticCentreName: firstFilled(values, ["Diagnostic Centre Name"]),
    doctorName: firstFilled(values, ["Doctor Name"]),
    doctorRegistrationNo: firstFilled(values, ["Doctor Registration No"]),
    remarks: firstFilled(values, ["Remarks", "Remark"]),
    values: { ...values },
  };
}
