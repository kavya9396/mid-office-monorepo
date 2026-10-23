import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { AppButton } from "@insurance-poc/ui";
import { formatIndianCurrency } from "@insurance-poc/utils";
import {
  fetchGroupInbox,
  type InboxData,
  type InboxTask,
} from "../../services/inboxService";

function formatCategory(key: string): string {
  return key.replaceAll("_", " ");
}

function businessChipColor(
  businessType: string | undefined,
): "primary" | "warning" | "default" {
  if (businessType === "RETAIL") return "primary";
  if (businessType === "GROUP") return "warning";
  return "default";
}

export function GroupInboxPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<InboxData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navError, setNavError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchGroupInbox()
      .then((inbox) => {
        if (!active) return;
        setData(inbox);
        const categories = Object.keys(inbox.poolData);
        setSelectedCategory((current) =>
          current && categories.includes(current)
            ? current
            : (categories[0] ?? null),
        );
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error ? reason.message : "Unable to load the inbox.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function openTask(task: InboxTask) {
    const applicationNo = task.applicationNo.trim();

    if (!applicationNo) {
      setNavError("This task is missing an application number.");
      return;
    }

    if (task.businessType !== "GROUP") {
      setNavError(
        `Cannot open ${applicationNo} in the Group application.`,
      );
      return;
    }

    setNavError(null);
    const query = new URLSearchParams({ applicationNo }).toString();
    navigate(`/drs?${query}`);
  }

  const categories = data ? Object.keys(data.poolData) : [];
  const tasks =
    data && selectedCategory ? (data.poolData[selectedCategory] ?? []) : [];

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Group Inbox
      </Typography>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : null}

        {error ? (
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
            {error}
          </Alert>
        ) : null}

        {!loading && !error && data && categories.length === 0 ? (
          <Typography>No task categories are available.</Typography>
        ) : null}

        {!loading && !error && data && categories.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
              gap: 2,
              alignItems: "start",
            }}
          >
            <Paper component="nav" aria-label="Task categories">
              <List disablePadding>
                {categories.map((category) => {
                  const count = data.poolData[category]?.length ?? 0;
                  return (
                    <ListItemButton
                      key={category}
                      selected={category === selectedCategory}
                      onClick={() => {
                        setSelectedCategory(category);
                        setNavError(null);
                      }}
                    >
                      <ListItemText
                        primary={formatCategory(category)}
                        secondary={`${count} ${count === 1 ? "task" : "tasks"}`}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Paper>

            <Box>
              {navError ? (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setNavError(null)}
                >
                  {navError}
                </Alert>
              ) : null}

              {tasks.length === 0 ? (
                <Typography>No tasks in this category.</Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table size="small" aria-label="Tasks">
                    <TableHead>
                      <TableRow>
                        <TableCell>Application</TableCell>
                        <TableCell>Task</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Business type</TableCell>
                        <TableCell align="right">Applied SA</TableCell>
                        <TableCell align="right">Annual premium</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.taskId} hover>
                          <TableCell>{task.applicationNo}</TableCell>
                          <TableCell>{task.taskId}</TableCell>
                          <TableCell>{task.customerName}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={task.businessType?.trim() || "Missing"}
                              color={businessChipColor(task.businessType)}
                            />
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {formatIndianCurrency(task.appliedSa)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            {formatIndianCurrency(task.annualPremium)}
                          </TableCell>
                          <TableCell>{task.status ?? "-"}</TableCell>
                          <TableCell align="right">
                            <AppButton
                              size="small"
                              onClick={() => openTask(task)}
                            >
                              Open
                            </AppButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        ) : null}
    </Container>
  );
}
