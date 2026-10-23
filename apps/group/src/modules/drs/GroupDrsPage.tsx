import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AppButton } from "@insurance-poc/ui";
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

function DetailItem({ label, value }: { label: string; value: string }) {
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

    fetchGroupDrsRecord(applicationNo)
      .then((record) => {
        if (!active) return;
        setStatus(record ? { kind: "ready", record } : { kind: "not-found" });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setStatus({
          kind: "error",
          message:
            reason instanceof Error
              ? reason.message
              : "Unable to load Group DRS.",
        });
      });

    return () => {
      active = false;
    };
  }, [applicationNo, reloadKey]);

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Group DRS
      </Typography>
        <Stack spacing={2}>
          {status.kind === "loading" ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {status.kind === "missing-id" ? (
            <Alert severity="info">
              No application was selected. Open a task from the Group Inbox.
            </Alert>
          ) : null}

          {status.kind === "not-found" ? (
            <Alert severity="warning">
              No Group DRS record was found for application {applicationNo}.
            </Alert>
          ) : null}

          {status.kind === "error" ? (
            <Alert
              severity="error"
              action={
                <AppButton
                  size="small"
                  onClick={() => setReloadKey((value) => value + 1)}
                >
                  Retry
                </AppButton>
              }
            >
              {status.message}
            </Alert>
          ) : null}

          {status.kind === "ready" ? (
            <Paper sx={{ p: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Applied sum assured
              </Typography>
              <Typography variant="h4" component="p" sx={{ mb: 2 }}>
                {formatIndianCurrency(status.record.appliedSa)}
              </Typography>
              <DetailItem
                label="Application number"
                value={status.record.applicationNo}
              />
              <DetailItem label="Task ID" value={status.record.taskId} />
              <DetailItem label="Customer" value={status.record.customerName} />
              <DetailItem label="Product" value={status.record.productName} />
              <DetailItem
                label="Business type"
                value={status.record.businessType}
              />
              <DetailItem label="Status" value={status.record.status ?? "-"} />
              <DetailItem
                label="Annual premium"
                value={formatIndianCurrency(status.record.annualPremium)}
              />
              <DetailItem
                label="Policy term"
                value={
                  status.record.policyTerm != null
                    ? `${status.record.policyTerm} years`
                    : "-"
                }
              />
              <DetailItem
                label="Premium paying term"
                value={
                  status.record.premiumPayingTerm != null
                    ? `${status.record.premiumPayingTerm} years`
                    : "-"
                }
              />
            </Paper>
          ) : null}

          <Stack direction="row" spacing={1}>
            <AppButton
              variant="outlined"
              onClick={() => navigate("/inbox")}
            >
              Back to Inbox
            </AppButton>
          </Stack>
        </Stack>
    </Container>
  );
}
