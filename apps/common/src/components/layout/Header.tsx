import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { assignUrl, commonPaths } from "@insurance-poc/routes";
import {
  CustomTooltip,
  KeyDownArrowIcon,
  KeyLeftArrowIcon,
  KeyRightArrowIcon,
  KeyUpArrowIcon,
  LogoutIcon,
  TimerPauseIcon,
  UserProfileIcon,
} from "@insurance-poc/ui";
import { clearToken, getSessionUser } from "@insurance-poc/utils";
import Logo from "../../assets/ICICI_Logo.svg";
import { BreakTime } from "./BreakTime";

const HEADER_HEIGHT = 57;
const FALLBACK_SESSION_TIMEOUT_MINUTES = 15;
const MASTER_DATA_STORAGE_KEY = "masterData";
const HIDDEN_TASK_PATHS = new Set(["/login", "/inbox"]);

type MiscMaster = {
  type?: unknown;
  value?: unknown;
  description?: unknown;
  isActive?: unknown;
};

export type HeaderProps = {
  inboxPath?: string;
  drsPath?: string;
  onBackToInbox?: () => void;
  onBackToDrs?: () => void;
  onBack?: () => void;
  backPath?: string;
  role?: string;
  applicationNo?: string;
};

const menuActionSx = {
  width: "100%",
  px: 2,
  py: 1.25,
  border: 0,
  bgcolor: "transparent",
  color: "#323232",
  cursor: "pointer",
  font: "inherit",
  textAlign: "left",
  "&:hover": {
    backgroundColor: "#FFF3EE",
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readMiscMasters(value: unknown): MiscMaster[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord).map((item) => ({
    type: item.type,
    value: item.value,
    description: item.description,
    isActive: item.isActive,
  }));
}

function readStoredMiscMasters(storedMasters: string): MiscMaster[] {
  const parsedMasters: unknown = JSON.parse(storedMasters);
  if (!isRecord(parsedMasters)) {
    return [];
  }

  if (Array.isArray(parsedMasters.misc)) {
    return readMiscMasters(parsedMasters.misc);
  }

  const data = parsedMasters.data;
  if (isRecord(data) && Array.isArray(data.misc)) {
    return readMiscMasters(data.misc);
  }

  return [];
}

function masterCode(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return value.trim().toUpperCase();
}

function isActiveSessionTimeout(item: MiscMaster): boolean {
  const type = masterCode(item.type, "");
  const active = masterCode(item.isActive, "Y");
  return type === "SES_TIMEOUT" && active === "Y";
}

function timeoutMsFromMaster(item: MiscMaster | undefined): number | null {
  const timeoutMinutes = Number(item?.value ?? item?.description);
  if (!Number.isFinite(timeoutMinutes) || timeoutMinutes <= 0) {
    return null;
  }
  return timeoutMinutes * 60 * 1000;
}

function getSessionTimeoutMs(): number {
  const fallback = FALLBACK_SESSION_TIMEOUT_MINUTES * 60 * 1000;

  try {
    const storedMasters = sessionStorage.getItem(MASTER_DATA_STORAGE_KEY);
    if (!storedMasters) {
      return fallback;
    }

    const timeoutMaster = readStoredMiscMasters(storedMasters).find(
      isActiveSessionTimeout,
    );
    return timeoutMsFromMaster(timeoutMaster) ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatSessionTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function normalizePath(pathname: string): string {
  let end = pathname.length;
  while (end > 0 && pathname.charAt(end - 1) === "/") {
    end -= 1;
  }
  const stripped = pathname.slice(0, end);
  return stripped.length > 0 ? stripped : "/";
}

function presentText(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function useCurrentTime(): string {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(formatDateTime(new Date()));
    };

    const initialUpdate = window.setTimeout(updateCurrentTime, 0);
    const interval = window.setInterval(updateCurrentTime, 1000);

    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, []);

  return currentTime;
}

function useSessionCountdown(): number | null {
  const sessionTimeoutMsRef = useRef<number | null>(null);
  const sessionDeadlineRef = useRef<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const resetSessionTimeout = useCallback(() => {
    const latestSessionTimeoutMs = getSessionTimeoutMs();
    sessionTimeoutMsRef.current = latestSessionTimeoutMs;
    sessionDeadlineRef.current = Date.now() + latestSessionTimeoutMs;
    setRemainingMs(latestSessionTimeoutMs);
  }, []);

  useEffect(() => {
    const initialSessionTimer = window.setTimeout(resetSessionTimeout, 0);
    const activityEvents: Array<keyof WindowEventMap> = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetSessionTimeout, { passive: true });
    });

    const interval = window.setInterval(() => {
      const latestSessionTimeoutMs = getSessionTimeoutMs();
      if (latestSessionTimeoutMs !== sessionTimeoutMsRef.current) {
        sessionTimeoutMsRef.current = latestSessionTimeoutMs;
        sessionDeadlineRef.current = Date.now() + latestSessionTimeoutMs;
      }

      const sessionDeadline = sessionDeadlineRef.current;
      if (sessionDeadline === null) {
        return;
      }

      const nextRemainingMs = Math.max(0, sessionDeadline - Date.now());
      setRemainingMs(nextRemainingMs);

      if (nextRemainingMs === 0) {
        window.clearInterval(interval);
        clearToken();
        assignUrl(commonPaths.login);
      }
    }, 1000);

    return () => {
      window.clearTimeout(initialSessionTimer);
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetSessionTimeout);
      });
    };
  }, [resetSessionTimeout]);

  return remainingMs;
}

function TaskIdentity({
  role,
  applicationNo,
}: Readonly<{ role?: string; applicationNo?: string }>) {
  if (!role && !applicationNo) {
    return <Box sx={{ flex: 1 }} />;
  }

  const roleText = role ? (
    <Typography
      noWrap
      component="span"
      sx={{
        color: "#FFFFFF",
        fontSize: { xs: 13, sm: 15 },
        fontWeight: 700,
        letterSpacing: 0.2,
        lineHeight: 1.2,
        minWidth: 0,
        flexShrink: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {role}
    </Typography>
  ) : null;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 1,
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: { xs: 0.75, sm: 1.25 },
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        {role ? (
          <CustomTooltip title={role} arrow placement="bottom">
            <Box component="span" sx={{ minWidth: 0, display: "inline-flex" }}>
              {roleText}
            </Box>
          </CustomTooltip>
        ) : null}

        {role && applicationNo ? (
          <Typography
            component="span"
            sx={{
              color: "rgba(255, 255, 255, 0.65)",
              fontSize: { xs: 14, sm: 16 },
              fontWeight: 400,
              flexShrink: 0,
              userSelect: "none",
              lineHeight: 1,
            }}
          >
            |
          </Typography>
        ) : null}

        {applicationNo ? (
          <Typography
            noWrap
            component="span"
            sx={{
              color: "#FFFFFF",
              fontSize: { xs: 13, sm: 15 },
              fontWeight: 700,
              letterSpacing: 0.3,
              flexShrink: 0,
              lineHeight: 1.2,
            }}
          >
            {/* <Box
              component="span"
              sx={{
                color: "rgba(255, 255, 255, 0.85)",
                fontWeight: 600,
                fontSize: { xs: 12, sm: 13.5 },
                mr: 0.5,
              }}
            >
              App No:
            </Box> */}
            {applicationNo}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

function SessionClock({
  currentTime,
  remainingMs,
}: Readonly<{ currentTime: string; remainingMs: number | null }>) {
  const sessionLabel =
    remainingMs === null ? "--:--" : formatSessionTime(remainingMs);

  return (
    <Box
      sx={{
        minWidth: 175,
        pr: 1.5,
        textAlign: "right",
        borderRight: "1px solid rgba(255,255,255,0.35)",
        display: { xs: "none", sm: "block" },
      }}
    >
      <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: 12, lineHeight: 1.4 }}>
        {currentTime}
      </Typography>
      <Typography
        sx={{ mt: 0.25, color: "#FFFFFF", fontSize: 11, fontWeight: 700, letterSpacing: 0.2 }}
      >
        Session: {sessionLabel}
      </Typography>
    </Box>
  );
}

function UserMenu({ username }: Readonly<{ username: string }>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const isUserMenuOpen = Boolean(userMenuAnchor);

  const handleUserMenuOpen = (event: MouseEvent<HTMLButtonElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleBreakTimeOpen = () => {
    handleUserMenuClose();
    setDialogOpen(true);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    clearToken();
    assignUrl(commonPaths.login);
  };

  return (
    <>
      <Button
        onClick={handleUserMenuOpen}
        aria-controls={isUserMenuOpen ? "user-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={isUserMenuOpen ? "true" : undefined}
        disableRipple
        sx={{
          minWidth: 0,
          px: { xs: 0.5, sm: 1 },
          py: 0.5,
          color: "#FFFFFF",
          textTransform: "none",
          borderRadius: 2,
          "&:hover": { backgroundColor: "rgba(255,255,255,0.14)" },
        }}
      >
        <Box
          sx={{
            mr: 1,
            width: 35,
            height: 35,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "#FFFFFF",
            backgroundColor: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.45)",
            borderRadius: "50%",
          }}
        >
          <UserProfileIcon />
        </Box>
        <Box
          sx={{
            mr: 1,
            minWidth: 80,
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            textAlign: "left",
          }}
        >
          <Typography
            noWrap
            sx={{ maxWidth: 150, color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}
          >
            {username}
          </Typography>
        </Box>
        <Box sx={{ height: 20, display: "flex", alignItems: "center", color: "#FFFFFF" }}>
          {isUserMenuOpen ? <KeyUpArrowIcon /> : <KeyDownArrowIcon />}
        </Box>
      </Button>

      <Menu
        id="user-menu"
        anchorEl={userMenuAnchor}
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 240,
              overflow: "hidden",
              border: "1px solid #F1D7D0",
              borderRadius: 2,
              boxShadow: "0 8px 24px rgba(70, 20, 20, 0.18)",
            },
          },
        }}
      >
        <Box component="button" type="button" onClick={handleBreakTimeOpen} sx={menuActionSx}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#9A2529" }}>
              <TimerPauseIcon />
              <Typography sx={{ color: "#323232", fontSize: 14 }}>Breaktime</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", color: "#9A2529" }}>
              <Typography sx={{ mr: 0.5, color: "#9A2529", fontSize: 12, fontWeight: 700 }}>
                30 mins
              </Typography>
              <KeyRightArrowIcon />
            </Box>
          </Box>
        </Box>
        <Divider />
        <Box component="button" type="button" onClick={handleLogout} sx={menuActionSx}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "#9A2529" }}>
            <LogoutIcon />
            <Typography sx={{ color: "#323232", fontSize: 14 }}>Logout</Typography>
          </Box>
        </Box>
      </Menu>
      <BreakTime dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} />
    </>
  );
}

export function Header({
  inboxPath = "/inbox",
  drsPath = "/drs",
  onBackToInbox,
  onBackToDrs,
  onBack,
  backPath,
  role,
  applicationNo,
}: Readonly<HeaderProps>) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTime = useCurrentTime();
  const remainingMs = useSessionCountdown();
  const normalizedPathname = normalizePath(location.pathname).toLowerCase();
  const showBack = !HIDDEN_TASK_PATHS.has(normalizedPathname);
  const showTaskIdentity = showBack;
  const visibleRole = showTaskIdentity ? presentText(role) : undefined;
  const visibleApplicationNo = showTaskIdentity ? presentText(applicationNo) : undefined;
  const sessionUser = getSessionUser();
  const username = sessionUser?.displayName ?? sessionUser?.userId ?? "";

  const isDrsSubPage =
    normalizedPathname === "/previous-policy" ||
    normalizedPathname === "/open-tasks" ||
    normalizedPathname === "/audit-trail" ||
    normalizedPathname === "/risk-details" ||
    normalizedPathname === "/applicant-profile" ||
    normalizedPathname.startsWith("/previous-policy/") ||
    normalizedPathname.startsWith("/open-tasks/") ||
    normalizedPathname.startsWith("/audit-trail/") ||
    normalizedPathname.startsWith("/risk-details/") ||
    normalizedPathname.startsWith("/applicant-profile/");

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (backPath) {
      navigate(backPath);
      return;
    }

    if (isDrsSubPage) {
      if (onBackToDrs) {
        onBackToDrs();
        return;
      }
      const searchParams = new URLSearchParams(location.search);
      if (applicationNo && !searchParams.has("applicationNo")) {
        searchParams.set("applicationNo", applicationNo);
      }
      if (role && !searchParams.has("role")) {
        searchParams.set("role", role);
      }
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";
      navigate(`${drsPath}${queryString}`);
      return;
    }

    if (onBackToInbox) {
      onBackToInbox();
      return;
    }
    navigate(inboxPath);
  };

  const backAriaLabel = isDrsSubPage ? "Back to DRS" : "Back to Inbox";

  return (
    <Box
      component="header"
      sx={{
        height: HEADER_HEIGHT,
        display: "flex",
        alignItems: "stretch",
        background:
          "linear-gradient(to bottom,#F58220 0%,#E65318 42%,#C92E27 72%,#98252B 100%)",
        boxShadow: "0 3px 12px rgba(111, 24, 24, 0.25)",
        position: "sticky",
        top: 0,
        zIndex: 1200,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {showBack ? (
        <Button
          onClick={handleBack}
          aria-label={backAriaLabel}
          title={backAriaLabel}
          disableRipple
          startIcon={<KeyLeftArrowIcon />}
          sx={{
            minWidth: { xs: 10, sm: 10 },
            height: HEADER_HEIGHT,
            flexShrink: 0,
            color: "#FFFFFF",
            backgroundColor: "rgba(126, 22, 31, 0.42)",
            borderRadius: 0,
            borderRight: "1px solid rgba(255,255,255,0.25)",
            textTransform: "none",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
            "& .MuiButton-startIcon": { m: { xs: 0, sm: "0 6px 0 0" } },
            "&:hover": { backgroundColor: "rgba(126, 22, 31, 0.62)" },
          }}
        />
      ) : null}

      <Box
        sx={{
          height: HEADER_HEIGHT,
          flexShrink: 0,
          display: "flex",
          alignItems: "stretch",
          backgroundColor: "transparent",
        }}
      >
        <Box
          component="img"
          src={Logo}
          alt="ICICI Life Logo"
          sx={{ height: "100%", width: "150px", display: "block", objectFit: "cover" }}
        />
      </Box>

      <Box
        sx={{
          minWidth: 0,
          height: HEADER_HEIGHT,
          px: { xs: 1, sm: 2 },
          flex: 1,
          display: "flex",
          alignItems: "center",
          color: "#FFFFFF",
          background: "transparent",
        }}
      >
        <TaskIdentity role={visibleRole} applicationNo={visibleApplicationNo} />
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 } }}>
          <SessionClock currentTime={currentTime} remainingMs={remainingMs} />
          <UserMenu username={username} />
        </Box>
      </Box>
    </Box>
  );
}
