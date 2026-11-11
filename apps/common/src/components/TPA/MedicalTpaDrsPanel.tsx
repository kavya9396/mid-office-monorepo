import { useTheme } from "@mui/material/styles";
import { CustomBox, CustomTypography } from "@insurance-poc/ui";
import { TpaApiFailureStrip } from "./TpaApiFailureStrip";
import { TpaDetailsGrid } from "./TpaDetailsGrid";
import { TpaServiceProviderForm } from "./TpaServiceProviderForm";
import type { MedicalTpaDrsRecord, MedicalTpaSubmitPayload } from "./types";

export type MedicalTpaDrsPanelProps = {
  record: MedicalTpaDrsRecord;
  readOnly?: boolean;
  submitting?: boolean;
  onSubmit?: (payload: MedicalTpaSubmitPayload) => void | Promise<void>;
  taskId?: string;
  instanceId?: string;
};

export function MedicalTpaDrsPanel({
  record,
  readOnly = false,
  submitting = false,
  onSubmit,
  taskId,
  instanceId,
}: Readonly<MedicalTpaDrsPanelProps>) {
  const theme = useTheme();

  return (
    <CustomBox
      sx={{
        mx: { xs: 0.5, sm: 1.75 },
        my: { xs: 1.25, md: 0 },
        flex: { md: 1 },
        height: { xs: "auto", md: "100%" },
        maxHeight: { md: "100%" },
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #D8D8D8",
        borderRadius: "10px",
        boxShadow: "0 5px 18px rgba(0, 0, 0, .06)",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      <CustomBox
        sx={{
          height: 44,
          flex: "0 0 44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          bgcolor: theme.palette.primary.main,
          color: "#fff",
        }}
      >
        <CustomTypography
          component="h1"
          sx={{ m: 0, fontSize: "16px", fontWeight: 700, letterSpacing: "0.1px" }}
        >
          Application No: {record.applicationNo}
        </CustomTypography>
      </CustomBox>

      <CustomBox
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateRows: "auto minmax(0, 1fr)",
          overflow: "hidden",
          borderBottom: "1px solid #E3E3E3",
        }}
      >
        <CustomBox
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            flexWrap: "wrap",
            gap: 1.5,
            px: 1.5,
            py: 0.75,
            minHeight: 34,
            bgcolor: "#fff1e6",
            borderBottom: "1px solid #F1D4BF",
          }}
        >
          <CustomTypography
            component="span"
            sx={{ fontSize: "12.5px", fontWeight: 700, color: "#263238" }}
          >
            Medical TPA Details
          </CustomTypography>
          <TpaApiFailureStrip
            reason={record.failureReason}
            detail={record.failureDetail}
          />
        </CustomBox>
        <TpaDetailsGrid details={record.details} />
      </CustomBox>

      <CustomBox sx={{ flex: "0 0 auto", minHeight: 0 }}>
        <TpaServiceProviderForm
          serviceProviderOptions={record.serviceProviderOptions}
          defaultServiceProvider={record.defaultServiceProvider}
          reasonOptions={record.reasonOptions}
          readOnly={readOnly}
          submitting={submitting}
          onSubmit={
            onSubmit
              ? (fields) => {
                  void onSubmit({
                    applicationNo: record.applicationNo,
                    taskId,
                    instanceId,
                    ...fields,
                  });
                }
              : undefined
          }
        />
      </CustomBox>
    </CustomBox>
  );
}
