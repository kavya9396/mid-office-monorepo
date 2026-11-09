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
};

/** Master-data service (shared Retail/Group reference lists). Empty when unset — mock mode skips it. */
export const masterUrls = {
  get masters(): string {
    return configuredUrl(import.meta.env.VITE_MASTERS_API);
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

/** RTK base URL when each request uses a full URL from `landingUrls` or `authUrls`. */
export const absoluteApiBaseUrl = "";
