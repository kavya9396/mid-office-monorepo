import loginMock from "../../../../mock/auth/login.json";

export type BusinessType = "RETAIL" | "GROUP";

export interface AuthenticatedUser {
  userId: string;
  displayName: string;
  authorizedBusinessTypes: BusinessType[];
  roles: string[];
}

export type LoginResult =
  | {
      status: "SUCCESS";
      message: string;
      user: AuthenticatedUser;
    }
  | {
      status: "FAILURE" | "UNAUTHORIZED";
      message: string;
      user: null;
    };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isBusinessType(value: string): value is BusinessType {
  return value === "RETAIL" || value === "GROUP";
}

export async function fetchLogin(
  userId: string,
  businessType: BusinessType,
): Promise<LoginResult> {
  await wait(200);

  const mockUser = loginMock.users.find((user) => user.userId === userId);

  if (!mockUser) {
    return {
      status: "FAILURE",
      message: "Login failed. Check the user ID and try again.",
      user: null,
    };
  }

  const authorizedBusinessTypes = mockUser.authorizedBusinessTypes.filter(
    isBusinessType,
  );

  if (!authorizedBusinessTypes.includes(businessType)) {
    return {
      status: "UNAUTHORIZED",
      message: `${mockUser.displayName} is not authorized for ${businessType.toLowerCase()} business.`,
      user: null,
    };
  }

  return {
    status: "SUCCESS",
    message: "Login successful.",
    user: {
      ...mockUser,
      authorizedBusinessTypes,
    },
  };
}

export const authorizeBusiness = fetchLogin;
