function readFlag(value: string | undefined): string {
  return value?.trim() ?? "";
}

function requiredUrl(value: string | undefined, name: string): string {
  const url = value?.trim() ?? "";
  if (url.length === 0) {
    throw new Error(`${name} is not configured.`);
  }
  return url;
}

/** Shared by Common, Retail, and Group. False only when VITE_USE_MOCK is exactly "false". */
export const useMock = readFlag(import.meta.env.VITE_USE_MOCK) !== "false";

/** Full auth URLs from .env. Read on use so mock mode does not require them. */
export const authUrls = {
  get login(): string {
    return requiredUrl(import.meta.env.VITE_AUTH_LOGIN_API, "VITE_AUTH_LOGIN_API");
  },
  get forgotPassword(): string {
    return requiredUrl(
      import.meta.env.VITE_AUTH_FORGOT_PASSWORD_API,
      "VITE_AUTH_FORGOT_PASSWORD_API",
    );
  },
  get resetPassword(): string {
    return requiredUrl(
      import.meta.env.VITE_AUTH_RESET_PASSWORD_API,
      "VITE_AUTH_RESET_PASSWORD_API",
    );
  },
  get changePassword(): string {
    return requiredUrl(
      import.meta.env.VITE_AUTH_CHANGE_PASSWORD_API,
      "VITE_AUTH_CHANGE_PASSWORD_API",
    );
  },
  get logout(): string {
    return requiredUrl(import.meta.env.VITE_AUTH_LOGOUT_API, "VITE_AUTH_LOGOUT_API");
  },
};
