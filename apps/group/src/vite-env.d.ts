/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_GROUP_API_URL?: string;
}

interface Window {
  __pocAppBoot?: string;
}
