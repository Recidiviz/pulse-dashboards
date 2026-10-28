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

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { MockInstance } from "vitest";

import { createFakeHost } from "~@parole-board/common/testing";

import { UsCoParoleCalendarAdmin } from "../UsCoParoleCalendarAdmin";

const OFFLINE_MESSAGE =
  "The Public Calendar needs the calendar server, which doesn't run in offline or demo mode.";
const NOT_CONFIGURED_MESSAGE =
  "The Public Calendar isn't set up in this environment.";
const PLACEHOLDER = "This page is being built.";

let fetchSpy: MockInstance<typeof fetch>;
let warnSpy: MockInstance<typeof console.warn>;

beforeEach(() => {
  vi.stubEnv("VITE_IS_OFFLINE", "false");
  vi.stubEnv("VITE_AUTH_ENV", "staging");
  vi.stubEnv("VITE_MODULE_BACKEND_URL", "https://modules.example.test");
  fetchSpy = vi.spyOn(globalThis, "fetch");
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("UsCoParoleCalendarAdmin", () => {
  it("shows the offline message in offline mode", async () => {
    vi.stubEnv("VITE_IS_OFFLINE", "true");

    const { container } = render(
      <UsCoParoleCalendarAdmin host={createFakeHost()} />,
    );

    expect(screen.getByText(OFFLINE_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(PLACEHOLDER)).not.toBeInTheDocument();
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

  it("shows the placeholder when the calendar is configured", async () => {
    const { container } = render(
      <UsCoParoleCalendarAdmin host={createFakeHost()} />,
    );

    expect(screen.getByText(PLACEHOLDER)).toBeInTheDocument();
    expect(screen.queryByText(OFFLINE_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByText(NOT_CONFIGURED_MESSAGE)).not.toBeInTheDocument();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });
});
