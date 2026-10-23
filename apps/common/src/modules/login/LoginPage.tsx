import { useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignUrl, businessInboxUrl } from "@insurance-poc/routes";
import {
  AppButton,
  CustomSnackbar,
  CustomTabs,
  CustomTextField,
  EyeIcon,
  EyeSlashIcon,
  type TabItem,
} from "@insurance-poc/ui";
import {
  clearToken,
  setSessionBusinessType,
  setSessionUser,
  setToken,
} from "@insurance-poc/utils";
import { Controller, useForm } from "react-hook-form";
import IBMLogo from "../../assets/IBM Logo.svg";
import IPRULogo from "../../assets/ICICI_Logo_BG.svg";
import LoginImage from "../../assets/Login-Image.svg";
import { fetchJwt } from "../../services/jwtService";
import { fetchLogin, type BusinessType } from "../../services/loginService";
import { loginSchema, type LoginForm } from "./loginSchema";

type SnackbarState = {
  open: boolean;
  message: string;
};

const businessTabs: TabItem<BusinessType>[] = [
  { key: "RETAIL", label: "Retail" },
  { key: "GROUP", label: "Group" },
];

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
};

export function LoginPage() {
  const [businessType, setBusinessType] = useState<BusinessType>("RETAIL");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);

  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const openErrorSnackbar = (message: string) => {
    setSnackbar({ open: true, message });
  };

  const onSubmit = async (credentials: LoginForm) => {
    try {
      const jwt = await fetchJwt();
      const token = typeof jwt.token === "string" ? jwt.token.trim() : "";

      if (!token) {
        throw new Error("Authentication token was not returned.");
      }

      setToken(token);

      const loginResult = await fetchLogin(credentials.username, businessType);
      if (loginResult.status !== "SUCCESS") {
        throw new Error(loginResult.message);
      }

      const destination = businessInboxUrl(businessType);
      if (!destination) throw new Error("Business Inbox is not configured.");

      setSessionUser(loginResult.user);
      setSessionBusinessType(businessType);
      assignUrl(destination);
    } catch (reason: unknown) {
      clearToken();
      openErrorSnackbar(
        reason instanceof Error ? reason.message : "Login failed.",
      );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          width: { xs: "0%", md: "50%" },
          display: { xs: "none", md: "block" },
          position: "relative",
        }}
      >
        <Box
          component="img"
          src={LoginImage}
          alt="Underwriter reviewing an insurance form"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </Box>

      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 4,
            py: 3,
            gap: 2.5,
          }}
        >
          <Box>
            <Box
              component="img"
              src={IPRULogo}
              alt="ICICI Prudential Life Insurance"
              sx={{ height: 72, width: "auto", mb: 1.5 }}
            />
            <Typography variant="body1" color="text.secondary">
              Log in to access your account
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "12px", fontWeight: 600, mb: 0.75 }}>
                Business type
              </Typography>
              <CustomTabs
                tabs={businessTabs}
                value={businessType}
                onChange={setBusinessType}
              />
            </Box>

            <Controller
              name="username"
              control={control}
              render={({ field, fieldState }) => (
                <CustomTextField
                  fullWidth
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  labelText="User ID"
                  mandatory
                  placeholder="Enter your User ID"
                  autoComplete="username"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Box>
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <CustomTextField
                    fullWidth
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    type={showPassword ? "text" : "password"}
                    labelText="Password"
                    mandatory
                    placeholder="Enter your Password"
                    autoComplete="current-password"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              aria-pressed={showPassword}
                              edge="end"
                              onClick={() =>
                                setShowPassword((visible) => !visible)
                              }
                            >
                              {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />

              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "10px" }}
                >
                  It must be at least 8 characters long and include letters and
                  numbers.
                </Typography>

                <Link
                  component="button"
                  type="button"
                  underline="hover"
                  sx={{
                    alignSelf: "flex-start",
                    flexShrink: 0,
                    border: 0,
                    p: 0,
                    bgcolor: "transparent",
                    color: "#E45F14",
                    fontFamily: "inherit",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </Link>
              </Box>
            </Box>

            <AppButton
              fullWidth
              variant="contained"
              type="submit"
              disabled={!formState.isValid || formState.isSubmitting}
              sx={{ mt: 1, py: 1.25, borderRadius: "50px" }}
            >
              {formState.isSubmitting ? "Signing in..." : "Log In"}
            </AppButton>
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Divider sx={{ mb: 1 }} />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "11px" }}
            >
              © 2026 ICICI Prudential Insurance,&nbsp;
              <Link href="#" underline="hover">
                Privacy Policy
              </Link>
              &nbsp; | &nbsp;
              <Link href="#" underline="hover">
                Terms and Conditions
              </Link>
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            py: 2,
          }}
        >
          <Typography variant="body2">Powered by</Typography>
          <Box
            component="img"
            src={IBMLogo}
            alt="IBM Logo"
            sx={{ height: 28, width: "auto" }}
          />
        </Box>
      </Box>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity="error"
        onClose={() => setSnackbar(initialSnackbar)}
      />
    </Box>
  );
}
