import { Box } from "@mui/material";
import { FieldItem, type FieldData } from "./Fields";

export function Lifestyle({ fields }: Readonly<{ fields: FieldData[] }>) {
  return (
    <Box
      sx={{
        p: 1,
        backgroundColor: "background.default",
        borderRadius: "8px",
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(5, minmax(0, 1fr))",
        },
        columnGap: 1.5,
        rowGap: 1.25,
      }}
    >
      {fields.map((field) => (
        <FieldItem key={field.label} {...field} />
      ))}
    </Box>
  );
}
