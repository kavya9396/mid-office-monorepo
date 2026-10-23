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
import { formatIndianCurrency } from "@insurance-poc/utils";
import {
  fetchGroupDrsRecord,
  type DrsRecord,
} from "../../services/drsService";

type Status =
  | { kind: "missing-id" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "not-found" }
  | { kind: "ready"; record: DrsRecord };

function readErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  return fallback;
}

function formatYears(years: number | undefined): string {
  if (years === undefined) {
    return "-";
  }
  return `${years} years`;
}

function DetailItem({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: 600, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}

function RecordDetails({ record }: Readonly<{ record: DrsRecord }>) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="overline" color="text.secondary">
        Applied sum assured
      </Typography>
      <Typography variant="h4" component="p" sx={{ mb: 2 }}>
        {formatIndianCurrency(record.appliedSa)}
      </Typography>
      <DetailItem label="Application number" value={record.applicationNo} />
      <DetailItem label="Task ID" value={record.taskId} />
      <DetailItem label="Customer" value={record.customerName} />
      <DetailItem label="Product" value={record.productName} />
      <DetailItem label="Business type" value={record.businessType} />
      <DetailItem label="Status" value={record.status ?? "-"} />
      <DetailItem
        label="Annual premium"
        value={formatIndianCurrency(record.annualPremium)}
      />
      <DetailItem label="Policy term" value={formatYears(record.policyTerm)} />
      <DetailItem
        label="Premium paying term"
        value={formatYears(record.premiumPayingTerm)}
      />
    </Paper>
  );
}

function DrsBody({
  status,
  applicationNo,
  onRetry,
}: Readonly<{
  status: Status;
  applicationNo: string;
  onRetry: () => void;
}>) {
  switch (status.kind) {
    case "loading":
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      );
    case "missing-id":
      return (
        <Alert severity="info">
          No application was selected. Open a task from the Group Inbox.
        </Alert>
      );
    case "not-found":
      return (
        <Alert severity="warning">
          No Group DRS record was found for application {applicationNo}.
        </Alert>
      );
    case "error":
      return (
        <Alert
          severity="error"
          action={
            <CustomButton size="small" onClick={onRetry}>
              Retry
            </CustomButton>
          }
        >
          {status.message}
        </Alert>
      );
    case "ready":
      return <RecordDetails record={status.record} />;
  }
}

export function GroupDrsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<Status>(
    applicationNo ? { kind: "loading" } : { kind: "missing-id" },
  );

  useEffect(() => {
    if (!applicationNo) {
      setStatus({ kind: "missing-id" });
      return;
    }

    let active = true;
    setStatus({ kind: "loading" });

    async function loadRecord(): Promise<void> {
      try {
        const record = await fetchGroupDrsRecord(applicationNo);
        if (!active) {
          return;
        }
        setStatus(record ? { kind: "ready", record } : { kind: "not-found" });
      } catch (reason: unknown) {
        if (!active) {
          return;
        }
        setStatus({
          kind: "error",
          message: readErrorMessage(reason, "Unable to load Group DRS."),
        });
      }
    }

    void loadRecord();

    return () => {
      active = false;
    };
  }, [applicationNo, reloadKey]);

  const retry = () => setReloadKey((value) => value + 1);

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Group DRS
      </Typography>
      <Stack spacing={2}>
        <DrsBody
          status={status}
          applicationNo={applicationNo}
          onRetry={retry}
        />
        <Stack direction="row" spacing={1}>
          <CustomButton variant="outlined" onClick={() => navigate("/inbox")}>
            Back to Inbox
          </CustomButton>
        </Stack>
      </Stack>
    </Container>
  );
}
