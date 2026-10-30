/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" switches data services from mock JSON to the real APIs. Default: mock. */
  readonly VITE_USE_MOCK?: string;
  /** Real API URL for the MMT grievance history rows (used when VITE_USE_MOCK=false). */
  readonly VITE_MMT_GRIEVANCE_HISTORY_URL?: string;
  /** Real API URL for the MMT grievance decision rows (used when VITE_USE_MOCK=false). */
  readonly VITE_MMT_GRIEVANCE_DECISION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __pocAppBoot?: string;
}
