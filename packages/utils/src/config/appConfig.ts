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

function configuredUrl(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Full landing-service URLs from .env (role-list, pool columns). Empty when unset — mock mode skips them. */
export const landingUrls = {
  get retailRoleList(): string {
    return configuredUrl(import.meta.env.VITE_RETAIL_ROLE_LIST_API);
  },
  get groupRoleList(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_ROLE_LIST_API);
  },
  get retailPoolColumns(): string {
    return configuredUrl(import.meta.env.VITE_RETAIL_POOL_COLUMNS_API);
  },
  get retailPoolColumnsSave(): string {
    return configuredUrl(import.meta.env.VITE_RETAIL_POOL_COLUMNS_SAVE_API);
  },
  get groupPoolColumns(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_POOL_COLUMNS_API);
  },
  get groupPoolColumnsSave(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_POOL_COLUMNS_SAVE_API);
  },
  get retailCompleteTask(): string {
    return configuredUrl(import.meta.env.VITE_RETAIL_COMPLETE_TASK_API);
  },
  get groupCompleteTask(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_COMPLETE_TASK_API);
  },
  get claimTask(): string {
    return configuredUrl(import.meta.env.VITE_CLAIM_TASK_API);
  },
};

/** Master-data service (shared Retail/Group reference lists). Empty when unset — mock mode skips it. */
export const masterUrls = {
  get masters(): string {
    return configuredUrl(import.meta.env.VITE_MASTERS_API);
  },
};

/** BRE wrapper orchestrator (shared Retail / Group retrigger). */
export const breUrls = {
  get retrigger(): string {
    return configuredUrl(import.meta.env.VITE_BRE_RETRIGGER_API);
  },
};

/** MMT grievance fetch / save. Empty when unset — mock mode skips them. */
export const mmtGrievanceUrls = {
  get fetch(): string {
    return configuredUrl(import.meta.env.VITE_MMT_GRIEVANCE_FETCH_API);
  },
  get save(): string {
    return configuredUrl(import.meta.env.VITE_MMT_GRIEVANCE_SAVE_API);
  },
};

/** Full Group DRS / Financial service URLs from .env. Empty when unset — mock mode skips them. */
export const groupBusinessUrls = {
  get drsData(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_DRS_DATA_API);
  },
  get financialFetch(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_FINANCIAL_FETCH_API);
  },
  get financialSave(): string {
    return configuredUrl(import.meta.env.VITE_GROUP_FINANCIAL_SAVE_API);
  },
};

/** NSDL external-event-service URLs from .env. Empty when unset — mock mode skips them. */
export const nsdlUrls = {
  get panValidate(): string {
    return configuredUrl(import.meta.env.VITE_NSDL_PAN_VALIDATE_API);
  },
};

/** RTK base URL when each request uses a full URL from `landingUrls` or `authUrls`. */
export const absoluteApiBaseUrl = "";
