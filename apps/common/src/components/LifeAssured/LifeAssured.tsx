import { useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { colors, CustomButton, CustomTabs, type TabItem } from "@insurance-poc/ui";
import { DecisionSection, type DecisionOption } from "../DecisionSection";
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
import type { PanStatus, PanValidationInput, PanValidationResult } from "./editApplicant.validation";
import { ImageDetails, type ImageDetailRecord } from "./Applicant Profile/Image Details";
import { PersonalKyc } from "./Applicant Profile/Personal & KYC";
import { ContactAddress } from "./Applicant Profile/Contact & Address";
import { ProductDetails } from "./Applicant Profile/Product Details";
import { Nominee, type AppointeeRow, type NomineeRow } from "./Applicant Profile/Nominee";
import { Lifestyle } from "./Applicant Profile/Lifestyle";
import { FieldCard } from "./Applicant Profile/Fields";
import { PaymentPayout } from "./Applicant Profile/Payment & Payout";

export { hasPendingPanPendcode } from "./editApplicant.validation";
export { PAN_INVALID_SUBMIT_BLOCKED_MESSAGE } from "./editApplicant.messages";

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
  PanStatus,
  PanValidationInput,
  PanValidationResult,
};

export type LifeAssuredApplicant = {
  id: string;
  partyId?: string;
  memberType?: string;
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
  /** GUW only: `generic` tab. */
  genericFields?: FieldData[];
  /** GUW only: `eia` tab. */
  eiaFields?: FieldData[];
  /** GUW only: `payment_and_payout` tab, "Payment Details" card. */
  paymentDetails?: FieldData[];
  /** GUW only: `payment_and_payout` tab, "Payout Details" card. */
  payoutDetails?: FieldData[];
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
  /**
   * Replaces the built-in edit dialog (for example the Retail CVT one, which has different fields).
   * Called only while an applicant is being edited; `onClose` stops editing. When given, `onSaveEdit`,
   * `editOptions` and the NSDL / PAN props are not used.
   */
  renderEditDialog?: (applicant: LifeAssuredApplicant, onClose: () => void) => ReactNode;
  /** NSDL PAN validation for the applicant being edited. Enables the PAN gate in the edit dialog. */
  onValidatePan?: (applicantId: string, input: PanValidationInput) => Promise<PanValidationResult>;
  /** Last NSDL result per applicant id, kept by the app so it survives closing and reopening the dialog. */
  panStatusByApplicant?: Readonly<Record<string, PanStatus>>;
  onPanStatusChange?: (applicantId: string, status: PanStatus) => void;
  onViewMedical?: (applicantId: string) => void;
  onViewFinancial?: (applicantId: string) => void;
  /** When true the profile image column is hidden (e.g. inside a dialog). */
  hideProfileImage?: boolean;
  /** Tab set: `dvt` (default) or `guw` (Generic, eIA and Payment & Payout instead of Lifestyle, and no Edit button). */
  variant?: "dvt" | "guw";
  /** Tabs to show, in this order. Overrides the tab set of `variant` when provided and not empty. */
  tabs?: LifeAssuredTab[];
  /** When true, a decision section (remarks, decision, decision code) is shown at the end of each life assured. */
  showDecision?: boolean;
  /** When true, the required-field errors of every decision section are shown. */
  showDecisionErrors?: boolean;
  /** Decision dropdown options; omit to use the `DecisionSection` defaults. */
  decisionOptions?: DecisionOption[];
  /** Decision code shown (read-only) in every life assured's decision section. */
  decisionCode?: string;
  /** Fires when the remarks or decision of a life assured's decision section change. */
  onMemberDecisionChange?: (applicantId: string, value: MemberDecisionValue) => void;
};

export type MemberDecisionValue = { remarks: string; decision: string };

export type LifeAssuredTab =
  | "imageDetails"
  | "personalKyc"
  | "contactAddress"
  | "productDetails"
  | "nominee"
  | "lifestyle"
  | "generic"
  | "eia"
  | "paymentPayout";

const PROFILE_TAB_LABELS: Record<LifeAssuredTab, string> = {
  imageDetails: "Image Details",
  personalKyc: "Personal & KYC",
  contactAddress: "Contact & Address",
  productDetails: "Product Details",
  nominee: "Nominee",
  lifestyle: "Lifestyle",
  generic: "Generic",
  eia: "eIA",
  paymentPayout: "Payment & Payout",
};

const toTabItems = (keys: LifeAssuredTab[]): TabItem<LifeAssuredTab>[] =>
  keys.map((key) => ({ key, label: PROFILE_TAB_LABELS[key] }));

const PROFILE_TABS = toTabItems([
  "imageDetails",
  "personalKyc",
  "contactAddress",
  "productDetails",
  "nominee",
  "lifestyle",
]);

const GUW_PROFILE_TABS = toTabItems([
  "imageDetails",
  "personalKyc",
  "contactAddress",
  "nominee",
  "generic",
  "productDetails",
  "eia",
  "paymentPayout",
]);

const resolveTabs = (tabs: LifeAssuredTab[] | undefined, variant: "dvt" | "guw"): TabItem<LifeAssuredTab>[] => {
  if (tabs && tabs.length > 0) return toTabItems(tabs);
  return variant === "guw" ? GUW_PROFILE_TABS : PROFILE_TABS;
};

type ApplicantProfileSectionProps = Omit<LifeAssuredProps, "applicants" | "onMemberDecisionChange"> & {
  applicant: LifeAssuredApplicant;
  onDecisionChange?: (value: MemberDecisionValue) => void;
};

function ApplicantProfileSection({
  applicant,
  onEdit,
  onViewMedical,
  onViewFinancial,
  hideProfileImage = false,
  variant = "dvt",
  tabs,
  showDecision = false,
  showDecisionErrors = false,
  decisionOptions,
  decisionCode,
  onDecisionChange,
}: Readonly<ApplicantProfileSectionProps>) {
  const tabItems = resolveTabs(tabs, variant);
  const [tab, setTab] = useState<LifeAssuredTab>(tabItems[0]?.key ?? "imageDetails");
  const [memberDecision, setMemberDecision] = useState<MemberDecisionValue>({ remarks: "", decision: "" });
  const updateMemberDecision = (patch: Partial<MemberDecisionValue>) => {
    const next = { ...memberDecision, ...patch };
    setMemberDecision(next);
    onDecisionChange?.(next);
  };

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
      case "generic":
        return <FieldCard title="Generic" fields={applicant.genericFields ?? []} columns={4} />;
      case "eia":
        return <FieldCard title="eIA" fields={applicant.eiaFields ?? []} columns={4} />;
      case "paymentPayout":
        return (
          <PaymentPayout
            paymentDetails={applicant.paymentDetails ?? []}
            payoutDetails={applicant.payoutDetails ?? []}
          />
        );
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
            justifyContent: variant === "guw" ? "center" : undefined,
          }}
        >
          <CustomTabs tabs={tabItems} value={tab} onChange={setTab} />
          {/* Empty when no action handlers are passed (the GUW dialog passes none); hidden so its auto margin does not push the tabs off-centre */}
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexShrink: 0,
              "&:empty": { display: "none" },
            }}
          >
            {onEdit && variant !== "guw" && (
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

        {showDecision && (
          <DecisionSection
            ariaLabel={`${applicant.label} Decision`}
            remarksLabel={`${applicant.label} Remarks`}
            decisionLabel={`${applicant.label} Decision`}
            decisionCodeLabel={`${applicant.label} Decision Code`}
            decisionOptions={decisionOptions}
            decision={memberDecision.decision}
            remarks={memberDecision.remarks}
            onDecisionChange={(decision) => updateMemberDecision({ decision })}
            onRemarksChange={(remarks) => updateMemberDecision({ remarks })}
            decisionCode={decisionCode}
            showErrors={showDecisionErrors}
            hideSubmit
            sx={{ border: "none", borderTop: `1px solid ${colors.borderAccent}`, borderRadius: 0 }}
          />
        )}
      </Box>
    </Box>
  );
}

export function LifeAssured({
  applicants,
  onEdit,
  onSaveEdit,
  editOptions,
  renderEditDialog,
  onValidatePan,
  panStatusByApplicant,
  onPanStatusChange,
  onMemberDecisionChange,
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
        <ApplicantProfileSection
          key={applicant.id}
          applicant={applicant}
          onEdit={handleEdit}
          onDecisionChange={(value) => onMemberDecisionChange?.(applicant.id, value)}
          {...actions}
        />
      ))}

      {renderEditDialog ? (
        editingApplicant && renderEditDialog(editingApplicant, () => setEditingId(null))
      ) : (
        <EditApplicantDialog
          open={Boolean(editingApplicant)}
          onClose={() => setEditingId(null)}
          initialValues={editingApplicant?.editValues}
          initialNominees={editingApplicant?.editNominees}
          initialRiders={editingApplicant?.editRiders}
          initialLoan={editingApplicant?.editLoan}
          options={editOptions}
          onValidatePan={
            onValidatePan && editingApplicant ? (input) => onValidatePan(editingApplicant.id, input) : undefined
          }
          panStatus={editingApplicant ? panStatusByApplicant?.[editingApplicant.id] : undefined}
          onPanStatusChange={
            onPanStatusChange && editingApplicant
              ? (status) => onPanStatusChange(editingApplicant.id, status)
              : undefined
          }
          onSave={(values, nominees, riders, loan) => {
            if (editingApplicant) onSaveEdit?.(editingApplicant.id, values, nominees, riders, loan);
            setEditingId(null);
          }}
        />
      )}
    </Box>
  );
}

export default LifeAssured;
