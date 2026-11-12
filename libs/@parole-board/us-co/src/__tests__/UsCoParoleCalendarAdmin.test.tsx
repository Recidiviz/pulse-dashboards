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

import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { MockInstance } from "vitest";

import {
  calendarApiConfig,
  monthSummariesPage,
} from "~@parole-board/common/fixtures";
import {
  createFakeCalendarTrpc,
  createFakeHost,
} from "~@parole-board/common/testing";

import { UsCoParoleCalendarAdmin } from "../UsCoParoleCalendarAdmin";

const OFFLINE_MESSAGE =
  "The Public Calendar needs the calendar server, which doesn't run in offline or demo mode.";
const NOT_CONFIGURED_MESSAGE =
  "The Public Calendar isn't set up in this environment.";

function LocationDisplay() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

let fetchSpy: MockInstance<typeof fetch>;
let warnSpy: MockInstance<typeof console.warn>;

beforeEach(() => {
  vi.stubEnv("VITE_IS_OFFLINE", "false");
  vi.stubEnv("VITE_AUTH_ENV", "staging");
  vi.stubEnv("VITE_MODULE_BACKEND_URL", "https://modules.example.test");
  fetchSpy = vi.spyOn(globalThis, "fetch");
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("UsCoParoleCalendarAdmin", () => {
  it("shows the offline message in offline mode", async () => {
    vi.stubEnv("VITE_IS_OFFLINE", "true");

    const { container } = render(
      <UsCoParoleCalendarAdmin host={createFakeHost()} />,
    );

    expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the offline message in demo mode", () => {
    vi.stubEnv("VITE_AUTH_ENV", "demo");

    render(<UsCoParoleCalendarAdmin host={createFakeHost()} />);

    expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the not-configured message when the backend URL is empty", async () => {
    vi.stubEnv("VITE_MODULE_BACKEND_URL", "");

    const { container } = render(
      <UsCoParoleCalendarAdmin host={createFakeHost()} />,
    );

    expect(screen.getByText(NOT_CONFIGURED_MESSAGE)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("US_CO"));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the not-configured message when the tenant has no calendarConfig", () => {
    const host = createFakeHost({
      currentTenantId: "US_XX",
      tenantStore: { currentTenantConfig: {} },
    });

    render(<UsCoParoleCalendarAdmin host={host} />);

    expect(screen.getByText(NOT_CONFIGURED_MESSAGE)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("US_XX"));
  });

  it("opens on the current month in Denver when the calendar is configured", async () => {
    // 2026-10-31, 8pm in Denver, when it's already November in UTC.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-01T02:00:00Z"));
    const host = createFakeHost({
      calendarTrpc: createFakeCalendarTrpc({
        procedures: {
          "admin.config.get": () => calendarApiConfig,
          "admin.months.list": () => monthSummariesPage,
          "admin.months.get": () => null,
        },
      }),
    });

    // The host app provides the QueryClient, as the staff app's root does.
    const { container } = render(
      <QueryClientProvider client={host.calendarTrpc.queryClient}>
        <MemoryRouter initialEntries={["/parole/public-calendar"]}>
          <Routes>
            <Route
              path="/parole/public-calendar/*"
              element={
                <>
                  <UsCoParoleCalendarAdmin host={host} />
                  <LocationDisplay />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "October 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/parole/public-calendar/2026-10",
    );
    expect(
      screen.getByText("No calendar yet for October 2026."),
    ).toBeInTheDocument();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });
});
