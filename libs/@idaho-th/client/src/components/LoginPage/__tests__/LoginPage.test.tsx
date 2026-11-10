// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TRPCClientError } from "@trpc/client";
import { MemoryRouter } from "react-router-dom";

import { LoginPage } from "../LoginPage";

vi.mock("../../../hooks/useDebounce", () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));

const testDoubles = vi.hoisted(() => ({
  authorize: vi.fn(),
  checkSignInEmail: vi.fn(),
  checkRecidivizRoleChoice: vi.fn(),
  loginWithEmail: vi.fn(),
  authError: undefined as Error | undefined,
}));

vi.mock("../../../datastores/IdahoTHStoreContext", () => ({
  useIdahoTHStore: () => ({
    rootStore: {
      userStore: {
        authorize: testDoubles.authorize,
        isAuthorized: false,
        loginWithEmail: testDoubles.loginWithEmail,
        userIsLoading: false,
        get authError() {
          return testDoubles.authError;
        },
      },
    },
  }),
}));

vi.mock("../../../trpc/client", () => ({
  trpc: {
    auth: {
      checkSignInEmail: {
        useMutation: () => ({
          mutateAsync: testDoubles.checkSignInEmail,
        }),
      },
      checkRecidivizRoleChoice: {
        useQuery: (input: { email: string }, options?: { enabled?: boolean }) =>
          testDoubles.checkRecidivizRoleChoice(input, options),
      },
    },
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    testDoubles.authorize.mockReset();
    testDoubles.authorize.mockResolvedValue(undefined);
    testDoubles.checkSignInEmail.mockReset();
    testDoubles.checkRecidivizRoleChoice.mockReset();
    testDoubles.checkRecidivizRoleChoice.mockReturnValue({
      data: { showRoleChoice: true },
      isLoading: false,
    });
    testDoubles.loginWithEmail.mockReset();
    testDoubles.authError = undefined;
  });

  test("disables Continue for an invalid email", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "not-an-email",
      );
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(testDoubles.checkSignInEmail).not.toHaveBeenCalled();
    expect(testDoubles.loginWithEmail).not.toHaveBeenCalled();
  });

  test("disables Continue for an email with a malformed domain, without ever calling the backend", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "xyz@recidiviz.",
      );
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(testDoubles.checkSignInEmail).not.toHaveBeenCalled();
    expect(testDoubles.loginWithEmail).not.toHaveBeenCalled();
  });

  test("shows an error when a provider email is not registered", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({ ok: false });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "provider@example.com",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "provider@example.com",
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This email is not registered for access.",
    );
    expect(testDoubles.loginWithEmail).not.toHaveBeenCalled();
  });

  test("starts staff login with the flow resolved by the backend", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "staff-database",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "mock.staff@idoc.idaho.gov",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "mock.staff@idoc.idaho.gov",
    });
    expect(testDoubles.loginWithEmail).toHaveBeenCalledWith(
      "mock.staff@idoc.idaho.gov",
      "staff-database",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("checks a provider email before starting login", async () => {
    const user = userEvent.setup();
    let resolveEmailCheck: (result: {
      ok: boolean;
      flow: string;
    }) => void = () => undefined;
    testDoubles.checkSignInEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEmailCheck = resolve;
        }),
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "provider@example.com",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "provider@example.com",
    });
    expect(testDoubles.loginWithEmail).not.toHaveBeenCalled();

    await act(async () => {
      resolveEmailCheck({ ok: true, flow: "provider" });
    });

    await waitFor(() => {
      expect(testDoubles.loginWithEmail).toHaveBeenCalledWith(
        "provider@example.com",
        "provider",
      );
    });
  });

  test("starts login when a provider email is registered", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "provider",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "provider@example.com",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "provider@example.com",
    });
    expect(testDoubles.loginWithEmail).toHaveBeenCalledWith(
      "provider@example.com",
      "provider",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("shows a rate-limit error when provider login is throttled", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "provider",
    });
    const rateLimitError = new TRPCClientError(
      "Too many sign-in attempts. Please wait a minute and try again.",
    );
    Object.assign(rateLimitError, { data: { code: "TOO_MANY_REQUESTS" } });
    testDoubles.loginWithEmail.mockRejectedValue(rateLimitError);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "provider@example.com",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many sign-in attempts. Please wait a minute and try again.",
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  test("shows a generic error when staff login fails", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "staff-database",
    });
    testDoubles.loginWithEmail.mockRejectedValue(
      new Error("Auth0 unavailable"),
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "mock.staff@idoc.idaho.gov",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Auth0 unavailable",
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  test("requires a role choice before submitting a recidiviz.org email", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "staff.user@recidiviz.org",
      );
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Select whether you're signing in as a case manager or a provider.",
    );
    expect(testDoubles.checkSignInEmail).not.toHaveBeenCalled();
  });

  test("starts the staff SSO flow for a recidiviz.org email that picks Case Manager", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "staff-sso",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "staff.user@recidiviz.org",
      );
      await user.click(screen.getByRole("radio", { name: "Case Manager" }));
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "staff.user@recidiviz.org",
      requestedFlow: "staff-sso",
    });
    expect(testDoubles.loginWithEmail).toHaveBeenCalledWith(
      "staff.user@recidiviz.org",
      "staff-sso",
    );
  });

  test("starts the provider flow for a recidiviz.org email that picks Provider", async () => {
    const user = userEvent.setup();
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "provider",
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "staff.user@recidiviz.org",
      );
      await user.click(screen.getByRole("radio", { name: "Provider" }));
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "staff.user@recidiviz.org",
      requestedFlow: "provider",
    });
    expect(testDoubles.loginWithEmail).toHaveBeenCalledWith(
      "staff.user@recidiviz.org",
      "provider",
    );
  });

  test("does not show the role choice for a non-recidiviz.org email, and never queries the allowlist for it", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "mock.staff@idoc.idaho.gov",
      );
    });

    expect(
      screen.queryByRole("radio", { name: "Case Manager" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(testDoubles.checkRecidivizRoleChoice).toHaveBeenCalledWith(
        { email: "mock.staff@idoc.idaho.gov" },
        expect.objectContaining({ enabled: false }),
      );
    });
  });

  test("queries the allowlist for a recidiviz.org email", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "staff.user@recidiviz.org",
      );
    });

    await waitFor(() => {
      expect(testDoubles.checkRecidivizRoleChoice).toHaveBeenCalledWith(
        { email: "staff.user@recidiviz.org" },
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  test("disables Continue for a recidiviz.org email while the allowlist check is still pending, rather than routing to the password flow", async () => {
    testDoubles.checkRecidivizRoleChoice.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "staff.user@recidiviz.org",
      );
    });

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await act(async () => {
      await user.click(continueButton);
    });

    expect(testDoubles.checkSignInEmail).not.toHaveBeenCalled();
    expect(testDoubles.loginWithEmail).not.toHaveBeenCalled();
  });

  test("does not show the role choice for a recidiviz.org email the allowlist check has not granted, and lets the backend route it", async () => {
    testDoubles.checkRecidivizRoleChoice.mockReturnValue({
      data: { showRoleChoice: false },
      isLoading: false,
    });
    testDoubles.checkSignInEmail.mockResolvedValue({
      ok: true,
      flow: "provider",
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await act(async () => {
      await user.type(
        screen.getByRole("textbox", { name: /please enter a valid email/i }),
        "staff.user@recidiviz.org",
      );
    });

    expect(
      screen.queryByRole("radio", { name: "Case Manager" }),
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Continue" }));
    });

    expect(testDoubles.checkSignInEmail).toHaveBeenCalledWith({
      email: "staff.user@recidiviz.org",
    });
    expect(testDoubles.loginWithEmail).toHaveBeenCalledWith(
      "staff.user@recidiviz.org",
      "provider",
    );
  });

  test("shows the Auth0 access-denied message when present", () => {
    testDoubles.authError = new Error(
      "This login method is restricted to Recidiviz staff accounts.",
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This login method is restricted to Recidiviz staff accounts.",
    );
  });
});
