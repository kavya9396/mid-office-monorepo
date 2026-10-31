import {
  mapRoleListPayload,
  type InboxData,
  type RoleListRequest,
} from "@insurance-poc/common/inbox";

export const GROUP_ROLE_LIST_PATH = "/icic-drs-landing-service/v1/role-list";
export const GROUP_POOL_COLUMNS_PATH = "/icic-drs-landing-service/v1/pool-columns";
export const GROUP_POOL_COLUMNS_SAVE_PATH = "/icic-drs-landing-service/v1/pool-columns/save";

/**
 * Keep the request shape here until the backend confirms whether a password is also required.
 * The malformed sample key is intentionally not used.
 */
export function createGroupRoleListRequest(username: string): RoleListRequest {
  return { username: username.trim() };
}

export function mapGroupInboxPayload(value: unknown): InboxData {
  return mapRoleListPayload(value);
}

