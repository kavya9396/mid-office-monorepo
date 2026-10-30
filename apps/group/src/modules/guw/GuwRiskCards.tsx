import { DetailCard } from "@insurance-poc/common/detail-card";
import type { GuwRiskCard } from "../../services/guwService";

export type GuwRiskCardsProps = {
  riskCards: GuwRiskCard[];
};

/**
 * Renders each risk card using the shared DetailCard component.
 * Data is pre-shaped by the API (same pattern as DVT cards).
 * Returns a fragment so cards sit directly in the parent 4-column grid.
 */
export function GuwRiskCards({ riskCards }: Readonly<GuwRiskCardsProps>) {
  return (
    <>
      {riskCards.map((card) => (
        <DetailCard
          key={card.type}
          title={card.title}
          attributes={card.attributes}
          expandedAttributes={card.expandedAttributes}
          dialogTitle={`${card.title} Details`}
          dialogMaxWidth="sm"
          accentColor={card.accentColor}
          valueColor={card.valueColor}
        />
      ))}
    </>
  );
}
