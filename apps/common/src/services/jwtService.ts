import jwtMock from "../../../../mock/auth/jwt.json";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchJwt(): Promise<typeof jwtMock> {
  await wait(200);
  return jwtMock;
}
