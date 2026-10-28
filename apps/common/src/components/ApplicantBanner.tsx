import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { UserProfileIcon } from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* ApplicantBanner — spec: docs/spec/screens/00-shared-layout.md §4    */
/* Styles copied from mas-drs-prototype.html (components `aSe`/`kxe`   */
/* banner + sticky wrapper). Lines are pre-composed strings; the       */
/* banner never splits them into label/value pairs (spec rule 7).      */
/* ------------------------------------------------------------------ */

export type ApplicantBannerLine = {
  text: string;
  /** Render the line in bold weight (product / sum-assured line). */
  emphasis?: boolean;
};

export type ApplicantBannerProps = {
  applicantName: string;
  /** Rendered in the top-right pill, e.g. "App No. - OB90377122". */
  applicationLabel: string;
  lines: ApplicantBannerLine[];
  /** Rendered inside the sticky wrapper, below the banner. */
  children?: ReactNode;
};

export function ApplicantBanner({
  applicantName,
  applicationLabel,
  lines,
  children,
}: Readonly<ApplicantBannerProps>) {
  return (
    <Box
      data-testid="applicant-banner"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        width: "100%",
        minWidth: 0,
        px: 0.5,
        pt: 0.75,
        pb: 0.75,
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          width: "100%",
          mb: 0.75,
          display: "grid",
          gridTemplateColumns: {
            xs: "84px minmax(0,1fr)",
            sm: "150px minmax(0,1fr)",
          },
          bgcolor: "#FFEAD7",
          color: "#000",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 3px 10px rgba(169, 33, 41, 0.16)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 112, sm: 138 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(145deg, #E45F14 0%, #C83C2F 100%)",
          }}
        >
          <Box
            sx={{
              width: { xs: 54, sm: 76 },
              height: { xs: 54, sm: 76 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              bgcolor: "rgba(255,255,255,.18)",
              color: "#000",
              border: "2px solid rgba(255,255,255,.45)",
              fontSize: { xs: 30, sm: 44 },
            }}
          >
            <UserProfileIcon width="1em" height="1em" />
          </Box>
        </Box>

        <Box
          sx={{
            minWidth: 0,
            px: { xs: 1.2, sm: 2.2 },
            py: { xs: 1, sm: 1.45 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 0.4,
            }}
          >
            <Typography
              title={applicantName}
              sx={{
                minWidth: 0,
                color: "#000",
                fontSize: { xs: 14, sm: 16 },
                fontWeight: 900,
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {applicantName}
            </Typography>
            <Typography
              sx={{
                flexShrink: 0,
                px: 1.1,
                py: 0.45,
                borderRadius: "16px",
                bgcolor: "#FFFFFF",
                border: "1px solid rgba(169,33,41,.18)",
                color: "#A92129",
                fontSize: { xs: 11, sm: 13 },
                fontWeight: 900,
                whiteSpace: "nowrap",
              }}
            >
              {applicationLabel}
            </Typography>
          </Box>

          {lines.map((line, index) => (
            <Typography
              key={line.text}
              sx={{
                mt: line.emphasis ? 0.5 : index === 0 ? 0 : 0.45,
                color: "#000",
                fontSize: { xs: 10, sm: 11.5 },
                lineHeight: line.emphasis ? 1.65 : 1.6,
                fontWeight: line.emphasis ? 700 : 500,
                overflowWrap: "anywhere",
              }}
            >
              {line.text}
            </Typography>
          ))}
        </Box>
      </Box>

      {children}
    </Box>
  );
}

export default ApplicantBanner;
