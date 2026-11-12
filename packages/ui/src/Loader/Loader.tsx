import {
  Box,
  CircularProgress,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

type LoaderProps = {
  message?: string;
  description?: string;
  height?: string | number;
  fullScreen?: boolean;
  size?: number;
  thickness?: number;
  color?: string;
  sx?: SxProps<Theme>;
};

const Loader = ({
  message = "Loading",
  description,
  size = 42,
  thickness = 4,
  color = "#f58220",
  height,
  fullScreen = false,
  sx,
}: LoaderProps) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: height ?? "100vh",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        backgroundColor: "#f5f7fa",
        ...(fullScreen
          ? {
              position: "fixed",
              inset: 0,
              zIndex: (theme) => theme.zIndex.modal + 2,
            }
          : {}),
        ...sx,
      }}
    >
      <CircularProgress
        size={size}
        thickness={thickness}
        sx={{
          color,
        }}
      />

      {message && (
        <Typography
          variant="body2"
          sx={{
            color: "text.primary",
            fontWeight: 500,
          }}
        >
          {message + "..."}
        </Typography>
      )}

      {description && (
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            textAlign: "center",
            maxWidth: 320,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
};

export default Loader;
