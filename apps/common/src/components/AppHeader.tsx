import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box } from "@mui/material";
import {
  KeyDownArrowIcon,
  KeyLeftArrowIcon,
  UserProfileIcon,
} from "@insurance-poc/ui";
import brandLogo from "../assets/ICICI_Logo.svg";

/* ------------------------------------------------------------------ */
/* AppHeader — spec: docs/spec/screens/00-shared-layout.md §2          */
/* Styles copied from design-reference MAS dvt-nmr-view-financial.html */
/* ------------------------------------------------------------------ */

export type ProfileMenuItem = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
};

export type AppHeaderProps = {
  /** Show the back-navigation button (DRS detail screens). */
  showBack?: boolean;
  onBack?: () => void;
  /** Replaces the date line of the session block. */
  sessionLabel?: string;
  /** Authenticated user display name. */
  userName: string;
  menuItems?: ProfileMenuItem[];
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const timeFormatter = new Intl.DateTimeFormat("en-IN", { timeStyle: "short" });

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

export function AppHeader({
  showBack = false,
  onBack,
  sessionLabel,
  userName,
  menuItems = [],
}: Readonly<AppHeaderProps>) {
  const now = useNow();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        profileRef.current?.contains(event.target)
      ) {
        return;
      }
      setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <Box
      component="header"
      sx={{
        height: "57px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "stretch",
        overflow: "visible",
        background:
          "linear-gradient(to bottom, #F58220 0%, #E65318 42%, #C92E27 72%, #98252B 100%)",
        boxShadow: "0 3px 12px rgba(111, 24, 24, .25)",
      }}
    >
      {showBack ? (
        <Box
          component="button"
          type="button"
          aria-label="Back"
          onClick={onBack}
          sx={{
            width: "42px",
            p: 0,
            border: 0,
            borderRight: "1px solid rgba(255, 255, 255, .25)",
            color: "#fff",
            background: "rgba(126, 22, 31, .42)",
            fontSize: "26px",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            "&:hover": { background: "rgba(126, 22, 31, .62)" },
          }}
        >
          <KeyLeftArrowIcon width={26} height={26} />
        </Box>
      ) : null}

      <Box
        component="img"
        src={brandLogo}
        alt="ICICI Prudential Life Insurance"
        sx={{
          width: "150px",
          height: "57px",
          objectFit: "cover",
          display: "block",
        }}
      />

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
          px: "32px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          color: "#fff",
        }}
      >
        <Box
          sx={{
            minWidth: "175px",
            pr: "12px",
            textAlign: "right",
            borderRight: "1px solid rgba(255, 255, 255, .35)",
            color: "rgba(255, 255, 255, .9)",
            fontSize: "12px",
            lineHeight: 1.4,
          }}
        >
          {sessionLabel ?? dateFormatter.format(now)}
          <Box
            component="strong"
            sx={{
              display: "block",
              mt: "3px",
              color: "#fff",
              fontSize: "11px",
              letterSpacing: ".2px",
            }}
          >
            {timeFormatter.format(now)}
          </Box>
        </Box>

        <Box ref={profileRef} sx={{ display: "flex", alignItems: "center" }}>
          <Box
            component="button"
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            sx={{
              ml: "20px",
              px: "8px",
              py: "4px",
              border: 0,
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              color: "#fff",
              background: "transparent",
              cursor: "pointer",
              "&:hover": { background: "rgba(255, 255, 255, .14)" },
            }}
          >
            <Box
              sx={{
                width: "35px",
                height: "35px",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255, 255, 255, .45)",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, .2)",
                fontSize: "20px",
              }}
            >
              <UserProfileIcon />
            </Box>
            <Box
              component="span"
              sx={{
                minWidth: "80px",
                maxWidth: "150px",
                m: "0 8px 0 10px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {userName}
            </Box>
            <Box component="span" sx={{ display: "flex", fontSize: "18px" }}>
              <KeyDownArrowIcon width={18} height={18} />
            </Box>
          </Box>

          {menuOpen && menuItems.length > 0 ? (
            <Box
              role="menu"
              sx={{
                position: "absolute",
                right: "16px",
                top: "65px",
                zIndex: 30,
                width: "240px",
                overflow: "hidden",
                border: "1px solid #F1D7D0",
                borderRadius: "8px",
                color: "#323232",
                background: "#fff",
                boxShadow: "0 8px 24px rgba(70, 20, 20, .18)",
              }}
            >
              {menuItems.map((item, index) => (
                <Box
                  key={item.label}
                  role="menuitem"
                  component="button"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    item.onSelect();
                  }}
                  sx={{
                    width: "100%",
                    px: "16px",
                    py: "15px",
                    border: 0,
                    borderTop: index > 0 ? "1px solid #e0e0e0" : 0,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "transparent",
                    font: "inherit",
                    cursor: "pointer",
                    "&:hover": { background: "#FFF3EE" },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ color: "#9A2529", fontSize: "14px" }}
                  >
                    {item.label}
                  </Box>
                  {item.icon ? <Box component="span">{item.icon}</Box> : null}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
