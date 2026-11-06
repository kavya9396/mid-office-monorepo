import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge, UserProfileIcon } from "@insurance-poc/ui";

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
  /** Render the row in bold weight (e.g. product / sum-assured line). */
  emphasis?: boolean;
}

/** A pre-composed text line (rendered as-is, never split into label/value). */
export interface BannerLine {
  text: string;
  emphasis?: boolean;
}

/** Converts pre-composed text lines into single-field banner rows. */
export function toBannerRows(lines: readonly BannerLine[]): BannerRow[] {
  return lines.map((line, index) => ({
    id: `line-${index}`,
    emphasis: line.emphasis,
    fields: [{ id: "text", value: line.text }],
  }));
}

/** A row exactly as returned by the API (`data.rowDetails[]`). */
export interface BannerRowDetail {
  id: string | number;
  fields: readonly { name: string; value?: string | number | null }[];
}

export interface RowDetailsOptions {
  /** Row ids to leave out (e.g. the name / app-no row already shown elsewhere). */
  skipRowIds?: readonly (string | number)[];
  /** Row ids rendered in bold weight. */
  emphasisRowIds?: readonly (string | number)[];
  /** Separator between fields of a row. Default " / ". */
  separator?: string;
  /** Separator between a field name and its value. Default " - ". */
  nameValueSeparator?: string;
}

/**
 * Converts API `rowDetails` into banner rows, rendering each field as
 * "{name} - {value}" (an empty value renders "{name} -") joined by the row separator.
 */
export function rowDetailsToBannerRows(
  rowDetails: readonly BannerRowDetail[] | null | undefined,
  options: RowDetailsOptions = {},
): BannerRow[] {
  const {
    skipRowIds = [],
    emphasisRowIds = [],
    separator = " / ",
    nameValueSeparator = " - ",
  } = options;
  return (rowDetails ?? [])
    .filter((row) => !skipRowIds.includes(row.id))
    .map((row) => ({
      id: String(row.id),
      separator,
      emphasis: emphasisRowIds.includes(row.id),
      fields: row.fields.map((field, index) => {
        const value = field.value == null ? "" : String(field.value);
        return {
          id: `${row.id}-${index}`,
          value: value ? `${field.name}${nameValueSeparator}${value}` : `${field.name} -`,
        };
      }),
    }));
}

export interface ApplicantBannerProps {
  applicationNo?: string;
  /** Overrides the default "App No. - {applicationNo}" badge text. */
  applicationLabel?: string;
  /** Pre-built rows. Rendered before any `rowDetails` rows. */
  rows?: readonly BannerRow[];
  /** API `rowDetails` passed through as-is; mapped with `rowDetailsOptions`. */
  rowDetails?: readonly BannerRowDetail[] | null;
  rowDetailsOptions?: RowDetailsOptions;
  name?: string;
  /** When set (non-blank) the photo column is shown; otherwise only data is shown. */
  photoUrl?: string | null;
  photoAlt?: string;
  /** Show the gradient avatar column with a default user icon when there is no photo. */
  showAvatar?: boolean;
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
  applicationLabel,
  rows = [],
  rowDetails,
  rowDetailsOptions,
  name,
  photoUrl,
  photoAlt,
  showAvatar = false,
  children,
  sticky = true,
  stickyTop = 0,
  sx = [],
}: Readonly<ApplicantBannerProps>) {
  const normalizedPhotoUrl = photoUrl?.trim();
  const hasPhoto = Boolean(normalizedPhotoUrl) || showAvatar;
  const hasName = Boolean(name?.trim());
  const visibleRows = [...rows, ...rowDetailsToBannerRows(rowDetails, rowDetailsOptions)].filter(
    (row) => row.fields.length > 0,
  );
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
          pt: 0.5,
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
            {normalizedPhotoUrl ? (
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
            ) : (
              <Box
                sx={{
                  width: "76px",
                  height: "76px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  border: "2px solid rgba(255, 255, 255, .45)",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, .18)",
                  color: "#000",
                  fontSize: "44px",
                }}
              >
                <UserProfileIcon width="1em" height="1em" />
              </Box>
            )}
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
              label={applicationLabel ?? `App No. - ${applicationNo || "-"}`}
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
              sx={{
                mt: "2px",
                overflowWrap: "anywhere",
                fontWeight: row.emphasis ? 700 : undefined,
              }}
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
