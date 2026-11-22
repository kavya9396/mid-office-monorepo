import dayjs from "dayjs";
import { z } from "zod";
import { Box, Typography } from "@mui/material";
import { Calendar, CustomTextField } from "@insurance-poc/ui";
import { requiredMessage } from "./editApplicant.messages";
import { requiredFormat } from "./fieldFormat";

const required = (label: string) => z.string().trim().min(1, requiredMessage(label));

// All Base & Loan fields are mandatory
export const loanSchema = z.object({
  baseSumAssured: requiredFormat("Base Sum Assured", "numeric"),
  loanAmount: requiredFormat("Loan Amount", "numeric"),
  /** YYYY-MM-DD */
  loanDisbursementDate: required("Loan Disbursement Date"),
  loanShare: requiredFormat("Loan Share", "numeric"),
  loanTerm: requiredFormat("Loan Term", "numeric"),
  policyTerm: requiredFormat("Policy Term", "numeric"),
  masterCode: requiredFormat("Master Code", "alphanumeric"),
  loanAccountNumber: requiredFormat("Loan Account Number", "alphanumeric"),
});

export type LoanEditValues = z.infer<typeof loanSchema>;

type LoanField = keyof LoanEditValues;

export type LoanDetailsProps = {
  values: LoanEditValues;
  onChange: (values: LoanEditValues) => void;
  errors?: Partial<Record<LoanField, { message?: string }>>;
};

export const EMPTY_LOAN: LoanEditValues = {
  baseSumAssured: "",
  loanAmount: "",
  loanDisbursementDate: "",
  loanShare: "",
  loanTerm: "",
  policyTerm: "",
  masterCode: "",
  loanAccountNumber: "",
};

// Same order and labels as the prototype's "Base & Loan Details" grid
const LOAN_FIELDS: { name: LoanField; label: string; type?: "date" }[] = [
  { name: "baseSumAssured", label: "Base Sum Assured" },
  { name: "loanAmount", label: "Loan Amount" },
  { name: "loanDisbursementDate", label: "Loan Disbursement Date", type: "date" },
  { name: "loanShare", label: "Loan Share" },
  { name: "loanTerm", label: "Loan Term" },
  { name: "policyTerm", label: "Policy Term" },
  { name: "masterCode", label: "Master Code" },
  { name: "loanAccountNumber", label: "Loan Account Number" },
];

export function LoanDetails({ values, onChange, errors }: Readonly<LoanDetailsProps>) {
  const change = (field: LoanField, value: string) => onChange({ ...values, [field]: value });

  return (
    <Box>
      <Typography sx={{ color: "#444", fontSize: "14px", fontWeight: 700, mb: 1 }}>Base & Loan Details</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 1 }}>
        {LOAN_FIELDS.map((field) =>
          field.type === "date" ? (
            <Calendar
              key={field.name}
              label={field.label}
              value={values[field.name] ? dayjs(values[field.name]) : null}
              onChange={(date) => change(field.name, date?.isValid() ? date.format("YYYY-MM-DD") : "")}
              disableTodayAndFuture={false}
              maxDate={dayjs()}
              error={!!errors?.[field.name]}
              helperText={errors?.[field.name]?.message}
            />
          ) : (
            <CustomTextField
              key={field.name}
              labelText={field.label}
              value={values[field.name]}
              onChange={(e) => change(field.name, e.target.value)}
              error={!!errors?.[field.name]}
              helperText={errors?.[field.name]?.message}
              fullWidth
            />
          ),
        )}
      </Box>
    </Box>
  );
}

export default LoanDetails;
