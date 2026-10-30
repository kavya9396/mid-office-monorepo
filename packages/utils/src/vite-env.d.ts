interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_AUTH_SERVICE?: string;
  readonly VITE_AUTH_LOGIN_API?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_API?: string;
  readonly VITE_AUTH_RESET_PASSWORD_API?: string;
  readonly VITE_AUTH_CHANGE_PASSWORD_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
