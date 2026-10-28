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
import { CustomButton } from "@insurance-poc/ui";
import { formatIndianCurrency } from "@insurance-poc/utils";
import {
  fetchGroupInbox,
  type InboxData,
  type InboxTask,
} from "../../services/inboxService";

type ChipColor = "primary" | "warning" | "default";

const DRS_PATH = "/drs";

function formatCategory(key: string): string {
  return key.replaceAll("_", " ");
}

function businessChipColor(businessType: string | undefined): ChipColor {
  if (businessType === "RETAIL") {
    return "primary";
  }
  if (businessType === "GROUP") {
    return "warning";
  }
  return "default";
}

function businessTypeLabel(businessType: string | undefined): string {
  const label = businessType?.trim() ?? "";
  return label.length > 0 ? label : "Missing";
}

function taskCountLabel(count: number): string {
  return count === 1 ? "1 task" : `${count} tasks`;
}

function readErrorMessage(reason: unknown, fallback: string): string {
  if (reason instanceof Error) {
    return reason.message;
  }
  return fallback;
}

function keepSelectedCategory(
  current: string | null,
  categories: string[],
): string | null {
  if (current && categories.includes(current)) {
    return current;
  }
  return categories[0] ?? null;
}

function tasksForCategory(
  data: InboxData | null,
  selectedCategory: string | null,
): InboxTask[] {
  if (!data || !selectedCategory) {
    return [];
  }
  return data.poolData[selectedCategory] ?? [];
}

function LoadErrorAlert({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <Alert
      severity="error"
      action={
        <CustomButton size="small" onClick={onRetry}>
          Retry
        </CustomButton>
      }
    >
      {message}
    </Alert>
  );
}

function CategoryList({
  categories,
  poolData,
  selectedCategory,
  onSelect,
}: Readonly<{
  categories: string[];
  poolData: InboxData["poolData"];
  selectedCategory: string | null;
  onSelect: (category: string) => void;
}>) {
  return (
    <Paper component="nav" aria-label="Task categories">
      <List disablePadding>
        {categories.map((category) => {
          const count = poolData[category]?.length ?? 0;
          return (
            <ListItemButton
              key={category}
              selected={category === selectedCategory}
              onClick={() => onSelect(category)}
            >
              <ListItemText
                primary={formatCategory(category)}
                secondary={taskCountLabel(count)}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}

function TaskTable({
  tasks,
  onOpen,
}: Readonly<{ tasks: InboxTask[]; onOpen: (task: InboxTask) => void }>) {
  if (tasks.length === 0) {
    return <Typography>No tasks in this category.</Typography>;
  }

  return (
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
                  label={businessTypeLabel(task.businessType)}
                  color={businessChipColor(task.businessType)}
                />
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatIndianCurrency(task.appliedSa)}
              </TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {formatIndianCurrency(task.annualPremium)}
              </TableCell>
              <TableCell>{task.status ?? "-"}</TableCell>
              <TableCell align="right">
                <CustomButton size="small" onClick={() => onOpen(task)}>
                  Open
                </CustomButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
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

    async function loadInbox(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const inbox = await fetchGroupInbox();
        if (!active) {
          return;
        }
        setData(inbox);
        const categories = Object.keys(inbox.poolData);
        setSelectedCategory((current) =>
          keepSelectedCategory(current, categories),
        );
      } catch (reason: unknown) {
        if (!active) {
          return;
        }
        setError(readErrorMessage(reason, "Unable to load the inbox."));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInbox();

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
      setNavError(`Cannot open ${applicationNo} in the Group application.`);
      return;
    }

    setNavError(null);
    const query = new URLSearchParams({ applicationNo });
    if (selectedCategory) {
      query.set("role", formatCategory(selectedCategory));
    }
    navigate(`${DRS_PATH}?${query.toString()}`);
  }

  const categories = data ? Object.keys(data.poolData) : [];
  const tasks = tasksForCategory(data, selectedCategory);
  const idle = !loading && error === null && data !== null;
  const retry = () => setReloadKey((value) => value + 1);

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

      {error ? <LoadErrorAlert message={error} onRetry={retry} /> : null}

      {idle && categories.length === 0 ? (
        <Typography>No task categories are available.</Typography>
      ) : null}

      {idle && categories.length > 0 && data ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "260px 1fr" },
            gap: 2,
            alignItems: "start",
          }}
        >
          <CategoryList
            categories={categories}
            poolData={data.poolData}
            selectedCategory={selectedCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              setNavError(null);
            }}
          />

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
            <TaskTable tasks={tasks} onOpen={openTask} />
          </Box>
        </Box>
      ) : null}
    </Container>
  );
}
