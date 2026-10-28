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

import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";

import { createFakeHost } from "../../testing";
import {
  ParoleBoardHostProvider,
  useCalendarCode,
  useParoleBoardHost,
} from "../ParoleBoardHostContext";
import { ParoleBoardHost } from "../types";

function wrapperFor(host: ParoleBoardHost) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ParoleBoardHostProvider host={host}>{children}</ParoleBoardHostProvider>
    );
  };
}

describe("useParoleBoardHost", () => {
  beforeEach(() => {
    // React logs the error a hook throws during render.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the host from the provider", () => {
    const host = createFakeHost();
    const { result } = renderHook(() => useParoleBoardHost(), {
      wrapper: wrapperFor(host),
    });
    expect(result.current).toBe(host);
  });

  it("throws outside the provider", () => {
    expect(() => renderHook(() => useParoleBoardHost())).toThrow(
      "useParoleBoardHost must be used inside a ParoleBoardHostProvider",
    );
  });
});

describe("useCalendarCode", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the tenant's calendar code", () => {
    const { result } = renderHook(() => useCalendarCode(), {
      wrapper: wrapperFor(createFakeHost()),
    });
    expect(result.current).toBe("PAROLE_BOARD_PUBLIC");
  });

  it("throws when the tenant has no calendarConfig", () => {
    const host = createFakeHost({
      currentTenantId: "US_XX",
      tenantStore: { currentTenantConfig: {} },
    });
    expect(() =>
      renderHook(() => useCalendarCode(), { wrapper: wrapperFor(host) }),
    ).toThrow("Tenant US_XX has no calendarConfig");
  });

  it("throws when the host has no tenant config at all", () => {
    const host = createFakeHost({ tenantStore: {} });
    expect(() =>
      renderHook(() => useCalendarCode(), { wrapper: wrapperFor(host) }),
    ).toThrow("has no calendarConfig");
  });
});
