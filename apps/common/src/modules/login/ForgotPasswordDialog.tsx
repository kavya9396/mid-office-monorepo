import { useEffect } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomButton, CustomDialog, CustomTextField } from "@insurance-poc/ui";
import { Controller, useForm } from "react-hook-form";
import { useForgotPasswordMutation } from "../../services/authApi";
import { readApiMessage, type SnackbarSeverity } from "./authFeedback";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "./forgotPasswordSchema";

type ForgotPasswordDialogProps = {
  open: boolean;
  initialUserId: string;
  onClose: () => void;
  onNotify: (message: string, severity: SnackbarSeverity) => void;
};

export function ForgotPasswordDialog({
  open,
  initialUserId,
  onClose,
  onNotify,
}: Readonly<ForgotPasswordDialogProps>) {
  const [forgotPassword] = useForgotPasswordMutation();
  const { control, handleSubmit, reset, formState } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { userId: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ userId: initialUserId });
  }, [open, initialUserId, reset]);

  const onSubmit = async (values: ForgotPasswordForm) => {
    try {
      const result = await forgotPassword({ userId: values.userId }).unwrap();
      const message =
        result.message.trim().length > 0
          ? result.message
          : "Reset password link sent successfully.";
      onNotify(message, "success");
      onClose();
    } catch (reason: unknown) {
      const message = readApiMessage(reason, "Unable to send the reset link.");
      onNotify(message, "error");
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Forgot password"
      maxWidth="xs"
      paperSx={{ maxWidth: 400 }}
      actionsSx={{ justifyContent: "center" }}
      actions={
        <CustomButton
          type="submit"
          form="forgot-password-form"
          variant="contained"
          disabled={!formState.isValid || formState.isSubmitting}
          sx={{
            borderRadius: "28px",
            px: 2,
            bgcolor: "#E45F14",
            color: "#FFFFFF",
            "&:hover": {
              bgcolor: "#CC5412",
            },
            "&.Mui-disabled": {
              bgcolor: "#F0B48A",
              color: "#FFFFFF",
            },
          }}
        >
          {formState.isSubmitting ? "Sending..." : "Send reset link"}
        </CustomButton>
      }
    >
      <Box
        component="form"
        id="forgot-password-form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
      >
        <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
          Enter your user ID or email and we will send a reset link.
        </Typography>

        <Controller
          name="userId"
          control={control}
          render={({ field, fieldState }) => (
            <CustomTextField
              fullWidth
              name={field.name}
              value={field.value}
              onBlur={field.onBlur}
              onChange={field.onChange}
              labelText="User ID"
              mandatory
              placeholder="Enter your user ID or email"
              autoComplete="username"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Box>
    </CustomDialog>
  );
}
