import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { colors, CustomButton, CustomTabs, type TabItem } from "@insurance-poc/ui";
import { ProfileImage } from "./ProfileImage";
import type { FieldData } from "./Applicant Profile/Fields";
import {
  EditApplicantDialog,
  type EditApplicantOptions,
  type EditApplicantValues,
  type NomineeEditRow,
  type RiderEditRow,
  type LoanEditValues,
} from "./EditApplicantDialog";
import { ImageDetails, type ImageDetailRecord } from "./Applicant Profile/Image Details";
import { PersonalKyc } from "./Applicant Profile/Personal & KYC";
import { ContactAddress } from "./Applicant Profile/Contact & Address";
import { ProductDetails } from "./Applicant Profile/Product Details";
import { Nominee, type AppointeeRow, type NomineeRow } from "./Applicant Profile/Nominee";
import { Lifestyle } from "./Applicant Profile/Lifestyle";

export type {
  FieldData,
  ImageDetailRecord,
  NomineeRow,
  AppointeeRow,
  EditApplicantOptions,
  EditApplicantValues,
  NomineeEditRow,
  RiderEditRow,
  LoanEditValues,
};

export type LifeAssuredApplicant = {
  id: string;
  /** Name shown under the photo, for example "Life Assured 1". */
  label: string;
  profileImage?: string;
  imageRecords: ImageDetailRecord[];
  personalFields: FieldData[];
  kycFields: FieldData[];
  communicationAddress: FieldData[];
  permanentAddress: FieldData[];
  contactDetails: FieldData[];
  productFields: FieldData[];
  nominees: NomineeRow[];
  appointees: AppointeeRow[];
  lifestyleFields: FieldData[];
  /** Values pre-filled in the Edit dialog. */
  editValues?: Partial<EditApplicantValues>;
  /** Nominee rows pre-filled in the Edit dialog. */
  editNominees?: NomineeEditRow[];
  /** Rider rows pre-filled in the Edit dialog. */
  editRiders?: RiderEditRow[];
  /** Base & loan values pre-filled in the Edit dialog. */
  editLoan?: LoanEditValues;
};

export type LifeAssuredProps = {
  applicants: LifeAssuredApplicant[];
  /** Fires when Edit is clicked; the edit dialog opens as well. */
  onEdit?: (applicantId: string) => void;
  /** Fires when Save is clicked in the edit dialog with valid values. */
  onSaveEdit?: (
    applicantId: string,
    values: EditApplicantValues,
    nominees: NomineeEditRow[],
    riders: RiderEditRow[],
    loan: LoanEditValues,
  ) => void;
  /** Dropdown options for the edit dialog (masterData: gender, id_proof_type, resident_status). */
  editOptions?: Partial<EditApplicantOptions>;
  onViewMedical?: (applicantId: string) => void;
  onViewFinancial?: (applicantId: string) => void;
};

type ProfileTab =
  | "imageDetails"
  | "personalKyc"
  | "contactAddress"
  | "productDetails"
  | "nominee"
  | "lifestyle";

const PROFILE_TABS: TabItem<ProfileTab>[] = [
  { key: "imageDetails", label: "Image Details" },
  { key: "personalKyc", label: "Personal & KYC" },
  { key: "contactAddress", label: "Contact & Address" },
  { key: "productDetails", label: "Product Details" },
  { key: "nominee", label: "Nominee" },
  { key: "lifestyle", label: "Lifestyle" },
];

type ApplicantProfileSectionProps = Omit<LifeAssuredProps, "applicants"> & {
  applicant: LifeAssuredApplicant;
};

function ApplicantProfileSection({
  applicant,
  onEdit,
  onViewMedical,
  onViewFinancial,
}: Readonly<ApplicantProfileSectionProps>) {
  const [tab, setTab] = useState<ProfileTab>("imageDetails");

  const renderTab = () => {
    switch (tab) {
      case "imageDetails":
        return <ImageDetails records={applicant.imageRecords} />;
      case "personalKyc":
        return <PersonalKyc personalFields={applicant.personalFields} kycFields={applicant.kycFields} />;
      case "contactAddress":
        return (
          <ContactAddress
            communicationAddress={applicant.communicationAddress}
            permanentAddress={applicant.permanentAddress}
            contactDetails={applicant.contactDetails}
          />
        );
      case "productDetails":
        return <ProductDetails fields={applicant.productFields} />;
      case "nominee":
        return <Nominee nominees={applicant.nominees} appointees={applicant.appointees} />;
      case "lifestyle":
        return <Lifestyle fields={applicant.lifestyleFields} />;
    }
  };

  return (
    <Box
      sx={{
        border: `1px solid ${colors.borderAccent}`,
        borderRadius: "8px",
        overflow: "hidden",
        bgcolor: colors.white,
        boxShadow: `0 3px 12px ${colors.shadowBrand}`,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "108px minmax(0, 1fr)" },
      }}
    >
      <ProfileImage label={applicant.label} image={applicant.profileImage} />

      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.25,
            py: 0.75,
            bgcolor: colors.surfaceAccent,
            borderBottom: `1px solid ${colors.borderAccent}`,
            flexWrap: "wrap",
          }}
        >
          <CustomTabs tabs={PROFILE_TABS} value={tab} onChange={setTab} sx={{ minWidth: 0, bgcolor: colors.white }} />
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
            {onEdit && (
              <CustomButton variant="outlined" onClick={() => onEdit(applicant.id)}>
                Edit
              </CustomButton>
            )}
            {onViewMedical && (
              <CustomButton variant="outlined" onClick={() => onViewMedical(applicant.id)}>
                View Medical
              </CustomButton>
            )}
            {onViewFinancial && (
              <CustomButton variant="outlined" onClick={() => onViewFinancial(applicant.id)}>
                View Financial
              </CustomButton>
            )}
          </Box>
        </Box>

        <Box sx={{ p: 0.75 }}>{renderTab()}</Box>
      </Box>
    </Box>
  );
}

export function LifeAssured({
  applicants,
  onEdit,
  onSaveEdit,
  editOptions,
  ...actions
}: Readonly<LifeAssuredProps>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingApplicant = applicants.find((applicant) => applicant.id === editingId);

  const handleEdit = (applicantId: string) => {
    setEditingId(applicantId);
    onEdit?.(applicantId);
  };

  if (applicants.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100px" }}>
        <Typography sx={{ fontSize: "12px", color: colors.textMuted }}>No applicant details available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {applicants.map((applicant) => (
        <ApplicantProfileSection key={applicant.id} applicant={applicant} onEdit={handleEdit} {...actions} />
      ))}

      <EditApplicantDialog
        open={Boolean(editingApplicant)}
        onClose={() => setEditingId(null)}
        initialValues={editingApplicant?.editValues}
        initialNominees={editingApplicant?.editNominees}
        initialRiders={editingApplicant?.editRiders}
        initialLoan={editingApplicant?.editLoan}
        options={editOptions}
        onSave={(values, nominees, riders, loan) => {
          if (editingApplicant) onSaveEdit?.(editingApplicant.id, values, nominees, riders, loan);
          setEditingId(null);
        }}
      />
    </Box>
  );
}

export default LifeAssured;
