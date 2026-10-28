import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { colors, CustomButton, CustomTabs, type TabItem } from "@insurance-poc/ui";
import { ProfileImage } from "./ProfileImage";
import type { FieldData } from "./Applicant Profile/Fields";
import { ImageDetails, type ImageDetailRecord } from "./Applicant Profile/Image Details";
import { PersonalKyc } from "./Applicant Profile/Personal & KYC";
import { ContactAddress } from "./Applicant Profile/Contact & Address";
import { ProductDetails } from "./Applicant Profile/Product Details";
import { Nominee, type AppointeeRow, type NomineeRow } from "./Applicant Profile/Nominee";
import { Lifestyle } from "./Applicant Profile/Lifestyle";

export type { FieldData, ImageDetailRecord, NomineeRow, AppointeeRow };

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
};

export type LifeAssuredProps = {
  applicants: LifeAssuredApplicant[];
  onEdit?: (applicantId: string) => void;
  onViewMedical?: (applicantId: string) => void;
  onViewFinancial?: (applicantId: string) => void;
  /** When true the profile image column is hidden (e.g. inside a dialog). */
  hideProfileImage?: boolean;
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
  hideProfileImage = false,
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
        gridTemplateColumns: hideProfileImage
          ? "1fr"
          : { xs: "1fr", sm: "108px minmax(0, 1fr)" },
      }}
    >
      {!hideProfileImage && (
        <ProfileImage label={applicant.label} image={applicant.profileImage} />
      )}

      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1,
            py: 0.5,
            borderBottom: `1px solid ${colors.borderAccent}`,
            flexWrap: "wrap",
          }}
        >
          <CustomTabs tabs={PROFILE_TABS} value={tab} onChange={setTab} />
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
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

        <Box sx={{ p: 0.5 }}>{renderTab()}</Box>
      </Box>
    </Box>
  );
}

export function LifeAssured({ applicants, ...actions }: Readonly<LifeAssuredProps>) {
  const [activeId, setActiveId] = useState<string>(applicants[0]?.id ?? "");

  if (applicants.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100px" }}>
        <Typography sx={{ fontSize: "12px", color: colors.textMuted }}>No applicant details available</Typography>
      </Box>
    );
  }

  const memberTabs: TabItem<string>[] = applicants.map((a) => ({ key: a.id, label: a.label }));
  const activeApplicant = applicants.find((a) => a.id === activeId) ?? applicants[0];

  return (
    <Box>
      {applicants.length > 1 && (
        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderBottom: `1px solid ${colors.borderAccent}`,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CustomTabs
            tabs={memberTabs}
            value={activeId}
            onChange={setActiveId}
          />
        </Box>
      )}
      <ApplicantProfileSection applicant={activeApplicant} {...actions} />
    </Box>
  );
}

export default LifeAssured;
