/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_AUTH_BASIC_USERNAME?: string;
  readonly VITE_AUTH_BASIC_PASSWORD?: string;
}

interface Window {
  __pocAppBoot?: string;
}
