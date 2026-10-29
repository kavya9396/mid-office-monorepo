import { useState, type FormEventHandler } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignUrl, businessInboxUrl, commonPaths } from "@insurance-poc/routes";
import {
  CustomButton,
  CustomSnackbar,
  CustomTabs,
  CustomTextField,
  EyeIcon,
  EyeSlashIcon,
  type TabItem,
} from "@insurance-poc/ui";
import {
  clearToken,
  setMustChangePassword,
  setRefreshToken,
  setSessionBusinessType,
  setSessionUser,
  setToken,
} from "@insurance-poc/utils";
import { Controller, useForm, type Control } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import IBMLogo from "../../assets/IBM Logo.svg";
import IPRULogo from "../../assets/ICICI_Logo_BG.svg";
import LoginImage from "../../assets/Login-Image.svg";
import { useLoginMutation } from "../../services/authApi";
import type { BusinessType } from "../../services/loginService";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { loginSchema, type LoginForm } from "./loginSchema";

type SnackbarState = {
  open: boolean;
  message: string;
};

type SubmissionState = {
  canSubmit: boolean;
  submitting: boolean;
};

type CredentialsFormProps = {
  businessType: BusinessType;
  onBusinessTypeChange: (value: BusinessType) => void;
  control: Control<LoginForm>;
  passwordVisible: boolean;
  onTogglePassword: () => void;
  submission: SubmissionState;
  apiError: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onForgotPassword: () => void;
};

const businessTabs: TabItem<BusinessType>[] = [
  { key: "RETAIL", label: "Retail" },
  { key: "GROUP", label: "Group" },
];

const initialSnackbar: SnackbarState = {
  open: false,
  message: "",
};

const inlineLinkSx = {
  border: 0,
  p: 0,
  bgcolor: "transparent",
  font: "inherit",
  verticalAlign: "baseline",
  cursor: "pointer",
};

const compactLaptop = "@media (max-height: 800px)";
const shortLaptop = "@media (max-height: 680px)";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function messageFromData(data: unknown): string {
  if (typeof data === "string") return data.trim();
  if (!isRecord(data)) return "";
  return readTrimmedString(data.message) || readTrimmedString(data.errorMessage);
}

function toErrorMessage(reason: unknown, fallback: string): string {
  if (typeof reason === "string") {
    const text = reason.trim();
    return text.length > 0 ? text : fallback;
  }
  if (reason instanceof Error) {
    const text = reason.message.trim();
    return text.length > 0 ? text : fallback;
  }
  if (!isRecord(reason)) return fallback;

  return (
    readTrimmedString(reason.error) ||
    readTrimmedString(reason.message) ||
    messageFromData(reason.data) ||
    fallback
  );
}

function readResetMessage(state: unknown): string {
  if (!isRecord(state)) return "";
  return readTrimmedString(state.resetMessage);
}

type LoginSuccessHandlerArgs = {
  accessToken: string;
  refreshToken: string;
  user: Parameters<typeof setSessionUser>[0];
  firstLogin: boolean;
  mustChangePassword: boolean;
  businessType: BusinessType;
  navigateToChangePassword: () => void;
};

function handleLoginSuccess({
  accessToken,
  refreshToken,
  user,
  firstLogin,
  mustChangePassword,
  businessType,
  navigateToChangePassword,
}: LoginSuccessHandlerArgs): void {
  setToken(accessToken);
  setRefreshToken(refreshToken);
  setSessionUser(user);
  setSessionBusinessType(businessType);

  // Server is source of truth: force change-password only when firstLogin / mustChangePassword is true.
  // Never persist mustChangePassword=false in sessionStorage.
  if (firstLogin || mustChangePassword) {
    setMustChangePassword(true);
    navigateToChangePassword();
    return;
  }

  setMustChangePassword(false);
  const destination = businessInboxUrl(businessType);
  if (!destination) {
    throw new Error("Business Inbox is not configured.");
  }
  assignUrl(destination);
}

function LoginArtwork() {
  return (
    <Box
      sx={{
        width: { xs: "0%", md: "50%" },
        minHeight: 0,
        display: { xs: "none", md: "block" },
        overflow: "hidden",
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
          display: "block",
          objectFit: "cover",
        }}
      />
    </Box>
  );
}

function LoginIntro() {
  return (
    <Box>
      <Box
        component="img"
        src={IPRULogo}
        alt="ICICI Prudential Life Insurance"
        sx={{
          height: 72,
          width: "auto",
          mb: 1.5,
          [compactLaptop]: { height: 52, mb: 1 },
          [shortLaptop]: { height: 40, mb: 0.5 },
        }}
      />
      <Typography variant="body1" color="text.secondary">
        Log in to access your account
      </Typography>
    </Box>
  );
}

function CredentialsForm({
  businessType,
  onBusinessTypeChange,
  control,
  passwordVisible,
  onTogglePassword,
  submission,
  apiError,
  onSubmit,
  onForgotPassword,
}: Readonly<CredentialsFormProps>) {
  const passwordLabel = passwordVisible ? "Hide password" : "Show password";
  const submitLabel = submission.submitting ? "Signing in..." : "Log In";

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        [compactLaptop]: { gap: 1.25 },
        [shortLaptop]: { gap: 1 },
      }}
    >
      <Box>
        <Typography sx={{ fontSize: "12px", fontWeight: 600, mb: 0.75 }}>
          Business type
        </Typography>
        <CustomTabs
          tabs={businessTabs}
          value={businessType}
          onChange={onBusinessTypeChange}
          sx={{
            [compactLaptop]: { p: 0.5, gap: 0.5 },
            "& button": {
              [compactLaptop]: { py: 0.75 },
              [shortLaptop]: { py: 0.5 },
            },
          }}
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
              type={passwordVisible ? "text" : "password"}
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
                        aria-label={passwordLabel}
                        aria-pressed={passwordVisible}
                        edge="end"
                        onClick={onTogglePassword}
                      >
                        {passwordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={onForgotPassword}
          sx={{
            alignSelf: "flex-start",
            mt: 1,
            border: 0,
            p: 0,
            bgcolor: "transparent",
            color: "#E45F14",
            font: "inherit",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Forgot password?
        </Link>
      </Box>

      {apiError ? (
        <Typography role="alert" sx={{ fontSize: "12px", color: "#9A2529" }}>
          {apiError}
        </Typography>
      ) : null}

      <CustomButton
        fullWidth
        variant="contained"
        type="submit"
        disabled={!submission.canSubmit}
        sx={{
          mt: 1,
          py: 1.25,
          borderRadius: "50px",
          [compactLaptop]: { mt: 0.5, py: 1 },
          [shortLaptop]: { mt: 0, py: 0.75 },
        }}
      >
        {submitLabel}
      </CustomButton>
    </Box>
  );
}

function LegalFooter() {
  return (
    <Box sx={{ textAlign: "center" }}>
      <Divider sx={{ mb: 1, [compactLaptop]: { mb: 0.5 } }} />
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "11px" }}
      >
        © 2026 ICICI Prudential Insurance,&nbsp;
        <Link
          component="button"
          type="button"
          underline="hover"
          sx={inlineLinkSx}
        >
          Privacy Policy
        </Link>
        &nbsp; | &nbsp;
        <Link
          component="button"
          type="button"
          underline="hover"
          sx={inlineLinkSx}
        >
          Terms and Conditions
        </Link>
      </Typography>
    </Box>
  );
}

function PoweredBy() {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        py: 2,
        [compactLaptop]: { py: 1 },
        [shortLaptop]: { py: 0.75 },
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
  );
}

export function LoginPage() {
  const [businessType, setBusinessType] = useState<BusinessType>("RETAIL");
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(initialSnackbar);
  const [apiError, setApiError] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotUserId, setForgotUserId] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const resetMessage = readResetMessage(location.state);

  const [login] = useLoginMutation();
  const { control, handleSubmit, formState, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (credentials: LoginForm) => {
    setApiError("");
    try {
      const loginResult = await login({
        userId: credentials.username,
        password: credentials.password,
        businessType,
      }).unwrap();
      handleLoginSuccess({
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        user: loginResult.user,
        firstLogin: loginResult.firstLogin,
        mustChangePassword: loginResult.mustChangePassword,
        businessType,
        navigateToChangePassword: () => navigate(commonPaths.changePassword),
      });
    } catch (reason: unknown) {
      clearToken();
      const message = toErrorMessage(reason, "Login failed.");
      setApiError(message);
      setSnackbar({ open: true, message });
    }
  };

  const submission: SubmissionState = {
    canSubmit: formState.isValid && !formState.isSubmitting,
    submitting: formState.isSubmitting,
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
        overflow: "hidden",
        bgcolor: "#FFFFFF",
      }}
    >
      <LoginArtwork />

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
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 4,
            py: 3,
            gap: 2.5,
            [compactLaptop]: { py: 1.5, gap: 1.5 },
            [shortLaptop]: { py: 1, gap: 1 },
          }}
        >
          <LoginIntro />
          {resetMessage ? (
            <Typography role="alert" sx={{ fontSize: "13px", color: "#1B7F3A" }}>
              {resetMessage}
            </Typography>
          ) : null}
          <CredentialsForm
            businessType={businessType}
            onBusinessTypeChange={setBusinessType}
            control={control}
            passwordVisible={showPassword}
            onTogglePassword={() => setShowPassword((visible) => !visible)}
            submission={submission}
            apiError={apiError}
            onSubmit={handleSubmit(onSubmit)}
            onForgotPassword={() => {
              setForgotUserId(getValues("username"));
              setForgotPasswordOpen(true);
            }}
          />
          <LegalFooter />
        </Box>
        <PoweredBy />
      </Box>

      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        initialUserId={forgotUserId}
        onClose={() => setForgotPasswordOpen(false)}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity="error"
        onClose={() => setSnackbar(initialSnackbar)}
      />
    </Box>
  );
}
