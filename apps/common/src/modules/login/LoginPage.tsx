import { useEffect, useState, type FormEventHandler } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import { zodResolver } from "@hookform/resolvers/zod";
import { assignUrl, businessInboxUrl, commonPaths } from "@insurance-poc/routes";
import { CustomButton, CustomSnackbar, CustomTextField, EyeIcon, EyeSlashIcon } from "@insurance-poc/ui";
import {
  clearSession,
  setLastLoginAt,
  setFirstLoginChangePending,
  setRefreshToken,
  setSessionBusinessType,
  setSessionId,
  setSessionUser,
  setToken,
} from "@insurance-poc/utils";
import { Controller, useForm, type Control } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../services/authApi";
import { fetchAndStoreMasterData } from "../../services/masterDataService";
import {
  loginRequiresPasswordChange,
  type BusinessType,
} from "../../services/loginService";
import { BusinessTypeTabs } from "./BusinessTypeTabs";
import { AuthShell, authCompactLaptop, authShortLaptop } from "./AuthShell";
import {
  authSnackbar,
  closedAuthSnackbar,
  readApiMessage,
  type AuthSnackbarState,
  type SnackbarSeverity,
} from "./authFeedback";
import { ForgotPasswordDialog } from "./ForgotPasswordDialog";
import { loginSchema, type LoginForm } from "./loginSchema";

type SubmissionState = {
  canSubmit: boolean;
  submitting: boolean;
  loadingMasters: boolean;
};

type CredentialsFormProps = {
  businessType: BusinessType;
  onBusinessTypeChange: (value: BusinessType) => void;
  control: Control<LoginForm>;
  passwordVisible: boolean;
  onTogglePassword: () => void;
  submission: SubmissionState;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onForgotPassword: () => void;
};

function readResetMessage(state: unknown): string {
  if (typeof state !== "object" || state === null) return "";
  const message = (state as Record<string, unknown>).resetMessage;
  return typeof message === "string" ? message.trim() : "";
}

type LoginSuccessHandlerArgs = {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: Parameters<typeof setSessionUser>[0];
  firstLogin: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string;
  businessType: BusinessType;
  navigateToChangePassword: () => void;
};

function applyLoginSession({
  accessToken,
  refreshToken,
  sessionId,
  user,
  lastLoginAt,
  businessType,
}: Omit<
  LoginSuccessHandlerArgs,
  "firstLogin" | "mustChangePassword" | "navigateToChangePassword"
>): void {
  setToken(accessToken);
  setRefreshToken(refreshToken);
  setSessionId(sessionId);
  setSessionUser(user);
  setSessionBusinessType(businessType);
  setLastLoginAt(lastLoginAt);
}

async function completeLoginAfterAuth(args: LoginSuccessHandlerArgs): Promise<void> {
  const {
    mustChangePassword,
    businessType,
    navigateToChangePassword,
    accessToken,
    refreshToken,
    sessionId,
    user,
    lastLoginAt,
  } = args;
  const needsPasswordChange = loginRequiresPasswordChange(mustChangePassword);

  if (needsPasswordChange) {
    setFirstLoginChangePending(true);
    applyLoginSession({ accessToken, refreshToken, sessionId, user, lastLoginAt, businessType });
    navigateToChangePassword();
    return;
  }

  setFirstLoginChangePending(false);
  applyLoginSession({ accessToken, refreshToken, sessionId, user, lastLoginAt, businessType });
  await fetchAndStoreMasterData();
  const destination = businessInboxUrl(businessType);
  if (!destination) {
    throw new Error("Business Inbox is not configured.");
  }
  assignUrl(destination);
}

function CredentialsForm({
  businessType,
  onBusinessTypeChange,
  control,
  passwordVisible,
  onTogglePassword,
  submission,
  onSubmit,
  onForgotPassword,
}: Readonly<CredentialsFormProps>) {
  const passwordLabel = passwordVisible ? "Hide password" : "Show password";
  const submitLabel = submission.submitting
    ? submission.loadingMasters
      ? "Loading reference data..."
      : "Signing in..."
    : "Log In";

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        [authCompactLaptop]: { gap: 1.25 },
        [authShortLaptop]: { gap: 1 },
      }}
    >
      <BusinessTypeTabs value={businessType} onChange={onBusinessTypeChange} />

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

      <CustomButton
        fullWidth
        variant="contained"
        type="submit"
        disabled={!submission.canSubmit}
        sx={{
          mt: 1,
          py: 1.25,
          borderRadius: "50px",
          [authCompactLaptop]: { mt: 0.5, py: 1 },
          [authShortLaptop]: { mt: 0, py: 0.75 },
        }}
      >
        {submitLabel}
      </CustomButton>
    </Box>
  );
}

export function LoginPage() {
  const [businessType, setBusinessType] = useState<BusinessType>("RETAIL");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [snackbar, setSnackbar] = useState<AuthSnackbarState>(closedAuthSnackbar);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotUserId, setForgotUserId] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const [login] = useLoginMutation();
  const { control, handleSubmit, formState, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    const resetMessage = readResetMessage(location.state);
    if (resetMessage.length === 0) return;
    setSnackbar(authSnackbar(resetMessage, "success"));
    navigate(commonPaths.login, { replace: true, state: null });
  }, [location.state, navigate]);

  const showNotify = (message: string, severity: SnackbarSeverity) => {
    setSnackbar(authSnackbar(message, severity));
  };

  const onSubmit = async (credentials: LoginForm) => {
    setSnackbar(closedAuthSnackbar);
    try {
      const loginResult = await login({
        userId: credentials.username,
        password: credentials.password,
        businessType,
      }).unwrap();
      const needsPasswordChange = loginRequiresPasswordChange(loginResult.mustChangePassword);
      if (!needsPasswordChange) {
        setLoadingMasters(true);
      }
      try {
        await completeLoginAfterAuth({
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          sessionId: loginResult.sessionId,
          user: { username: loginResult.user.username, displayName: loginResult.user.displayName },
          firstLogin: loginResult.firstLogin,
          mustChangePassword: loginResult.mustChangePassword,
          lastLoginAt: loginResult.lastLoginAt,
          businessType,
          navigateToChangePassword: () => navigate(commonPaths.changePassword),
        });
      } catch (reason: unknown) {
        clearSession();
        showNotify(readApiMessage(reason, "Unable to load master data."), "error");
      } finally {
        if (!needsPasswordChange) {
          setLoadingMasters(false);
        }
      }
    } catch (reason: unknown) {
      clearSession();
      showNotify(readApiMessage(reason, "Login failed."), "error");
    }
  };

  const submission: SubmissionState = {
    canSubmit: formState.isValid && !formState.isSubmitting && !loadingMasters,
    submitting: formState.isSubmitting || loadingMasters,
    loadingMasters,
  };

  return (
    <>
      <AuthShell subtitle="Log in to access your account" showLegalLinks contentOverflow="hidden">
        <CredentialsForm
          businessType={businessType}
          onBusinessTypeChange={setBusinessType}
          control={control}
          passwordVisible={showPassword}
          onTogglePassword={() => setShowPassword((visible) => !visible)}
          submission={submission}
          onSubmit={handleSubmit(onSubmit)}
          onForgotPassword={() => {
            setForgotUserId(getValues("username"));
            setForgotPasswordOpen(true);
          }}
        />
      </AuthShell>

      <ForgotPasswordDialog
        open={forgotPasswordOpen}
        initialUserId={forgotUserId}
        onClose={() => setForgotPasswordOpen(false)}
        onNotify={showNotify}
      />

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(closedAuthSnackbar)}
      />
    </>
  );
}
