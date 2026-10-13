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

// The handler rejects any request whose system is missing or unrecognised.
//
// Validation, not passthrough: such a value would be indexed verbatim, or left
// unset, and then match no scoped key — hiding every document the run wrote
// behind a filter that silently never matches. The rejection happens before any
// Firestore work, which is what makes this testable without one.

import type { Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { backfill } from "../src/index";

vi.mock("../src/backfill", () => ({
  runBackfill: vi.fn(async () => ({ imported: 0, deleted: 0 })),
}));

function fakeRes() {
  const sent: { status?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
      return this;
    },
  };
  return { res: res as unknown as Response, sent };
}

const original = process.env["COLLECTIONS_JSON"];

beforeEach(() => {
  process.env["COLLECTIONS_JSON"] = JSON.stringify([
    { name: "opportunities", fields: ["externalId"] },
  ]);
});

afterEach(() => {
  if (original === undefined) delete process.env["COLLECTIONS_JSON"];
  else process.env["COLLECTIONS_JSON"] = original;
  vi.restoreAllMocks();
});

describe("the system a backfill request carries", () => {
  it.each(["supervision", "PAROLE", "", 7, true])(
    "rejects %p before touching Firestore",
    async (system) => {
      const { res, sent } = fakeRes();

      await backfill(
        {
          body: {
            collections: ["opportunities"],
            sourceCollection: "US_TN-compliantReportingReferrals",
            system,
          },
        } as unknown as Request,
        res,
      );

      expect(sent.status).toBe(400);
      expect(String((sent.body as { error: string }).error)).toContain(
        "invalid system",
      );
    },
  );

  it("rejects a source that arrives without one", async () => {
    const { res, sent } = fakeRes();

    await backfill(
      {
        body: {
          collections: ["opportunities"],
          sourceCollection: "US_TN-compliantReportingReferrals",
        },
      } as unknown as Request,
      res,
    );

    expect(sent.status).toBe(400);
    expect(sent.body).toEqual({
      error: expect.stringContaining("system is required"),
    });
  });

  it("does not start the run when it rejects", async () => {
    // The point of the 400: a document written without `system` imports
    // cleanly and is then invisible to every scoped key. Nothing may reach
    // Firestore.
    const { runBackfill } = await import("../src/backfill");
    const { res } = fakeRes();

    await backfill(
      {
        body: {
          collections: ["opportunities"],
          sourceCollection: "US_TN-compliantReportingReferrals",
        },
      } as unknown as Request,
      res,
    );

    expect(runBackfill).not.toHaveBeenCalled();
  });

  it("accepts a source that supplies one", async () => {
    const { runBackfill } = await import("../src/backfill");
    const { res, sent } = fakeRes();

    await backfill(
      {
        body: {
          collections: ["opportunities"],
          sourceCollection: "US_TN-compliantReportingReferrals",
          system: "SUPERVISION",
        },
      } as unknown as Request,
      res,
    );

    expect(sent.status).toBe(200);
    expect(runBackfill).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      "US_TN-compliantReportingReferrals",
      "SUPERVISION",
    );
  });

  it("asks for no system when the request names no source", async () => {
    // A statically-sourced collection carries its own `system` through
    // `constantFields`, so requiring one here would reject every ordinary run.
    const { res, sent } = fakeRes();
    process.env["COLLECTIONS_JSON"] = JSON.stringify([
      { name: "clients", fields: ["externalId"] },
    ]);

    await backfill(
      { body: { collections: ["clients"] } } as unknown as Request,
      res,
    );

    expect(sent.status).toBe(200);
  });
});
