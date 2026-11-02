import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { GuwRiskCard } from "../../services/guwService";

/** Card types that also render the "View Financial / Medical" pill button. */
const VIEW_PILL_TYPES = new Set(["FINANCIAL", "MEDICAL"]);

const VIEW_LABEL: Record<string, string> = {
  FINANCIAL: "View Financial",
  MEDICAL: "View Medical",
};

export type GuwRiskCardsProps = {
  riskCards: GuwRiskCard[];
  /**
   * Called with the card type ("FINANCIAL" | "MEDICAL" | "RISK_PARAMETERS") when either the
   * round-arrow or the view-pill is clicked — opens the expanded-attributes popup.
   */
  onView?: (type: string) => void;
};

export function GuwRiskCards({ riskCards, onView }: Readonly<GuwRiskCardsProps>) {
  return (
    <>
      {riskCards.map((card) => {
        const hasExpanded = card.expandedAttributes.length > 0;
        const showPill = VIEW_PILL_TYPES.has(card.type);

        return (
          <Box
            key={card.type}
            sx={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              padding: "10px",
              border: `1px solid ${card.accentColor ?? "#b8dcc0"}`,
              borderTop: `5px solid ${card.accentColor ?? "#28743c"}`,
              borderRadius: "12px",
              background: "#fff",
              cursor: "default",
              transition: "transform .15s, box-shadow .15s",
              "&:hover": { transform: "translateY(-1px)", boxShadow: "0 3px 8px rgba(50,40,35,.10)" },
            }}
          >
            {/* Card heading row: title + round-arrow (beside title) */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#302a27" }}>
                {card.title}
              </Typography>

              {hasExpanded && onView && (
                <Box
                  component="button"
                  onClick={() => onView(card.type)}
                  aria-label={`View ${card.title} details`}
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: "26px",
                    height: "22px",
                    border: "1px solid #e1d8d2",
                    borderRadius: "12px",
                    background: "#fff8f3",
                    color: "#a92129",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                    flexShrink: 0,
                    "&:hover": { background: "#f9ede7" },
                  }}
                >
                  ›
                </Box>
              )}
            </Box>

            {/* Card fields */}
            <Box sx={{ mt: "8px", flex: 1 }}>
              {card.attributes.map((attr) => (
                <Typography
                  key={attr.name}
                  component="div"
                  sx={{ fontSize: 10.5, mt: "3px", lineHeight: 1.35, color: "#302a27" }}
                >
                  {attr.name}:{" "}
                  <Box
                    component="span"
                    sx={{ fontWeight: 700, color: card.valueColor ?? "#302a27" }}
                  >
                    {attr.value || "-"}
                  </Box>
                </Typography>
              ))}
            </Box>

            {/* View pill — only on Financial and Medical, at the bottom */}
            {showPill && onView && (
              <Box sx={{ mt: "10px" }}>
                <Box
                  component="button"
                  onClick={() => onView(card.type)}
                  sx={{
                    cursor: "pointer",
                    padding: "5px 10px",
                    border: "1px solid #e1d8d2",
                    borderRadius: "16px",
                    background: "#fff8f3",
                    color: "#5b302a",
                    fontSize: "9.5px",
                    fontWeight: 800,
                    fontFamily: "inherit",
                    "&:hover": { background: "#f9ede7", borderColor: "#e45f14" },
                  }}
                >
                  {VIEW_LABEL[card.type] ?? `View ${card.title}`}
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
}
