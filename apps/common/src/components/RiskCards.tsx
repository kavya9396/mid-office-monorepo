import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { Box, ButtonBase, IconButton, Typography } from "@mui/material";
import { CloseIcon, colors, CustomDialog, KeyRightArrowIcon } from "@insurance-poc/ui";

export type RiskTone = "success" | "danger";

export type RiskCardField = {
  name: string;
  value: string;
};

export type RiskCardDetails = {
  /** Dialog heading, e.g. "Financial Details". */
  title: string;
  /** Label / value grid shown in the dialog. */
  fields: RiskCardField[];
  /** Long-form lines (remarks) shown below the grid. */
  remarks?: RiskCardField[];
};

export type RiskCardData = {
  /** Stable identifier (used as React key and passed back to onView). */
  id: string;
  title: string;
  /** success = green accent, danger = red accent. */
  tone: RiskTone;
  fields: RiskCardField[];
  /** Label of the pill next to the arrow. When omitted the pill is not rendered. */
  viewLabel?: string;
  /** When present, the arrow button opens a dialog with these details. */
  details?: RiskCardDetails;
};

export type RiskCardProps = Omit<RiskCardData, "id" | "details"> & {
  /** Click on the card body or the pill. */
  onCardClick?: () => void;
  /** Click on the arrow button. The footer row is rendered only when provided. */
  onOpenDetails?: () => void;
};

export type RiskCardsProps = {
  cards: RiskCardData[];
  /**
   * Called when a card body or its pill is clicked (e.g. navigate to a full page).
   * When omitted, those clicks open the details dialog instead (if the card has details).
   */
  onView?: (card: RiskCardData) => void;
};

const TONES: Record<RiskTone, { border: string; accent: string }> = {
  success: { border: "#b8dcc0", accent: "#28743c" },
  danger: { border: "#e8b8bc", accent: "#b3262e" },
};

export function RiskCard({
  title,
  tone,
  fields,
  viewLabel,
  onCardClick,
  onOpenDetails,
}: Readonly<RiskCardProps>) {
  const { border, accent } = TONES[tone];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onCardClick?.();
    }
  };

  const handleArrowClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onOpenDetails?.();
  };

  return (
    <Box
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={handleKeyDown}
      sx={{
        minWidth: 0,
        minHeight: 190,
        p: "10px",
        background: "#fff",
        border: `1px solid ${border}`,
        borderTop: `5px solid ${accent}`,
        borderRadius: "12px",
        boxShadow: "0 2px 7px rgba(60, 42, 35, .07)",
        cursor: onCardClick ? "pointer" : "default",
        transition: "transform .15s, box-shadow .15s",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 3px 8px rgba(50, 40, 35, .1)",
        },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#302a27" }}>{title}</Typography>

      <Box sx={{ mt: "8px", lineHeight: 1.35, fontSize: 10.5 }}>
        {fields.map((field) => (
          <Box key={field.name} sx={{ mt: "3px", fontSize: "inherit", color: "#302a27" }}>
            {field.name}:{" "}
            <Box component="b" sx={{ color: accent }}>
              {field.value || "-"}
            </Box>
          </Box>
        ))}
      </Box>

      {onOpenDetails && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "7px", mt: "10px" }}>
          <IconButton
            aria-label={`View ${title} details`}
            onClick={handleArrowClick}
            sx={{
              width: 34,
              height: 28,
              border: "1px solid #e1d8d2",
              borderRadius: "14px",
              background: "#fff8f3",
              color: "#a92129",
              "&:hover": { background: "#fff8f3" },
            }}
          >
            <KeyRightArrowIcon width={16} height={16} />
          </IconButton>
          {viewLabel && (
            <ButtonBase
              sx={{
                fontFamily: "inherit",
                px: "10px",
                py: "5px",
                border: "1px solid #e1d8d2",
                borderRadius: "16px",
                background: "#fff8f3",
                color: "#5b302a",
                fontSize: 9.5,
                fontWeight: 800,
              }}
            >
              {viewLabel}
            </ButtonBase>
          )}
        </Box>
      )}
    </Box>
  );
}

function RiskDetailsDialog({
  details,
  onClose,
}: Readonly<{ details: RiskCardDetails | null; onClose: () => void }>) {
  const remarks = details?.remarks ?? [];

  return (
    <CustomDialog
      open={details !== null}
      onClose={onClose}
      maxWidth="lg"
      showCloseIcon={false}
      paperSx={{ borderRadius: "8px" }}
      title={
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
            {details?.title}
          </Typography>
          <IconButton
            aria-label="Close dialog"
            onClick={onClose}
            sx={{ p: 0, color: colors.white }}
          >
            <CloseIcon width={22} height={22} />
          </IconButton>
        </Box>
      }
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(6, minmax(0, 1fr))",
          },
          gap: "6px",
        }}
      >
        {details?.fields.map((field) => (
          <Box key={field.name} sx={{ p: "6.4px", minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, color: "#827671" }}>{field.name}</Typography>
            <Typography
              sx={{
                mt: "2px",
                fontSize: 11,
                fontWeight: 800,
                color: "#332d2a",
                overflowWrap: "anywhere",
              }}
            >
              {field.value || "-"}
            </Typography>
          </Box>
        ))}
      </Box>

      {remarks.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gap: "8px",
            mt: "8px",
            pt: "12px",
            px: "6px",
            pb: "4px",
            borderTop: "1px solid #eadfda",
          }}
        >
          {remarks.map((remark) => (
            <Typography
              key={remark.name}
              sx={{ fontSize: 11, fontWeight: 800, color: "#332d2a", overflowWrap: "anywhere" }}
            >
              <Box component="span" sx={{ fontWeight: 600, color: "#827671" }}>
                {remark.name}:
              </Box>{" "}
              {remark.value || "-"}
            </Typography>
          ))}
        </Box>
      )}
    </CustomDialog>
  );
}

export function RiskCards({ cards, onView }: Readonly<RiskCardsProps>) {
  const [openDetails, setOpenDetails] = useState<RiskCardDetails | null>(null);

  if (cards.length === 0) return null;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1,
        background: "#fff",
        border: "1px solid #ded8d5",
        borderRadius: "12px",
        boxShadow: "0 2px 7px rgba(60, 42, 35, .07)",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          gap: "6px",
        }}
      >
        {cards.map((card) => {
          const { details } = card;
          const openCardDetails = details ? () => setOpenDetails(details) : undefined;
          return (
            <RiskCard
              key={card.id}
              title={card.title}
              tone={card.tone}
              fields={card.fields}
              viewLabel={card.viewLabel}
              onCardClick={onView ? () => onView(card) : openCardDetails}
              onOpenDetails={openCardDetails}
            />
          );
        })}
      </Box>

      <RiskDetailsDialog details={openDetails} onClose={() => setOpenDetails(null)} />
    </Box>
  );
}

export default RiskCards;
