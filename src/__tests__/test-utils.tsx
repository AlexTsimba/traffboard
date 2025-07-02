import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import React, { type ReactElement } from "react";

// Custom render function with providers
interface AllTheProvidersProps {
  readonly children: React.ReactNode;
  readonly theme?: "light" | "dark" | "system";
}

function AllTheProviders({ children, theme }: AllTheProvidersProps) {
  return (
    <ThemeProvider disableTransitionOnChange enableSystem attribute="class" defaultTheme={theme ?? "system"}>
      {children}
    </ThemeProvider>
  );
}

// Custom render options
interface CustomRenderOptions {
  theme?: "light" | "dark" | "system";
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper"> & CustomRenderOptions) => {
  const { theme, ...renderOptions } = options ?? {};
  const selectedTheme = theme ?? "system";

  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => <AllTheProviders theme={selectedTheme}>{children}</AllTheProviders>,
      ...renderOptions,
    }),
  };
};

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render method
export { customRender as render };
