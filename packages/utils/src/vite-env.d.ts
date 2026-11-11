interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_CLIENT_ID?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_AUTH_SERVICE?: string;
  readonly VITE_AUTH_LOGIN_API?: string;
  readonly VITE_AUTH_FORGOT_PASSWORD_API?: string;
  readonly VITE_AUTH_RESET_PASSWORD_API?: string;
  readonly VITE_AUTH_CHANGE_PASSWORD_API?: string;
  readonly VITE_AUTH_LOGOUT_API?: string;
  readonly VITE_AUTH_BASIC_USERNAME?: string;
  readonly VITE_AUTH_BASIC_PASSWORD?: string;
  readonly VITE_LANDING_SERVICE?: string;
  readonly VITE_RETAIL_ROLE_LIST_API?: string;
  readonly VITE_GROUP_ROLE_LIST_API?: string;
  readonly VITE_RETAIL_POOL_COLUMNS_API?: string;
  readonly VITE_RETAIL_POOL_COLUMNS_SAVE_API?: string;
  readonly VITE_GROUP_POOL_COLUMNS_API?: string;
  readonly VITE_GROUP_POOL_COLUMNS_SAVE_API?: string;
  readonly VITE_RETAIL_COMPLETE_TASK_API?: string;
  readonly VITE_GROUP_COMPLETE_TASK_API?: string;
  readonly VITE_CLAIM_TASK_API?: string;
  readonly VITE_MASTER_SERVICE?: string;
  readonly VITE_MASTERS_API?: string;
  readonly VITE_GROUP_DRS_SERVICE?: string;
  readonly VITE_GROUP_DRS_DATA_API?: string;
  readonly VITE_FINANCE_SERVICE?: string;
  readonly VITE_GROUP_FINANCIAL_FETCH_API?: string;
  readonly VITE_GROUP_FINANCIAL_SAVE_API?: string;
  readonly VITE_BRE_SERVICE?: string;
  readonly VITE_BRE_RETRIGGER_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
