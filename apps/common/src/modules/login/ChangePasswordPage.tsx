import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { commonPaths } from "@insurance-poc/routes";
import { CustomButton, CustomSnackbar } from "@insurance-poc/ui";
import { getToken, clearToken } from "@insurance-poc/utils";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useChangePasswordMutation } from "../../services/authApi";
import { AuthPasswordField } from "./AuthPasswordField";
import { AuthShell } from "./AuthShell";
import {
  apiResultMessage,
  authSnackbar,
  closedAuthSnackbar,
  readApiMessage,
  type AuthSnackbarState,
} from "./authFeedback";
import { changePasswordSchema, type ChangePasswordForm } from "./changePasswordSchema";

const SUCCESS_REDIRECT_MS = 1800;

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [changePassword] = useChangePasswordMutation();
  const [snackbar, setSnackbar] = useState<AuthSnackbarState>(closedAuthSnackbar);
  const [redirecting, setRedirecting] = useState(false);
  const hasToken = (getToken()?.trim().length ?? 0) > 0;
  const { control, handleSubmit, formState } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordForm) => {
    setSnackbar(closedAuthSnackbar);
    try {
      const result = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      }).unwrap();
      clearToken();
      const message = apiResultMessage(result.message, "Password changed");
      setSnackbar(authSnackbar(message, "success"));
      setRedirecting(true);
      window.setTimeout(() => {
        navigate(commonPaths.login, { replace: true });
      }, SUCCESS_REDIRECT_MS);
    } catch (reason: unknown) {
      const message = readApiMessage(reason, "Unable to change the password.");
      setSnackbar(authSnackbar(message, "error"));
    }
  };

  return (
    <>
      <AuthShell subtitle="Change your password">
        {hasToken || redirecting ? (
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <AuthPasswordField
              name="oldPassword"
              control={control}
              label="Current password"
              placeholder="Enter your current password"
              autoComplete="current-password"
            />
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

            <CustomButton
              fullWidth
              variant="contained"
              type="submit"
              disabled={!formState.isValid || formState.isSubmitting || redirecting}
              sx={{ py: 1.25, borderRadius: "50px" }}
            >
              {formState.isSubmitting ? "Saving..." : "Change password"}
            </CustomButton>
          </Box>
        ) : (
          <Typography role="alert" sx={{ fontSize: "13px", color: "#9A2529" }}>
            Sign in before changing your password.
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
