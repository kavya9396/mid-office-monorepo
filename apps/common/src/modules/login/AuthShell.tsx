import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import IBMLogo from "../../assets/IBM Logo.svg";
import IPRULogo from "../../assets/ICICI_Logo_BG.svg";
import LoginImage from "../../assets/Login-Image.svg";

export const authCompactLaptop = "@media (max-height: 800px)";
export const authShortLaptop = "@media (max-height: 680px)";

const inlineLinkSx = {
  border: 0,
  p: 0,
  bgcolor: "transparent",
  font: "inherit",
  verticalAlign: "baseline",
  cursor: "pointer",
} as const;

type AuthShellProps = {
  /** Short line under the logo, unique per screen. */
  subtitle: string;
  /** Form fields and screen-specific content. */
  children: ReactNode;
  /** Login keeps Privacy/Terms; other screens use plain copyright. */
  showLegalLinks?: boolean;
  /** Login uses hidden overflow; reset/change use auto. */
  contentOverflow?: "hidden" | "auto";
};

function AuthArtwork() {
  return (
    <Box
      sx={{
        width: { xs: "0%", md: "50%" },
        minHeight: 0,
        display: { xs: "none", md: "block" },
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        component="img"
        src={LoginImage}
        alt="Underwriter reviewing an insurance form"
        sx={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />
    </Box>
  );
}

function AuthBrandHeader({ subtitle }: Readonly<{ subtitle: string }>) {
  return (
    <Box>
      <Box
        component="img"
        src={IPRULogo}
        alt="ICICI Life Insurance"
        sx={{
          height: 72,
          width: "auto",
          mb: 1.5,
          [authCompactLaptop]: { height: 52, mb: 1 },
          [authShortLaptop]: { height: 40, mb: 0.5 },
        }}
      />
      <Typography variant="body1" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
  );
}

function AuthCopyright({ showLegalLinks }: Readonly<{ showLegalLinks: boolean }>) {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Divider sx={{ mb: 1, [authCompactLaptop]: { mb: 0.5 } }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px" }}>
        {showLegalLinks ? (
          <>
            © 2026 ICICI Life Insurance,&nbsp;
            <Link component="button" type="button" underline="hover" sx={inlineLinkSx}>
              Privacy Policy
            </Link>
            &nbsp; | &nbsp;
            <Link component="button" type="button" underline="hover" sx={inlineLinkSx}>
              Terms and Conditions
            </Link>
          </>
        ) : (
          "© 2026 ICICI Life Insurance"
        )}
      </Typography>
    </Box>
  );
}

function AuthPoweredBy() {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 2,
        [authCompactLaptop]: { py: 1 },
        [authShortLaptop]: { py: 0.75 },
      }}
    >
      <Typography variant="body2">Powered by</Typography>
      <Box component="img" src={IBMLogo} alt="IBM Logo" sx={{ height: 28, width: "auto" }} />
    </Box>
  );
}

/**
 * Shared chrome for login / reset-password / change-password:
 * left artwork, logo, subtitle slot, copyright, powered-by.
 */
export function AuthShell({
  subtitle,
  children,
  showLegalLinks = false,
  contentOverflow = "auto",
}: Readonly<AuthShellProps>) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
      }}
    >
      <AuthArtwork />

      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            flex: 1,
            minHeight: 0,
            overflow: contentOverflow,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 4,
            py: 3,
            gap: 2.5,
            [authCompactLaptop]: { py: 1.5, gap: 1.5 },
            [authShortLaptop]: { py: 1, gap: 1 },
          }}
        >
          <AuthBrandHeader subtitle={subtitle} />
          {children}
          <AuthCopyright showLegalLinks={showLegalLinks} />
        </Box>
        <AuthPoweredBy />
      </Box>
    </Box>
  );
}
