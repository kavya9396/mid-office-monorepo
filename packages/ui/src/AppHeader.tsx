
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import {
  BusinessTypeToggle,
  type BusinessType,
} from "./BusinessTypeToggle";

import { CustomButton } from "./CustomButton";

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  businessType?: BusinessType;
  switchingBusiness?: boolean;
  onBusinessTypeChange?: (businessType: BusinessType) => void;
  onLogout?: () => void;
};

export function AppHeader({
  title,
  subtitle,
  businessType,
  switchingBusiness = false,
  onBusinessTypeChange,
  onLogout,
}: Readonly<AppHeaderProps>) {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="body2"
              sx={{ opacity: 0.85 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {businessType && onBusinessTypeChange && (
          <BusinessTypeToggle
            value={businessType}
            disabled={switchingBusiness}
            onChange={onBusinessTypeChange}
          />
        )}

        {onLogout && (
          <CustomButton
            onClick={onLogout}
            sx={{
              backgroundColor: "#ffffff",
              color: "#e65100",
              "&:hover": {
                backgroundColor: "#fff3e0",
              },
            }}
          >
            Logout
          </CustomButton>
        )}
      </Toolbar>
    </AppBar>
  );
}
