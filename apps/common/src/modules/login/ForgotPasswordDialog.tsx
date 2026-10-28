import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomButton, CustomDialog, CustomTextField } from "@insurance-poc/ui";
import { Controller, useForm } from "react-hook-form";
import { useForgotPasswordMutation } from "../../services/authApi";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "./forgotPasswordSchema";

type ForgotPasswordDialogProps = {
  open: boolean;
  initialUserId: string;
  onClose: () => void;
};

type ApiFeedback = {
  error: boolean;
  message: string;
};

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

export function ForgotPasswordDialog({
  open,
  initialUserId,
  onClose,
}: Readonly<ForgotPasswordDialogProps>) {
  const [forgotPassword] = useForgotPasswordMutation();
  const [feedback, setFeedback] = useState<ApiFeedback | null>(null);
  const { control, handleSubmit, reset, formState } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { userId: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ userId: initialUserId });
    setFeedback(null);
  }, [open, initialUserId, reset]);

  const onSubmit = async (values: ForgotPasswordForm) => {
    setFeedback(null);
    try {
      const result = await forgotPassword({ userId: values.userId }).unwrap();
      setFeedback({ error: false, message: result.message });
    } catch (reason: unknown) {
      const message = readApiMessage(reason);
      if (message.length > 0) {
        setFeedback({ error: true, message });
      }
    }
  };

  const succeeded = feedback?.error === false;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Forgot password"
      actions={
        <CustomButton
          fullWidth
          type="submit"
          form="forgot-password-form"
          disabled={!formState.isValid || formState.isSubmitting || succeeded}
          sx={{ borderRadius: "50px", py: 1.25 }}
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
              onChange={(event) => {
                field.onChange(event);
                setFeedback(null);
              }}
              labelText="User ID"
              mandatory
              placeholder="Enter your user ID or email"
              autoComplete="username"
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message}
            />
          )}
        />

        {feedback ? (
          <Typography
            role="alert"
            sx={{ fontSize: "12px", color: feedback.error ? "#9A2529" : "#1B7F3A" }}
          >
            {feedback.message}
          </Typography>
        ) : null}
      </Box>
    </CustomDialog>
  );
}
