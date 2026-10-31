import { useState } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { commonPaths } from "@insurance-poc/routes";
import { CustomButton, CustomSnackbar } from "@insurance-poc/ui";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useResetPasswordMutation } from "../../services/authApi";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthShell } from "./AuthShell";
import {
  apiResultMessage,
  authSnackbar,
  closedAuthSnackbar,
  readApiMessage,
  type AuthSnackbarState,
} from "./authFeedback";
import { resetPasswordSchema, type ResetPasswordForm } from "./resetPasswordSchema";

const SUCCESS_REDIRECT_MS = 1800;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetPassword] = useResetPasswordMutation();
  const [snackbar, setSnackbar] = useState<AuthSnackbarState>(closedAuthSnackbar);
  const token = searchParams.get("token")?.trim() ?? "";
  const hasToken = token.length > 0;

  const { control, handleSubmit, formState } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordForm) => {
    setSnackbar(closedAuthSnackbar);
    try {
      const result = await resetPassword({
        token,
        newPassword: values.newPassword,
      }).unwrap();
      const message = apiResultMessage(result.message, "Password reset");
      setSnackbar(authSnackbar(message, "success"));
      window.setTimeout(() => {
        navigate(commonPaths.login, { replace: true, state: { resetMessage: message } });
      }, SUCCESS_REDIRECT_MS);
    } catch (reason: unknown) {
      const message = readApiMessage(reason, "Unable to reset the password.");
      setSnackbar(authSnackbar(message, "error"));
    }
  };

  const submitLabel = formState.isSubmitting ? "Resetting..." : "Reset password";

  return (
    <>
      <AuthShell subtitle="Choose a new password">
        {hasToken ? (
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <AuthPasswordField
              name="newPassword"
              control={control}
              label="New password"
              placeholder="Enter your new password"
              autoComplete="new-password"
            />
            <AuthPasswordField
              name="confirmPassword"
              control={control}
              label="Confirm password"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />

            <Link
              component={RouterLink}
              to={commonPaths.login}
              underline="hover"
              sx={{
                alignSelf: "flex-start",
                color: "#E45F14",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Back to login
            </Link>

            <CustomButton
              fullWidth
              variant="contained"
              type="submit"
              disabled={!formState.isValid || formState.isSubmitting}
              sx={{ py: 1.25, borderRadius: "50px" }}
            >
              {submitLabel}
            </CustomButton>
          </Box>
        ) : (
          <Typography role="alert" sx={{ fontSize: "13px", color: "#9A2529" }}>
            This reset link is missing a token. Request a new link from the login page.
          </Typography>
        )}
      </AuthShell>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(closedAuthSnackbar)}
      />
    </>
  );
}
