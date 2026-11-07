import {
  mapRoleListPayload,
  type InboxData,
  type RoleListRequest,
} from "@insurance-poc/common/inbox";

export function createGroupRoleListRequest(): RoleListRequest {
  return {};
}

export function mapGroupInboxPayload(value: unknown): InboxData {
  return mapRoleListPayload(value);
}
