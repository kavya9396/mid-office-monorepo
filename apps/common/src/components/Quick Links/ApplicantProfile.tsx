import { Typography } from "@mui/material";
import { CustomDialog } from "@insurance-poc/ui";
import { LifeAssured, type LifeAssuredApplicant, type LifeAssuredProps } from "../LifeAssured/LifeAssured";


export type ApplicantProfileDialogProps = Partial<Omit<LifeAssuredProps, "applicants">> & {
  /** Applicants from the API response; nothing is rendered from hard-coded data. */
  applicants: LifeAssuredApplicant[];
  open: boolean;
  onClose: () => void;
};

export function ApplicantProfile({
  open,
  onClose,
  applicants,
  onEdit,
  onViewMedical,
  onViewFinancial,
}: Readonly<ApplicantProfileDialogProps>) {
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
      <LifeAssured
        applicants={applicants}
        hideProfileImage
        onEdit={onEdit}
        onViewMedical={onViewMedical}
        onViewFinancial={onViewFinancial}
      />
    </CustomDialog>
  );
}

export default ApplicantProfile;
