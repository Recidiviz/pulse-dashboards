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

import type {
  BrowserContext,
  Page,
  Request,
  Response,
  Route,
} from "playwright-core";

import {
  collectNetworkFailures,
  sendFastlyDebugHeader,
} from "../src/diagnostics";

type Handlers = {
  requestfailed?: (request: Request) => void;
  response?: (response: Response) => void;
};

/** A fake Page that captures the requestfailed/response listeners. */
function fakePage(): { page: Page; handlers: Handlers } {
  const handlers: Handlers = {};
  const page = {
    on: (event: string, handler: (arg: never) => void) => {
      handlers[event as keyof Handlers] = handler as never;
    },
  };
  return { page: page as unknown as Page, handlers };
}

function fakeRequest(
  url: string,
  resourceType: string,
  errorText: string,
  method = "GET",
): Request {
  return {
    url: () => url,
    method: () => method,
    resourceType: () => resourceType,
    failure: () => ({ errorText }),
  } as unknown as Request;
}

function fakeResponse(
  url: string,
  status: number,
  {
    method = "GET",
    resourceType = "xhr",
    headers = {},
  }: {
    method?: string;
    resourceType?: string;
    headers?: Record<string, string>;
  } = {},
): Response {
  return {
    url: () => url,
    status: () => status,
    headers: () => headers,
    request: () => ({ method: () => method, resourceType: () => resourceType }),
  } as unknown as Response;
}

describe("sendFastlyDebugHeader", () => {
  /** Installs the route and returns a dispatcher that plays a request through it. */
  async function installedRoute() {
    let handler: ((route: Route) => Promise<void>) | undefined;
    const context = {
      route: async (_pattern: string, h: (route: Route) => Promise<void>) => {
        handler = h;
      },
    } as unknown as BrowserContext;
    await sendFastlyDebugHeader(
      context,
      "https://dashboard-staging.recidiviz.org",
    );

    return async (url: string) => {
      const continueCalls: unknown[][] = [];
      const route = {
        request: () => ({ url: () => url, headers: () => ({ accept: "*/*" }) }),
        continue: async (...args: unknown[]) => {
          continueCalls.push(args);
        },
      } as unknown as Route;
      await handler?.(route);
      return continueCalls;
    };
  }

  it("adds Fastly-Debug to requests to the dashboard host", async () => {
    const dispatch = await installedRoute();
    expect(
      await dispatch("https://dashboard-staging.recidiviz.org/assets/app.js"),
    ).toEqual([[{ headers: { accept: "*/*", "Fastly-Debug": "1" } }]]);
  });

  it("leaves cross-origin requests untouched — the non-safelisted header fails CORS preflights (e.g. Auth0 /oauth/token)", async () => {
    const dispatch = await installedRoute();
    expect(
      await dispatch("https://login-staging.recidiviz.org/oauth/token"),
    ).toEqual([[]]);
    expect(
      await dispatch("https://recidiviz-dev.auth0.com/usernamepassword/login"),
    ).toEqual([[]]);
  });
});

describe("collectNetworkFailures", () => {
  it("records real failed requests but skips our own asset aborts", () => {
    const { page, handlers } = fakePage();
    const get = collectNetworkFailures(page);

    // A genuinely failed XHR — should be recorded.
    handlers.requestfailed?.(
      fakeRequest(
        "https://dashboard-staging.recidiviz.org/api/data",
        "xhr",
        "net::ERR_FAILED",
      ),
    );

    expect(get()).toEqual([
      "requestfailed: GET https://dashboard-staging.recidiviz.org/api/data — net::ERR_FAILED",
    ]);
  });

  it("records 4xx/5xx responses and ignores successful ones", () => {
    const { page, handlers } = fakePage();
    const get = collectNetworkFailures(page);

    handlers.response?.(fakeResponse("https://api/ok", 200));
    handlers.response?.(fakeResponse("https://api/slow", 304));
    handlers.response?.(fakeResponse("https://api/rate-limited", 429));
    handlers.response?.(
      fakeResponse("https://api/boom", 500, { method: "POST" }),
    );

    expect(get()).toEqual([
      "http 429: GET https://api/rate-limited [xhr]",
      "http 500: POST https://api/boom [xhr]",
    ]);
  });

  it("captures CDN/edge headers on a failed response (Fastly 502 diagnosis)", () => {
    const { page, handlers } = fakePage();
    const get = collectNetworkFailures(page);

    handlers.response?.(
      fakeResponse(
        "https://dashboard-staging.recidiviz.org/assets/vendor.js",
        502,
        {
          resourceType: "script",
          headers: {
            "x-served-by": "cache-bur-kbur8200041-BUR",
            "x-cache": "MISS",
            via: "1.1 google",
            "content-type": "text/html", // not in the diagnostic set — must be dropped
          },
        },
      ),
    );

    expect(get()).toEqual([
      "http 502: GET https://dashboard-staging.recidiviz.org/assets/vendor.js [script]" +
        " — via=1.1 google x-served-by=cache-bur-kbur8200041-BUR x-cache=MISS",
    ]);
  });
});
