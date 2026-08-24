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

import {
  peekPendingLoginDeepLink,
  savePendingLoginDeepLink,
  takePendingLoginDeepLink,
} from "./pendingLoginDeepLink";

const globals = globalThis as { window?: unknown };
const originalWindow = globals.window;

function makeFakeSessionStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  } as Storage;
}

function setWindow({
  pathname,
  search = "",
  sessionStorage = makeFakeSessionStorage(),
}: {
  pathname: string;
  search?: string;
  sessionStorage?: Storage;
}) {
  globals.window = { sessionStorage, location: { pathname, search } };
  return sessionStorage;
}

afterEach(() => {
  globals.window = originalWindow;
});

describe("pendingLoginDeepLink", () => {
  it("round-trips a deep link path with query params", () => {
    setWindow({
      pathname: "/clients/123/meetings/456",
      search: "?stateCode=US_ID",
    });
    savePendingLoginDeepLink();
    expect(takePendingLoginDeepLink()).toBe(
      "/clients/123/meetings/456?stateCode=US_ID",
    );
  });

  it("peeks without clearing", () => {
    setWindow({ pathname: "/clients/123" });
    savePendingLoginDeepLink();
    expect(peekPendingLoginDeepLink()).toBe("/clients/123");
    expect(peekPendingLoginDeepLink()).toBe("/clients/123");
    expect(takePendingLoginDeepLink()).toBe("/clients/123");
  });

  it("clears the saved link after taking it", () => {
    setWindow({ pathname: "/clients/123" });
    savePendingLoginDeepLink();
    expect(takePendingLoginDeepLink()).toBe("/clients/123");
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it.each(["/", "/login"])("does not save %s", (pathname) => {
    setWindow({ pathname });
    savePendingLoginDeepLink();
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it("does not save an Auth0 redirect callback URL", () => {
    setWindow({ pathname: "/callback", search: "?code=abc&state=xyz" });
    savePendingLoginDeepLink();
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it("does not save an Auth0 error callback URL", () => {
    setWindow({
      pathname: "/callback",
      search: "?error=access_denied&error_description=denied",
    });
    savePendingLoginDeepLink();
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it("keeps the first captured path when later saves are not restorable", () => {
    const sessionStorage = setWindow({
      pathname: "/residents/9/meetings/8",
      search: "?stateCode=US_NE",
    });
    savePendingLoginDeepLink();
    // Simulate React Navigation rewriting the URL to /login, then a re-render
    setWindow({ pathname: "/login", sessionStorage });
    savePendingLoginDeepLink();
    expect(takePendingLoginDeepLink()).toBe(
      "/residents/9/meetings/8?stateCode=US_NE",
    );
  });

  it("no-ops when window is undefined", () => {
    globals.window = undefined;
    expect(() => savePendingLoginDeepLink()).not.toThrow();
    expect(peekPendingLoginDeepLink()).toBeNull();
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it("no-ops when sessionStorage is undefined (native)", () => {
    globals.window = { location: { pathname: "/clients/1", search: "" } };
    expect(() => savePendingLoginDeepLink()).not.toThrow();
    expect(peekPendingLoginDeepLink()).toBeNull();
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it("no-ops when accessing sessionStorage throws", () => {
    globals.window = {
      get sessionStorage(): Storage {
        throw new Error("storage disabled");
      },
      location: { pathname: "/clients/1", search: "" },
    };
    expect(() => savePendingLoginDeepLink()).not.toThrow();
    expect(peekPendingLoginDeepLink()).toBeNull();
    expect(takePendingLoginDeepLink()).toBeNull();
  });

  it("swallows storage errors on save", () => {
    const throwingStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => undefined,
    } as unknown as Storage;
    setWindow({ pathname: "/clients/1", sessionStorage: throwingStorage });
    expect(() => savePendingLoginDeepLink()).not.toThrow();
  });
});
