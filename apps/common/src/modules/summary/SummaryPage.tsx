import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CustomButton } from "@insurance-poc/ui";
import { formatIndianCurrency } from "@insurance-poc/util";
import {
  fetchSummaryRecord,
  type SummaryBusinessType,
  type SummaryRecord,
} from "../../services/summaryService";

export function SummaryPage({
  businessType,
}: {
  businessType: SummaryBusinessType;
}) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const [record, setRecord] = useState<SummaryRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(applicationNo));
  const [error, setError] = useState<string | null>(null);
  const applicationLabel = businessType === "RETAIL" ? "Retail" : "Group";

  useEffect(() => {
    if (!applicationNo) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchSummaryRecord(businessType, applicationNo)
      .then((nextRecord) => {
        if (!active) return;
        setRecord(nextRecord ?? null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : `Unable to load the ${applicationLabel} summary.`,
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applicationLabel, applicationNo, businessType]);

  const search = params.toString();

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        {applicationLabel} Summary
      </Typography>
        <Stack spacing={2}>
          <Alert severity="info">
            This summary screen is owned by Common and rendered inside the{" "}
            {applicationLabel} application. Page-load id{" "}
            {window.__pocAppBoot ?? "unavailable"}.
          </Alert>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}
          {!loading && !applicationNo ? (
            <Alert severity="warning">
              No application was selected. Open a task from the{" "}
              {applicationLabel} Inbox.
            </Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!loading && applicationNo && !error && !record ? (
            <Alert severity="warning">
              No {applicationLabel} record was found for application{" "}
              {applicationNo}.
            </Alert>
          ) : null}
          {record ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Annual premium
              </Typography>
              <Typography variant="h4" component="p" sx={{ mb: 2 }}>
                {formatIndianCurrency(record.annualPremium)}
              </Typography>
              <Typography>
                {record.customerName} · {record.productName}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Applied sum assured {formatIndianCurrency(record.appliedSa)}
              </Typography>
            </Paper>
          ) : null}
          <Stack direction="row" spacing={1}>
            <CustomButton
              onClick={() => navigate(search ? `/drs?${search}` : "/drs")}
            >
              Back to DRS
            </CustomButton>
            <CustomButton
              variant="outlined"
              onClick={() => navigate("/inbox")}
            >
              Back to Inbox
            </CustomButton>
          </Stack>
        </Stack>
    </Container>
  );
}
