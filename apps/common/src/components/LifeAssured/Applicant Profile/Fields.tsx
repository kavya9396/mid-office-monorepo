import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { colors } from "@insurance-poc/ui";

export type FieldData = {
  label: string;
  value?: string | number | null;
};

export const displayValue = (value?: string | number | null) =>
  value === null || value === undefined || value === "" ? "-" : String(value);

const TRUNCATE_AT = 30;

export function FieldItem({ label, value }: Readonly<FieldData>) {
  const [expanded, setExpanded] = useState(false);
  const text = displayValue(value);
  const truncated = text !== "-" && text.length > TRUNCATE_AT;
  const shown = truncated && !expanded ? `${text.slice(0, TRUNCATE_AT)}...` : text;

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: "12px", color: colors.textLabel, lineHeight: 1.35 }}>{label}</Typography>
      <Typography
        component="span"
        sx={{
          mt: "3px",
          display: "inline",
          fontSize: "10px",
          color: colors.textStrong,
          fontWeight: 600,
          lineHeight: 1.35,
          overflowWrap: "anywhere",
        }}
      >
        {shown}
      </Typography>
      {truncated && (
        <Typography
          component="button"
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          sx={{
            ml: 0.5,
            p: 0,
            border: 0,
            background: "transparent",
            color: "primary.main",
            cursor: "pointer",
            fontSize: "10px",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </Typography>
      )}
    </Box>
  );
}

export function FieldGrid({ items }: Readonly<{ items: FieldData[] }>) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
        columnGap: 1,
        rowGap: 0.75,
        "& .MuiTypography-root": { fontSize: 11, lineHeight: 1.3 },
      }}
    >
      {items.map((item) => (
        <FieldItem key={item.label} {...item} />
      ))}
    </Box>
  );
}

type FieldCardProps = {
  title: string;
  fields: FieldData[];
  /** Fixed column count from the md breakpoint up. Defaults to 2 columns from sm. */
  columns?: number;
};

export function FieldCard({ title, fields, columns }: Readonly<FieldCardProps>) {
  return (
    <Box sx={{ minWidth: 0, p: 0, backgroundColor: "background.default", borderRadius: "8px", overflow: "hidden" }}>
      <Typography
        sx={{
          px: 0.75,
          py: 0.5,
          fontSize: "12px",
          fontWeight: 600,
          color: colors.white,
          backgroundColor: "primary.main",
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          p: 0.75,
          display: "grid",
          gridTemplateColumns: columns
            ? { xs: "1fr", md: `repeat(${columns}, minmax(0, 1fr))` }
            : { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          columnGap: 1,
          rowGap: 0.75,
        }}
      >
        {fields.map((field) => (
          <FieldItem key={field.label} {...field} />
        ))}
      </Box>
    </Box>
  );
}
