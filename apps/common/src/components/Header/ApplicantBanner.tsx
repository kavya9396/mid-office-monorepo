import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge } from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* ApplicantBanner — spec: docs/spec/screens/00-shared-layout.md §4    */
/* Styles copied from the DRS prototype banner.                        */
/* The photo column is rendered only when `photoUrl` is provided;      */
/* otherwise the banner shows just the data.                           */
/* ------------------------------------------------------------------ */

export interface BannerField {
  id: string;
  label?: string;
  value: ReactNode;
  labelSeparator?: string;
}

export interface BannerRow {
  id: string;
  label?: string;
  fields: readonly BannerField[];
  separator?: string;
}

export interface ApplicantBannerProps {
  applicationNo: string;
  rows: readonly BannerRow[];
  name?: string;
  /** When set (non-blank) the photo column is shown; otherwise only data is shown. */
  photoUrl?: string | null;
  photoAlt?: string;
  children?: ReactNode;
  sticky?: boolean;
  stickyTop?: number;
  sx?: SxProps<Theme>;
}

function RowContent({ row }: Readonly<{ row: BannerRow }>) {
  return (
    <>
      {row.label && <Box component="strong">{row.label}: </Box>}
      {row.fields.map((field, index) => (
        <Box component="span" key={field.id}>
          {index > 0 && (row.separator ?? " / ")}
          {field.label && (
            <Box component="strong">
              {field.label}
              {field.labelSeparator ?? ": "}
            </Box>
          )}
          {typeof field.value === "boolean"
            ? field.value
              ? "Yes"
              : "No"
            : (field.value ?? "—")}
        </Box>
      ))}
    </>
  );
}

export function ApplicantBanner({
  applicationNo,
  rows,
  name,
  photoUrl,
  photoAlt,
  children,
  sticky = true,
  stickyTop = 0,
  sx = [],
}: Readonly<ApplicantBannerProps>) {
  const normalizedPhotoUrl = photoUrl?.trim();
  const hasPhoto = Boolean(normalizedPhotoUrl);
  const hasName = Boolean(name?.trim());
  const visibleRows = rows.filter((row) => row.fields.length > 0);
  const firstRow = hasName ? undefined : visibleRows[0];
  const remainingRows = hasName ? visibleRows : visibleRows.slice(1);

  return (
    <Box
      data-testid="applicant-banner"
      sx={[
        {
          position: sticky ? "sticky" : "relative",
          top: sticky ? stickyTop : undefined,
          zIndex: 20,
          background: "#fff8f3",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="section"
        aria-label="Application summary"
        sx={{
          display: hasPhoto ? "grid" : "block",
          gridTemplateColumns: hasPhoto ? "150px minmax(0, 1fr)" : undefined,
          p: hasPhoto ? 0 : "10px 18px",
          mb: "6px",
          border: hasPhoto ? "none" : "1px solid #f1d8c8",
          borderRadius: hasPhoto ? "12px" : "8px",
          overflow: "hidden",
          background: "#ffead7",
          boxShadow: hasPhoto ? "0 3px 10px rgba(169, 33, 41, .16)" : "none",
          color: "#000",
        }}
      >
        {hasPhoto && (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #e45f14 0%, #c83c2f 100%)",
            }}
          >
            <Box
              component="img"
              src={normalizedPhotoUrl}
              alt={photoAlt ?? (hasName ? `${name} photo` : "Applicant photo")}
              sx={{
                width: "76px",
                height: "76px",
                boxSizing: "border-box",
                border: "2px solid rgba(255, 255, 255, .55)",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, .22)",
                objectFit: "cover",
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            position: "relative",
            minWidth: 0,
            p: hasPhoto ? "12px 18px" : 0,
            color: "#302a27",
            fontSize: "12px",
            lineHeight: 1.6,
          }}
        >
          <Box sx={{ pr: "180px", minWidth: 0, overflowWrap: "anywhere" }}>
            {hasName ? (
              <Typography
                component="div"
                sx={{
                  mb: "4px",
                  fontSize: "16px",
                  fontWeight: 800,
                  lineHeight: 1.6,
                  color: "#000",
                }}
              >
                {name}
              </Typography>
            ) : firstRow ? (
              <RowContent row={firstRow} />
            ) : null}
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: hasPhoto ? "12px" : 0,
              right: hasPhoto ? "12px" : 0,
              boxSizing: "border-box",
            }}
          >
            <Badge
              label={`App No. - ${applicationNo || "-"}`}
              variant="Neutral"
              sx={{
                color: "#9a2529",
                fontSize: "13px",
                fontWeight: 800,
              }}
            />
          </Box>

          {remainingRows.map((row) => (
            <Box
              key={row.id}
              sx={{ mt: "2px", overflowWrap: "anywhere" }}
            >
              <RowContent row={row} />
            </Box>
          ))}
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default ApplicantBanner;
