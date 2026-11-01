import { Typography } from "@mui/material";
import { CustomDialog } from "@insurance-poc/ui";
import { LifeAssured, type LifeAssuredApplicant, type LifeAssuredProps } from "../LifeAssured/LifeAssured";

/* -------------------------------------------------------------------------- */
/* Static mock data (used when no applicants are injected)                    */
/* -------------------------------------------------------------------------- */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (value: string) => {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
};

const mask = (value: string) => {
  if (!value) return "-";
  return value.length <= 4 ? "X".repeat(value.length) : `${"X".repeat(value.length - 4)}${value.slice(-4)}`;
};

const STATIC_APPLICANTS: LifeAssuredApplicant[] = [
  {
    id: "la1",
    label: "Life Assured 1",
    profileImage: undefined,
    imageRecords: [
      {
        imageType: "Live photograph",
        document: "Applicant selfie",
        faceMatchScore: "98.6%",
        imageQuality: "Good",
        remarks: "Face matched successfully",
      },
      {
        imageType: "Identity proof",
        document: "Aadhaar photograph",
        faceMatchScore: "96.2%",
        imageQuality: "Good",
        remarks: "Image is clear and readable",
      },
      {
        imageType: "Proposal form",
        document: "Signed proposal image",
        faceMatchScore: "94.8%",
        imageQuality: "Acceptable",
        remarks: "Signature and image verified",
      },
    ],
    personalFields: [
      { label: "Applicant Name", value: "Rudra Prakash Sangha" },
      { label: "Date of Birth", value: formatDate("1988-08-09T00:00") },
      { label: "Age", value: "38 Years" },
      { label: "Gender", value: "Male" },
      { label: "Marital Status", value: "-" },
      { label: "Nationality", value: "India" },
      { label: "Country of Residence", value: "India" },
      { label: "Education", value: "Graduate" },
      { label: "Resident Status", value: "IND" },
      { label: "Designation", value: "Manager" },
      { label: "Disabled", value: "-" },
      { label: "UDID Number", value: "UDID-98765" },
      { label: "City of Resident", value: "-" },
      { label: "State of Resident", value: "-" },
    ],
    kycFields: [
      { label: "PRAN Number", value: mask("123456789012") },
      { label: "PRAN Number Verification", value: "Verified" },
      { label: "PAN Number", value: "-" },
      { label: "PAN Flag", value: "Verified" },
      { label: "PAN Aadhar Seeding Status", value: "Y" },
      { label: "Identity Proof Type", value: "Aadhaar" },
      { label: "Identity Proof Expiry Date", value: formatDate("2099-12-31T00:00") },
      { label: "Identity Proof Number", value: mask("AAAAA1111A") },
      { label: "Address Proof", value: "Aadhaar" },
      { label: "Income Proof", value: "Aadhaar" },
      { label: "CKYC Number", value: "NA" },
      { label: "PEP", value: "No" },
      { label: "Criminal Proceedings", value: "No" },
    ],
    communicationAddress: [
      { label: "Address Line 1", value: "malad" },
      { label: "Address Line 2", value: "malad" },
      { label: "Address Line 3", value: "-" },
      { label: "Landmark", value: "prism" },
      { label: "City", value: "mumbai" },
      { label: "State", value: "maharashtra" },
      { label: "Country", value: "-" },
      { label: "Pincode", value: "400064" },
    ],
    permanentAddress: [
      { label: "Address Line 1", value: "RFRF" },
      { label: "Address Line 2", value: "FGHJK" },
      { label: "Address Line 3", value: "FGHJKL" },
      { label: "Landmark", value: "-" },
      { label: "City", value: "THANE" },
      { label: "State", value: "Maharashtra" },
      { label: "Country", value: "India" },
      { label: "Pincode", value: "400709" },
    ],
    contactDetails: [
      { label: "Mobile No.", value: "9878716726" },
      { label: "Email ID", value: "TRSTR@GMAIL.COM" },
      { label: "Alternate Mobile", value: "-" },
      { label: "STD/ISD Code", value: "-" },
      { label: "Landline Number", value: "-" },
      { label: "Email Pref", value: "Y" },
      { label: "SMS Pref", value: "Y" },
      { label: "Negative Pincode", value: "-" },
    ],
    productFields: [
      { label: "Product Code", value: "E36" },
      { label: "Product Type", value: "-" },
      { label: "Fund Source", value: "-" },
      { label: "Partner Type", value: "-" },
    ],
    nominees: [
      {
        nomineeName: "Smit Sangha",
        nomineeDOB: formatDate("1991-03-12T00:00"),
        gender: "Male",
        relationship: "-",
        sharePercentage: 0,
        isLASame: "-",
        relationShipWithJL: "-",
        laFlag: "-",
      },
    ],
    appointees: [
      {
        appointeeName: "Shivani Sangha",
        appointeeGender: "Female",
        appointeeDOB: formatDate("1991-03-12T00:00"),
        appointeeRelationship: "-",
      },
    ],
    lifestyleFields: [
      { label: "Height", value: "165.1" },
      { label: "Weight", value: "67" },
      { label: "BMI", value: "25.0" },
      { label: "Smoker", value: "-" },
      { label: "Alcohol", value: "-" },
      { label: "Any Narcotics Question ticked Positive", value: "-" },
      { label: "Any Medical Question ticked Positive", value: "-" },
      { label: "Is Occupation Hazardous?", value: "-" },
      { label: "Illness Impairment", value: "-" },
      { label: "Is Family Medical History? if yes please provide details", value: "-" },
    ],
  },
  {
    id: "la2",
    label: "Life Assured 2",
    profileImage: undefined,
    imageRecords: [
      {
        imageType: "Live photograph",
        document: "Applicant selfie",
        faceMatchScore: "97.1%",
        imageQuality: "Good",
        remarks: "Face matched successfully",
      },
      {
        imageType: "Identity proof",
        document: "Aadhaar photograph",
        faceMatchScore: "95.4%",
        imageQuality: "Good",
        remarks: "Image is clear and readable",
      },
    ],
    personalFields: [
      { label: "Applicant Name", value: "Priya Sharma" },
      { label: "Date of Birth", value: formatDate("1992-04-15T00:00") },
      { label: "Age", value: "33 Years" },
      { label: "Gender", value: "Female" },
      { label: "Marital Status", value: "Married" },
      { label: "Nationality", value: "India" },
      { label: "Country of Residence", value: "India" },
      { label: "Education", value: "Post Graduate" },
      { label: "Resident Status", value: "IND" },
      { label: "Designation", value: "Analyst" },
      { label: "Disabled", value: "-" },
      { label: "UDID Number", value: "-" },
      { label: "City of Resident", value: "Pune" },
      { label: "State of Resident", value: "Maharashtra" },
    ],
    kycFields: [
      { label: "PRAN Number", value: "-" },
      { label: "PRAN Number Verification", value: "-" },
      { label: "PAN Number", value: mask("BBBBB2222B") },
      { label: "PAN Flag", value: "Verified" },
      { label: "PAN Aadhar Seeding Status", value: "Y" },
      { label: "Identity Proof Type", value: "Aadhaar" },
      { label: "Identity Proof Expiry Date", value: formatDate("2099-12-31T00:00") },
      { label: "Identity Proof Number", value: mask("BBBBB2222B") },
      { label: "Address Proof", value: "Aadhaar" },
      { label: "Income Proof", value: "Form 16" },
      { label: "CKYC Number", value: "NA" },
      { label: "PEP", value: "No" },
      { label: "Criminal Proceedings", value: "No" },
    ],
    communicationAddress: [
      { label: "Address Line 1", value: "Flat 304, Sunrise Apts" },
      { label: "Address Line 2", value: "FC Road" },
      { label: "Address Line 3", value: "-" },
      { label: "Landmark", value: "Near Deccan Gymkhana" },
      { label: "City", value: "Pune" },
      { label: "State", value: "Maharashtra" },
      { label: "Country", value: "India" },
      { label: "Pincode", value: "411004" },
    ],
    permanentAddress: [
      { label: "Address Line 1", value: "12, Green Colony" },
      { label: "Address Line 2", value: "Aundh" },
      { label: "Address Line 3", value: "-" },
      { label: "Landmark", value: "-" },
      { label: "City", value: "Pune" },
      { label: "State", value: "Maharashtra" },
      { label: "Country", value: "India" },
      { label: "Pincode", value: "411007" },
    ],
    contactDetails: [
      { label: "Mobile No.", value: "9123456780" },
      { label: "Email ID", value: "priya.sharma@email.com" },
      { label: "Alternate Mobile", value: "-" },
      { label: "STD/ISD Code", value: "-" },
      { label: "Landline Number", value: "-" },
      { label: "Email Pref", value: "Y" },
      { label: "SMS Pref", value: "N" },
      { label: "Negative Pincode", value: "-" },
    ],
    productFields: [
      { label: "Product Code", value: "E36" },
      { label: "Product Type", value: "-" },
      { label: "Fund Source", value: "-" },
      { label: "Partner Type", value: "-" },
    ],
    nominees: [
      {
        nomineeName: "Rahul Sharma",
        nomineeDOB: formatDate("1989-07-20T00:00"),
        gender: "Male",
        relationship: "Spouse",
        sharePercentage: 100,
        isLASame: "No",
        relationShipWithJL: "-",
        laFlag: "-",
      },
    ],
    appointees: [],
    lifestyleFields: [
      { label: "Height", value: "158.0" },
      { label: "Weight", value: "55" },
      { label: "BMI", value: "22.0" },
      { label: "Smoker", value: "No" },
      { label: "Alcohol", value: "No" },
      { label: "Any Narcotics Question ticked Positive", value: "No" },
      { label: "Any Medical Question ticked Positive", value: "No" },
      { label: "Is Occupation Hazardous?", value: "No" },
      { label: "Illness Impairment", value: "-" },
      { label: "Is Family Medical History? if yes please provide details", value: "-" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export type ApplicantProfileDialogProps = Partial<LifeAssuredProps> & {
  open: boolean;
  onClose: () => void;
};

export function ApplicantProfile({
  open,
  onClose,
  applicants = STATIC_APPLICANTS,
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
