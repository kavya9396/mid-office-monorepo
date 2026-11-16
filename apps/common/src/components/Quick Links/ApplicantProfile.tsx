import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { CustomDialog, CustomTabs } from "@insurance-poc/ui";
import { LifeAssured, type LifeAssuredApplicant, type LifeAssuredProps } from "../LifeAssured/LifeAssured";


export type ApplicantProfileDialogProps = Partial<Omit<LifeAssuredProps, "applicants">> & {
  /** Applicants from the API response; nothing is rendered from hard-coded data. */
  applicants: LifeAssuredApplicant[];
  open: boolean;
  onClose: () => void;
  /**
   * When true, applicants are selected through member tabs (one applicant shown at a time, as in the
   * GUW prototype) instead of being listed one after another (DVT).
   */
  memberTabs?: boolean;
};

export function ApplicantProfile({
  open,
  onClose,
  applicants,
  onEdit,
  onViewMedical,
  onViewFinancial,
  memberTabs = false,
}: Readonly<ApplicantProfileDialogProps>) {
  const [selectedId, setSelectedId] = useState("");
  const showMemberTabs = memberTabs && applicants.length > 0;
  const selected = applicants.find((applicant) => applicant.id === selectedId) ?? applicants[0];

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={
        <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
          Applicant Profile
        </Typography>
      }
      maxWidth="xl"
      fullWidth
      contentSx={{ p: 0 }}
    >
      {showMemberTabs && selected && (
        <Box sx={{ display: "flex", justifyContent: "center", px: 1, pt: 1, pb: 0.5 }}>
          <CustomTabs
            tabs={applicants.map((applicant) => ({ key: applicant.id, label: applicant.label }))}
            value={selected.id}
            onChange={setSelectedId}
          />
        </Box>
      )}
      <LifeAssured
        applicants={showMemberTabs && selected ? [selected] : applicants}
        hideProfileImage
        onEdit={onEdit}
        onViewMedical={onViewMedical}
        onViewFinancial={onViewFinancial}
      />
    </CustomDialog>
  );
}

export default ApplicantProfile;
