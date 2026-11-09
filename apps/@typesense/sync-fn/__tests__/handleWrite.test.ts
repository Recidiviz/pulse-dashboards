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

import { beforeEach, describe, expect, it, vi } from "vitest";

const getDoc = vi.fn();
const upsert = vi.fn();
const update = vi.fn();

vi.mock("firebase-admin", () => ({
  initializeApp: vi.fn(),
  firestore: () => ({ doc: () => ({ get: getDoc }) }),
}));

vi.mock("firebase-functions/v2/firestore", () => ({
  onDocumentWritten: (_opts: unknown, handler: unknown) => handler,
}));

// Only the FACTORY is replaced: sync.ts reads real field lists from this module.
vi.mock("~@typesense/client", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createTypesenseClientFromEnv: () => ({
    collections: () => ({
      documents: () => ({
        upsert,
        update,
        delete: vi.fn(),
      }),
    }),
  }),
}));

const { handleWrite } = await import("../src/index");

/** The document as of ONE write, which is all the trigger carries. */
function event(path: string, data: Record<string, unknown> | null) {
  return {
    exists: data !== null,
    data: () => data ?? undefined,
    ref: { path },
  };
}

function firestoreHolds(data: Record<string, unknown> | null) {
  getDoc.mockResolvedValue({
    exists: data !== null,
    data: () => data ?? undefined,
  });
}

const OPP_PATH =
  "clientUpdatesV2/us_az_123/clientOpportunityUpdates/usAzTransferToAdminSupervision";

const DENIAL = { reasons: ["TEST"], updated: { by: "t@r.org" } };
const SNOOZE = { snoozeUntil: "2026-12-01", snoozedBy: "t@r.org" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleWrite", () => {
  it("writes what Firestore holds, not what a stale event carried", async () => {
    // The event predates the snooze, Firestore has it.
    firestoreHolds({
      denial: DENIAL,
      manualSnooze: SNOOZE,
      stateCode: "US_AZ",
    });

    await handleWrite(
      event(OPP_PATH, { denial: DENIAL, stateCode: "US_AZ" }),
      event(OPP_PATH, { denial: DENIAL, stateCode: "US_AZ" }),
    );

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({
      manualSnooze: SNOOZE,
      updateStatus: "DENIED",
      hasOfficerAction: true,
    });
  });

  it("leaves the same final state however the events are ordered", async () => {
    // Four deliveries of one officer action, shuffled.
    const settled = {
      denial: DENIAL,
      manualSnooze: SNOOZE,
      stateCode: "US_AZ",
    };
    firestoreHolds(settled);

    const payloads = [
      { denial: DENIAL, manualSnooze: SNOOZE, stateCode: "US_AZ" },
      { denial: DENIAL, stateCode: "US_AZ" },
      { stateCode: "US_AZ" },
      { denial: DENIAL, stateCode: "US_AZ" },
    ];
    for (const payload of payloads) {
      // An empty before, so the no-owned-field-changed gate drops none of them.
      // eslint-disable-next-line no-await-in-loop -- deliveries are sequential
      await handleWrite(event(OPP_PATH, {}), event(OPP_PATH, payload));
    }

    expect(upsert).toHaveBeenCalledTimes(4);
    for (const call of upsert.mock.calls) {
      expect(call[0]).toMatchObject({ manualSnooze: SNOOZE });
    }
  });

  it("deletes when the event carried a document Firestore no longer has", async () => {
    // Trusting the payload here would resurrect the record.
    firestoreHolds(null);

    await handleWrite(
      undefined,
      event(OPP_PATH, { denial: DENIAL, stateCode: "US_AZ" }),
    );

    expect(upsert).not.toHaveBeenCalled();
  });

  it("writes rather than deletes when a delete event is overtaken by a re-create", async () => {
    // Why the guard is not simply "skip when the event looks old".
    firestoreHolds({ denial: DENIAL, stateCode: "US_AZ" });

    await handleWrite(event(OPP_PATH, { stateCode: "US_AZ" }), undefined);

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0]?.[0]).toMatchObject({ denial: DENIAL });
  });

  it("patches a person document from Firestore too", async () => {
    // `patch` mode nulls absent fields, so a stale event CLEARS a newer value.
    firestoreHolds({ preferredName: "Sam" });

    await handleWrite(
      event("clientUpdatesV2/us_az_123", {}),
      event("clientUpdatesV2/us_az_123", {}),
    );

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0]).toMatchObject({ preferredName: "Sam" });
  });
});
