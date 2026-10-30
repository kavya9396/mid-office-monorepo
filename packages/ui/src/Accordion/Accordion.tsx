import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from "@mui/material";
import { KeyDownArrowIcon, KeyUpArrowIcon } from "../icons/Icons";

type CustomAccordionProps = {
  title: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  chip?: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onChange?: (expanded: boolean) => void;
  titleFontSize?: number | string;
  detailPadding?: number | string;
  titleColor?: string;
};

export default function CustomAccordion({
  title,
  headerActions,
  children,
  chip,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onChange,
  titleFontSize = 14,
  detailPadding = "5px",
  titleColor = "#fff",
}: Readonly<CustomAccordionProps>) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const displayExpanded = isControlled ? controlledExpanded : expanded;

  return (
    <Accordion
      expanded={displayExpanded}
      onChange={() => {
        const newExpanded = !displayExpanded;
        if (!isControlled) {
          setExpanded(newExpanded);
        }
        onChange?.(newExpanded);
      }}
      sx={{
        borderRadius: "8px !important",
        overflow: "hidden",
        boxShadow: 2,
        backgroundColor: "#FFFFFF",
        "&:before": { display: "none" },
        margin: "0 !important",
        "&.Mui-expanded": {
          margin: "0 !important",
        },
      }}
    >
      <AccordionSummary
        sx={{
          borderBottom: "1px solid #E6E6E6",
          display: "flex",
          background: "#E45F14",
          alignItems: "center",
          minHeight: "unset !important",
          p: "10px",
          m: 0,
          "&.Mui-expanded": {
            minHeight: "unset !important",
          },
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            m: "0 !important",
          },
          "& .MuiAccordionSummary-content.Mui-expanded": {
            m: "0 !important",
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: titleFontSize,
            fontWeight: 700,
            flex: 1,
            color: titleColor,
            m: 0,
          }}
        >
          {title}
        </Typography>

        {chip && (
          <Box
            onClick={(event) => event.stopPropagation()}
            sx={{
              display: "flex",
              alignItems: "center",
              m: 0,
            }}
          >
            {chip}
          </Box>
        )}
        {headerActions && (
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ display: "flex", alignItems: "center", mr: 1 }}
          >
            {headerActions}
          </Box>
        )}
        <Box
          sx={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            m: 0,
          }}
        >
          {displayExpanded ? (
            <KeyUpArrowIcon width={20} height={20} />
          ) : (
            <KeyDownArrowIcon width={20} height={20} />
          )}
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ padding: detailPadding, m: 0 }}>
        <Box>{children}</Box>
      </AccordionDetails>
    </Accordion>
  );
}
