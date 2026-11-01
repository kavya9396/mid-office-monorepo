import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Box,
  ClickAwayListener,
  IconButton,
  type SxProps,
  type Theme,
  Typography,
} from "@mui/material";
import { CloseIcon, KeyRightArrowIcon, LinkIcon, colors } from "@insurance-poc/ui";

/* -------------------------------------------------------------------------- */
/* Types & Interfaces                                                         */
/* -------------------------------------------------------------------------- */

export interface QuickLinkItem {
  id?: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
  dataTestId?: string;
}

export interface QuickLinksModuleProps {
  /** Array of quick links to display on the screen */
  items: QuickLinkItem[];
  /** Title of the popup panel */
  title?: string;
  /** Active application number */
  applicationNo?: string;
  /** Active user role / pool type */
  roleType?: string;
  /** Callback for route navigation (every quick link opens as a new page) */
  onNavigate?: (path: string) => void;
  /** Callback for notifications / snackbar messages */
  onNotify?: (message: string) => void;
  /** Callback when an item is clicked */
  onItemClick?: (item: QuickLinkItem, index: number) => void;
  /**
   * IDs that should open a dialog rather than navigate to a page.
   * When a clicked item's id is in this set, `onDialogItemClick` is called
   * instead of `onNavigate`.
   */
  dialogItemIds?: string[];
  /** Called when a dialog-backed quick link is clicked. */
  onDialogItemClick?: (item: QuickLinkItem) => void;
  /** Controlled open state */
  open?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
  /** Callback when menu toggles */
  onToggle?: (open: boolean) => void;
  /** Callback when menu closes */
  onClose?: () => void;
  /** Close menu upon clicking an item */
  closeOnItemClick?: boolean;
  /** Positioning */
  position?: "fixed" | "absolute";
  bottom?: string | number;
  right?: string | number;
  top?: string | number;
  left?: string | number;
  zIndex?: number;
  ariaLabel?: string;
  fabSx?: SxProps<Theme>;
  panelSx?: SxProps<Theme>;
  headerSx?: SxProps<Theme>;
  itemSx?: SxProps<Theme>;
  sx?: SxProps<Theme>;
}

/* -------------------------------------------------------------------------- */
/* Quick link id -> page route                                                */
/* -------------------------------------------------------------------------- */

const QUICK_LINK_PATHS: Record<string, string> = {
  "applicant-profile": "/applicant-profile",
  "previous-policies": "/previous-policy",
  "previous-policy": "/previous-policy",
  "open-tasks": "/open-tasks",
  "open-task": "/open-tasks",
  "risk-details": "/risk-details",
  "risk-detail": "/risk-details",
  "audit-trail": "/audit-trail",
  audit: "/audit-trail",
};

/* -------------------------------------------------------------------------- */
/* QuickLinksModule Component                                                 */
/* -------------------------------------------------------------------------- */

export const QuickLinksModule = ({
  items,
  title = "Quick Links",
  applicationNo,
  roleType,
  onNavigate,
  onNotify,
  onItemClick,
  dialogItemIds,
  onDialogItemClick,
  open: controlledOpen,
  defaultOpen = false,
  onToggle,
  onClose,
  closeOnItemClick = true,
  position = "fixed",
  bottom = "10%",
  right = "3%",
  top,
  left,
  zIndex = 80,
  ariaLabel = "Quick Links",
  fabSx,
  panelSx,
  headerSx,
  itemSx,
  sx,
}: Readonly<QuickLinksModuleProps>) => {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onToggle?.(nextOpen);
      if (!nextOpen) {
        onClose?.();
      }
    },
    [isControlled, onToggle, onClose]
  );

  const handleFabClick = () => {
    setOpen(!isOpen);
  };

  const handleClickAway = () => {
    if (isOpen) {
      setOpen(false);
    }
  };

  const handleItemClick = (item: QuickLinkItem, index: number) => {
    if (item.disabled) return;

    if (item.onClick) {
      item.onClick();
    }
    onItemClick?.(item, index);

    if (item.href) {
      if (item.target === "_blank") {
        window.open(item.href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = item.href;
      }
      if (closeOnItemClick) setOpen(false);
      return;
    }

    if (!item.onClick) {
      const id = item.id;

      // If this item is configured to open a dialog, delegate to the caller.
      if (id && dialogItemIds?.includes(id) && onDialogItemClick) {
        onDialogItemClick(item);
        if (closeOnItemClick) setOpen(false);
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      if (applicationNo) {
        searchParams.set("applicationNo", applicationNo);
      }
      if (roleType && !searchParams.has("role")) {
        searchParams.set("role", roleType);
      }
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

      const path = id ? QUICK_LINK_PATHS[id] : undefined;

      if (path && onNavigate) {
        onNavigate(`${path}${queryString}`);
      } else if (!path && onNotify) {
        onNotify(`Navigating to ${item.label}`);
      }
    }

    if (closeOnItemClick) {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpen]);

  const positioningStyles: SxProps<Theme> = {
    position,
    zIndex,
    ...(bottom !== undefined ? { bottom } : {}),
    ...(right !== undefined ? { right } : {}),
    ...(top !== undefined ? { top } : {}),
    ...(left !== undefined ? { left } : {}),
  };

  return (
    <>
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box sx={{ ...positioningStyles, ...sx }}>
          {isOpen && (
            <Box
              role="region"
              aria-label={title}
              data-testid="quick-links-panel"
              sx={{
                position: "absolute",
                bottom: "calc(100% + 16px)",
                right: 0,
                width: 276,
                overflow: "hidden",
                borderRadius: "8px",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                border: "1px solid #e5e5e5",
                ...panelSx,
              }}
            >
              <Box
                sx={{
                  p: "12px 16px",
                  bgcolor: "#f5f5f5",
                  borderBottom: "1px solid #e5e5e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  ...headerSx,
                }}
              >
                <Typography
                  component="h2"
                  sx={{
                    m: 0,
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1e1e1e",
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography>
              </Box>

              <Box
                component="nav"
                aria-label={title}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "360px",
                  overflowY: "auto",
                }}
              >
                {items.map((item, index) => {
                  const key = item.id || `${item.label}-${index}`;
                  return (
                    <Box
                      key={key}
                      component="button"
                      type="button"
                      disabled={item.disabled}
                      data-testid={item.dataTestId || `quick-link-item-${index}`}
                      onClick={() => handleItemClick(item, index)}
                      onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleItemClick(item, index);
                        }
                      }}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        p: "12px 16px",
                        border: 0,
                        borderTop: index > 0 ? "1px solid #e5e5e5" : "none",
                        bgcolor: "#ffffff",
                        color: item.disabled ? "#9e9e9e" : "#444444",
                        fontSize: "14px",
                        fontWeight: 500,
                        textAlign: "left",
                        cursor: item.disabled ? "not-allowed" : "pointer",
                        outline: "none",
                        transition: "background-color 0.15s, color 0.15s",
                        "&:hover": item.disabled
                          ? {}
                          : {
                              bgcolor: colors.background,
                              color: colors.primary,
                            },
                        "&:focus-visible": {
                          outline: `2px solid ${colors.primary}`,
                          outlineOffset: -2,
                        },
                        ...itemSx,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          minWidth: 0,
                        }}
                      >
                        {item.icon && (
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "inherit",
                            }}
                          >
                            {item.icon}
                          </Box>
                        )}
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "inherit",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          ml: 1,
                          flexShrink: 0,
                        }}
                      >
                        {item.badge !== undefined && (
                          <Box
                            component="span"
                            sx={{
                              px: 0.8,
                              py: 0.2,
                              borderRadius: "10px",
                              fontSize: "11px",
                              fontWeight: 700,
                              bgcolor: item.badgeColor || colors.highlight,
                              color: colors.primary,
                            }}
                          >
                            {item.badge}
                          </Box>
                        )}
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            color: "#7b716c",
                          }}
                        >
                          <KeyRightArrowIcon width={16} height={16} />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          <IconButton
            type="button"
            aria-label={isOpen ? "Close Quick Links" : ariaLabel}
            title={isOpen ? "Close Quick Links" : ariaLabel}
            aria-expanded={isOpen}
            data-testid="quick-links-fab"
            onClick={handleFabClick}
            sx={{
              width: 50,
              height: 50,
              minWidth: 50,
              borderRadius: "50%",
              bgcolor: colors.primary,
              color: colors.white,
              boxShadow: "0 3px 8px rgba(228, 95, 20, 0.35)",
              transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s",
              "&:hover": {
                bgcolor: "#CE530F",
              },
              "&:focus-visible": {
                outline: `2px solid ${colors.primary}`,
                outlineOffset: 2,
              },
              ...fabSx,
            }}
          >
            {isOpen ? (
              <CloseIcon width={24} height={24} />
            ) : (
              <LinkIcon width={24} height={24} />
            )}
          </IconButton>
        </Box>
      </ClickAwayListener>
    </>
  );
};

export default QuickLinksModule;
