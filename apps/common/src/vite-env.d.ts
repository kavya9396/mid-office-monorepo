/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_AUTH_SERVICE?: string;
  readonly VITE_AUTH_LOGIN_API?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_API?: string;
  readonly VITE_AUTH_RESET_PASSWORD_API?: string;
  readonly VITE_AUTH_CHANGE_PASSWORD_API?: string;
  readonly VITE_AUTH_LOGOUT_API?: string;
  readonly VITE_AUTH_BASIC_USERNAME?: string;
  readonly VITE_AUTH_BASIC_PASSWORD?: string;
}

interface Window {
  __pocAppBoot?: string;
}
