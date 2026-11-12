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

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

import { cacheControl, type HttpContext } from "../../src/middleware";
import { errorOf, fakeHttp } from "./fakeHttp";

const t = initTRPC.context<HttpContext>().create();

function setUp() {
  const pub = t.procedure.concat(cacheControl({ maxAgeS: 30 }));
  const appRouter = t.router({
    ok: pub.query(() => "ok"),
    withInput: pub
      .input(z.object({ n: z.number() }))
      .query(({ input }) => input.n),
    fails: pub.query(() => {
      throw new TRPCError({ code: "NOT_FOUND" });
    }),
    write: pub.mutation(() => "written"),
    split: t.procedure
      .concat(cacheControl({ maxAgeS: 30, sMaxAgeS: 300 }))
      .query(() => "ok"),
  });
  return (url = "/ok") => {
    const http = fakeHttp({ url });
    return {
      caller: t.createCallerFactory(appRouter)(http),
      headers: http.headers,
    };
  };
}

describe("cacheControl", () => {
  it("marks a successful query cacheable by anyone", async () => {
    const { caller, headers } = setUp()();

    await caller.ok();

    expect(headers["cache-control"]).toBe("public, max-age=30, s-maxage=30");
  });

  it("sends sMaxAgeS to shared caches when given", async () => {
    const { caller, headers } = setUp()("/split");

    await caller.split();

    expect(headers["cache-control"]).toBe("public, max-age=30, s-maxage=300");
  });

  it("sends no-store for a handler error", async () => {
    const { caller, headers } = setUp()("/fails");

    expect(await errorOf(caller.fails())).toBeInstanceOf(TRPCError);
    expect(headers["cache-control"]).toBe("no-store");
  });

  it("sends no-store for a bad input", async () => {
    const { caller, headers } = setUp()("/withInput");

    await errorOf(caller.withInput({ n: "one" } as unknown as { n: number }));

    expect(headers["cache-control"]).toBe("no-store");
  });

  it("sends no-store for a mutation", async () => {
    const { caller, headers } = setUp()("/write");

    await caller.write();

    expect(headers["cache-control"]).toBe("no-store");
  });

  it("sends no-store for a batch, even when the query succeeds", async () => {
    const { caller, headers } = setUp()("/ok,withInput?batch=1");

    await caller.ok();

    expect(headers["cache-control"]).toBe("no-store");
  });
});
