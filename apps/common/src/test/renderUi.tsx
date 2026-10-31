import { ThemeProvider } from "@mui/material/styles";
import { render, type RenderOptions } from "@testing-library/react";
import { appTheme } from "@insurance-poc/ui";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

export function renderUi(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, {
    wrapper: ({ children }) => <ThemeProvider theme={appTheme}>{children}</ThemeProvider>,
    ...options,
  });
}

export function renderAuth(
  ui: ReactElement,
  options?: { route?: string; state?: unknown },
) {
  const route = options?.route ?? "/login";
  const [pathname, search = ""] = route.split("?");
  return renderUi(
    <MemoryRouter
      initialEntries={[
        {
          pathname,
          search: search ? `?${search}` : "",
          state: options?.state,
        },
      ]}
    >
      {ui}
    </MemoryRouter>,
  );
}
