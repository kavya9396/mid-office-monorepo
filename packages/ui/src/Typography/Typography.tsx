import { Typography, type TypographyProps } from "@mui/material";

type CustomTypographyProps = TypographyProps;

const CustomTypography = (props: CustomTypographyProps) => (
  <Typography {...props} />
);

export default CustomTypography;
