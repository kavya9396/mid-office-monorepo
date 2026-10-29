import { useCallback, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { Fab, useMediaQuery, Zoom } from "@mui/material";
import type { FabProps } from "@mui/material";
import CustomTooltip from "../Tooltip/Tooltip";
import { KeyUpArrowIcon } from "../icons/Icons";

export interface ScrollToTopProps extends Omit<FabProps, "children" | "href" | "color" | "variant"> {
  threshold?: number;
  scrollTarget?: HTMLElement | null;
  behavior?: ScrollBehavior;
  placement?: "bottom-right" | "bottom-left";
  offsetBottom?: number | string;
  offsetSide?: number | string;
  label?: string;
  icon?: ReactNode;
  backgroundColor?: string;
  hoverColor?: string;
}

const getServerSnapshot = () => false;
const noop = () => undefined;

export default function ScrollToTop({
  threshold = 200,
  scrollTarget,
  behavior = "smooth",
  placement = "bottom-right",
  offsetBottom = 24,
  offsetSide = 24,
  label = "Scroll to top",
  icon,
  backgroundColor = "#E45F14",
  hoverColor = "#C95010",
  size = "small",
  sx = [],
  onClick,
  ...fabProps
}: Readonly<ScrollToTopProps>) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === "undefined") return noop;

    const target = scrollTarget ?? window;
    if (!target) return noop;

    target.addEventListener("scroll", onStoreChange, { passive: true });
    return () => target.removeEventListener("scroll", onStoreChange);
  }, [scrollTarget]);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (scrollTarget === null) return false;

    const scrollTop = scrollTarget === undefined ? window.scrollY : scrollTarget.scrollTop;
    return scrollTop > Math.max(0, threshold);
  }, [scrollTarget, threshold]);

  // React reads the current scroll position and updates only when visibility changes.
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleClick: NonNullable<FabProps["onClick"]> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || typeof window === "undefined") return;

    const target = scrollTarget ?? window;
    target?.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : behavior,
    });
  };

  return (
    <CustomTooltip title={label} placement="left">
      <Zoom in={visible} timeout={prefersReducedMotion ? 0 : 180} unmountOnExit>
        <Fab
          aria-label={label}
          {...fabProps}
          size={size}
          onClick={handleClick}
          sx={[
            {
              position: "fixed",
              bottom: offsetBottom,
              right: placement === "bottom-right" ? offsetSide : "auto",
              left: placement === "bottom-left" ? offsetSide : "auto",
              zIndex: (theme) => theme.zIndex.fab,
              backgroundColor,
              color: "#FFFFFF",
              boxShadow: "0 3px 10px rgba(60, 42, 35, .2)",
              "&:hover": { backgroundColor: hoverColor },
              "&.Mui-focusVisible": { outline: "2px solid #A92129", outlineOffset: "3px" },
            },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
        >
          {icon ?? <KeyUpArrowIcon />}
        </Fab>
      </Zoom>
    </CustomTooltip>
  );
}