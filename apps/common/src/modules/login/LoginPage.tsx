import { useState, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { assignUrl, businessInboxUrl } from "@insurance-poc/routes";
import {
  BusinessTypeSelect,
  CustomButton,
  type BusinessType,
} from "@insurance-poc/ui";
import {
  clearToken,
  RegexPatterns,
  setSessionBusinessType,
  setSessionUser,
  setToken,
} from "@insurance-poc/util";
import { fetchJwt } from "../../services/jwtService";
import { fetchLogin } from "../../services/loginService";

export function LoginPage() {
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedUserId = userId.trim();
    if (!businessType || !trimmedUserId || password.trim().length === 0) {
      setError("Business type, user ID, and password are required.");
      return;
    }

    if (!RegexPatterns.alphanumeric.test(trimmedUserId)) {
      setError("User ID must be alphanumeric.");
      return;
    }

    setSubmitting(true);

    try {
      const jwt = await fetchJwt();
      const token = typeof jwt.token === "string" ? jwt.token.trim() : "";

      if (!token) {
        throw new Error("Authentication token was not returned.");
      }

      setToken(token);

      const loginResult = await fetchLogin(trimmedUserId, businessType);
      if (loginResult.status !== "SUCCESS") {
        throw new Error(loginResult.message);
      }

      const destination = businessInboxUrl(businessType);
      if (!destination) throw new Error("Business Inbox is not configured.");

      setSessionUser(loginResult.user);
      setSessionBusinessType(businessType);
      assignUrl(destination);
    } catch (reason) {
      clearToken();
      setError(reason instanceof Error ? reason.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="xs">
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Typography variant="h5" component="h1">
                Sign in
              </Typography>
              <Typography variant="body2" color="text.secondary">
                UW001: Retail, UW002: Group, UW003: both. Any non-empty
                password.
              </Typography>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <BusinessTypeSelect
                value={businessType}
                onChange={setBusinessType}
                disabled={submitting}
              />
              <TextField
                label="User ID"
                name="userId"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                autoComplete="username"
                autoFocus
                fullWidth
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                fullWidth
              />
              <CustomButton variant="outlined" type="submit" disabled={submitting} fullWidth>
                {submitting ? "Signing in..." : "Sign in"}
              </CustomButton>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
