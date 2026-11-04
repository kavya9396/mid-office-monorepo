export type TpaDetailGroup = {
  title: string;
  keys: string[];
};

export const TPA_LABEL_OVERRIDES: Record<string, string> = {
  Sr_no: "Sr No",
  Application_no: "Application No",
  Reschedule_Flag: "Reschedule Flag",
  Case_Type: "Case Type",
  Request_Date: "Request Date",
  Request_time: "Request Time",
  Proposal_Acceptance_Date: "Proposal Acceptance Date",
  New_Business_Servicing: "New Business / Servicing",
  Policy_status: "Policy Status",
  Product_code: "Product Code",
  Product_type: "Product Type",
  HNI_SHNI: "HNI / SHNI",
  Email_ID: "Email ID",
  DC_Name: "DC Name",
  DC_City: "DC City",
  DC_address: "DC Address",
  NRI: "NRI",
  DOB: "DOB",
  LONGITUDE: "Longitude",
  LATITUDE: "Latitude",
  PLACEID: "Place ID",
  UOMCODE: "UOM Code",
  FSC_CODE: "FSC Code",
  FSC_MOBILE: "FSC Mobile",
  FSC_EMAIL: "FSC Email",
  FSC_CHANNEL: "FSC Channel",
  CHANNEL_NAME: "Channel Name",
  Medical_TESTID_Send: "Medical Test ID Send",
  testsenddate: "Test Send Date",
  lmssenddate: "LMS Send Date",
  lmsFlag: "LMS Flag",
  lmsremark: "LMS Remark",
  updateWebseviceFlag: "Update Web Service Flag",
  isAgentOrFSC: "Is Agent or FSC",
  fsc_name: "FSC Name",
  patner_type: "Partner Type",
  whatsapp_flag: "WhatsApp Flag",
  Agnet_Mobile_no: "Agent Mobile No",
};

export const TPA_DETAIL_GROUPS: TpaDetailGroup[] = [
  {
    title: "Case & Request",
    keys: [
      "Sr_no",
      "Application_no",
      "Case_Type",
      "Reschedule_Flag",
      "Request_Date",
      "Request_time",
      "Proposal_Acceptance_Date",
      "New_Business_Servicing",
    ],
  },
  {
    title: "Product & Policy",
    keys: [
      "Policy_status",
      "Product_code",
      "Product_type",
      "HNI_SHNI",
      "Premium",
      "Sum_Assured",
      "Annual_Income",
      "NRI",
      "UOMCODE",
      "patner_type",
    ],
  },
  {
    title: "Customer & Contact",
    keys: [
      "Proposer_Life_Assured_Name",
      "Proposer_Life_Assured_contact_Number",
      "Proposer_Life_Assured_Alternate_No",
      "Email_ID",
      "Gender",
      "First_Name",
      "Last_Name",
      "DOB",
      "Life_Assured_Home_Address",
      "Life_Assured_Home_City",
      "Life_Assured_Home_State",
      "Life_Assured_Home_Pin_code",
      "Address_Source",
      "LONGITUDE",
      "LATITUDE",
      "PLACEID",
    ],
  },
  {
    title: "Medical & Appointment",
    keys: [
      "Individual_test_name",
      "Additional_Medical_Flag",
      "Additional_Test_triggered",
      "Non_medical_documents_requirement",
      "Customer_appointment_date",
      "Customer_appointment_time",
      "Home_Visit_Eligible_Non_eligible",
      "Repeat_Medical_Flag",
      "Repeat_Test_triggered",
      "Videography_eligible",
      "whatsapp_flag",
    ],
  },
  {
    title: "Provider & Diagnostic Centre",
    keys: [
      "Service_Provider_Name",
      "DC_Name",
      "DC_City",
      "DC_address",
      "Payment_received_date",
    ],
  },
  {
    title: "Channel & Branch",
    keys: [
      "Channel",
      "Channel_contact_no",
      "Channel_Email_ID",
      "CHANNEL_NAME",
      "Branch_code",
    ],
  },
  {
    title: "Agent & FSC",
    keys: [
      "Agent_name",
      "Agent_email_ID",
      "Agnet_Mobile_no",
      "Agent_Code",
      "FSC_CODE",
      "FSC_MOBILE",
      "FSC_EMAIL",
      "fsc_name",
      "FSC_CHANNEL",
      "isAgentOrFSC",
    ],
  },
  {
    title: "System & Tracking",
    keys: [
      "Created_Date",
      "testsenddate",
      "Flag",
      "remark",
      "Medical_TESTID_Send",
      "lmssenddate",
      "lmsFlag",
      "lmsremark",
      "updateWebseviceFlag",
    ],
  },
];

export function tpaFieldLabel(key: string): string {
  if (TPA_LABEL_OVERRIDES[key]) {
    return TPA_LABEL_OVERRIDES[key];
  }
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Ordered keys for the read-only grid (prototype grouping + any extra fields). */
export function orderedTpaDetailKeys(details: Record<string, string>): string[] {
  const grouped = new Set(TPA_DETAIL_GROUPS.flatMap((group) => group.keys));
  const ungrouped = Object.keys(details).filter((key) => !grouped.has(key));
  const groups =
    ungrouped.length > 0
      ? [...TPA_DETAIL_GROUPS, { title: "Other", keys: ungrouped }]
      : TPA_DETAIL_GROUPS;
  return groups.flatMap((group) => group.keys);
}
