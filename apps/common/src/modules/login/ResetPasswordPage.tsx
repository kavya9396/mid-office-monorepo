import { useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { commonPaths } from "@insurance-poc/routes";
import { CustomButton, CustomTextField, EyeIcon, EyeSlashIcon } from "@insurance-poc/ui";
import { Controller, useForm, type Control } from "react-hook-form";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import IBMLogo from "../../assets/IBM Logo.svg";
import IPRULogo from "../../assets/ICICI_Logo_BG.svg";
import LoginImage from "../../assets/Login-Image.svg";
import { useResetPasswordMutation } from "../../services/authApi";
import { resetPasswordSchema, type ResetPasswordForm } from "./resetPasswordSchema";

const compactLaptop = "@media (max-height: 800px)";
const shortLaptop = "@media (max-height: 680px)";

function readApiMessage(reason: unknown): string {
  if (typeof reason === "string" && reason.trim().length > 0) return reason.trim();
  if (reason instanceof Error && reason.message.length > 0) return reason.message;
  if (typeof reason === "object" && reason !== null) {
    const record = reason as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.length > 0) return record.error;
    if (typeof record.message === "string" && record.message.length > 0) return record.message;
  }
  return "";
}

function LoginArtwork() {
  return (
    <Box
      sx={{
        width: { xs: "0%", md: "50%" },
        minHeight: 0,
        display: { xs: "none", md: "block" },
        overflow: "hidden",
      }}
    >
      <Box
        component="img"
        src={LoginImage}
        alt="Underwriter reviewing an insurance form"
        sx={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
      />
    </Box>
  );
}

type PasswordFieldProps = {
  name: "newPassword" | "confirmPassword";
  control: Control<ResetPasswordForm>;
  label: string;
  placeholder: string;
  autoComplete: string;
};

function PasswordField({
  name,
  control,
  label,
  placeholder,
  autoComplete,
}: Readonly<PasswordFieldProps>) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = visible ? `Hide ${label}` : `Show ${label}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomTextField
          fullWidth
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          type={visible ? "text" : "password"}
          labelText={label}
          mandatory
          placeholder={placeholder}
          autoComplete={autoComplete}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label={visibilityLabel}
                    aria-pressed={visible}
                    edge="end"
                    onClick={() => setVisible((current) => !current)}
                  >
                    {visible ? <EyeSlashIcon /> : <EyeIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resetPassword] = useResetPasswordMutation();
  const [apiMessage, setApiMessage] = useState("");
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
    setApiMessage("");
    try {
      const result = await resetPassword({
        token,
        newPassword: values.newPassword,
      }).unwrap();
      navigate(commonPaths.login, {
        replace: true,
        state: { resetMessage: result.message },
      });
    } catch (reason: unknown) {
      const message = readApiMessage(reason);
      if (message.length > 0) setApiMessage(message);
    }
  };

  const submitLabel = formState.isSubmitting ? "Resetting..." : "Reset password";

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
            overflow: "auto",
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
              Choose a new password
            </Typography>
          </Box>

          {hasToken ? (
            <Box
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              <PasswordField
                name="newPassword"
                control={control}
                label="New password"
                placeholder="Enter your new password"
                autoComplete="new-password"
              />
              <PasswordField
                name="confirmPassword"
                control={control}
                label="Confirm password"
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />

              {apiMessage ? (
                <Typography role="alert" sx={{ fontSize: "12px", color: "#9A2529" }}>
                  {apiMessage}
                </Typography>
              ) : null}

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

          <Box sx={{ textAlign: "center" }}>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px" }}>
              © 2026 ICICI Prudential Insurance
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
          <Box component="img" src={IBMLogo} alt="IBM Logo" sx={{ height: 28, width: "auto" }} />
        </Box>
      </Box>
    </Box>
  );
}
