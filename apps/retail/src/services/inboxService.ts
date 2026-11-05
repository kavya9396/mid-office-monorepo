import {
  mapRoleListPayload,
  type InboxData,
  type RoleListRequest,
} from "@insurance-poc/common/inbox";

export function createRetailRoleListRequest(): RoleListRequest {
  return {};
}

export function mapRetailInboxPayload(value: unknown): InboxData {
  return mapRoleListPayload(value);
}
