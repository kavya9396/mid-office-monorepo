/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_CLIENT_ID?: string;
}

interface Window {
  __pocAppBoot?: string;
}
