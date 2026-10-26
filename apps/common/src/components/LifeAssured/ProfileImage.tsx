import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { colors, CustomDialog } from "@insurance-poc/ui";

type ProfileImageProps = {
  /** Applicant label shown under the photo. */
  label: string;
  /** Photo url. When empty the first letter of the label is shown. */
  image?: string;
};

export function ProfileImage({ label, image }: Readonly<ProfileImageProps>) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        p: 1,
        bgcolor: colors.surfaceTint,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.75,
        borderRight: { sm: `1px solid ${colors.borderAccent}` },
        borderBottom: { xs: `1px solid ${colors.borderAccent}`, sm: 0 },
      }}
    >
      <Box
        component="button"
        type="button"
        aria-label="View applicant photo"
        onClick={() => image && setOpen(true)}
        sx={{
          width: 80,
          maxWidth: "100%",
          height: 96,
          borderRadius: "6px",
          p: 0,
          border: `1px solid ${colors.borderPhoto}`,
          bgcolor: colors.white,
          overflow: "hidden",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          color: "primary.main",
          fontSize: 28,
          fontWeight: 800,
          cursor: image ? "pointer" : "default",
        }}
      >
        {image ? (
          <Box
            component="img"
            src={image}
            alt="Applicant"
            sx={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          label.charAt(0).toUpperCase() || "A"
        )}
      </Box>
      <Typography sx={{ color: "primary.main", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
        {label}
      </Typography>

      <CustomDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Profile Image"
        maxWidth="xs"
        contentSx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3 }}
      >
        {image && (
          <Box
            component="img"
            src={image}
            alt="Profile preview"
            sx={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "40vh",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
        )}
      </CustomDialog>
    </Box>
  );
}
