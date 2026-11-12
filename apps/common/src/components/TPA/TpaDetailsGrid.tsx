import { CustomBox, CustomTypography } from "@insurance-poc/ui";
import { orderedTpaDetailKeys, tpaFieldLabel } from "./tpaFieldLabels";
import type { MedicalTpaDetails } from "./types";

type TpaDetailsGridProps = {
  details: MedicalTpaDetails;
};

function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <CustomBox
      sx={{
        minWidth: 0,
        py: 0.625,
        px: 0.25,
        display: "grid",
        gridTemplateColumns: {
          xs: "minmax(125px, 38%) minmax(0, 1fr)",
          sm: "minmax(150px, 34%) minmax(0, 1fr)",
        },
        columnGap: 1.5,
        alignItems: "baseline",
      }}
    >
      <CustomTypography
        component="div"
        sx={{
          m: 0,
          color: "#746b67",
          fontSize: "10px",
          fontWeight: 500,
          lineHeight: 1.25,
        }}
      >
        {label}
      </CustomTypography>
      <CustomTypography
        component="div"
        sx={{
          minWidth: 0,
          color: "#303030",
          fontSize: "11px",
          fontWeight: 700,
          lineHeight: 1.3,
          overflowWrap: "anywhere",
        }}
      >
        {value.trim().length > 0 ? value : "\u00a0"}
      </CustomTypography>
    </CustomBox>
  );
}

export function TpaDetailsGrid({ details }: Readonly<TpaDetailsGridProps>) {
  const keys = orderedTpaDetailKeys(details);

  return (
    <CustomBox
      sx={{
        minHeight: 0,
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        px: 1.75,
        py: 1,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        columnGap: 3.5,
        rowGap: 0.25,
        alignContent: "start",
        bgcolor: "#fff",
      }}
    >
      {keys.map((key) => (
        <DetailRow
          key={key}
          label={tpaFieldLabel(key)}
          value={details[key] ?? ""}
        />
      ))}
    </CustomBox>
  );
}
