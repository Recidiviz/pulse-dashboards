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

import type { Client as TypesenseClient } from "typesense";

import {
  buildPatch,
  ownedFieldsChanged,
  resolveTarget,
  summarizePatch,
  syncDocument,
} from "../src/sync";

// Records PATCHes per collection. `missing` marks collections that should 404,
// standing in for a record that lives in the other person collection or hasn't
// been indexed by the batch side yet.
function makeTypesense({
  missing = [] as string[],
  failWith,
}: { missing?: string[]; failWith?: unknown } = {}) {
  const patches: Array<{ collection: string; id: string; patch: unknown }> = [];

  const client = {
    collections: (collection: string) => ({
      documents: (id: string) => ({
        update: async (patch: unknown) => {
          if (failWith) throw failWith;
          if (missing.includes(collection)) throw { httpStatus: 404 };
          patches.push({ collection, id, patch });
        },
      }),
    }),
  } as unknown as TypesenseClient;

  return { client, patches };
}

describe("resolveTarget", () => {
  it("routes a person update at both person collections", () => {
    // The path can't say whether the record is a client or a resident, so both
    // are attempted and the wrong one 404s harmlessly.
    expect(resolveTarget("clientUpdatesV2/us_tn_123")).toEqual({
      collections: ["clients", "residents"],
      id: "us_tn_123",
      fields: ["preferredName"],
    });
  });

  it("keys an opportunity update by record id and doc id", () => {
    expect(
      resolveTarget(
        "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      ),
    ).toMatchObject({
      collections: ["opportunities"],
      id: "us_tn_123_usTnExpiration",
    });
  });

  it("composes the same id backfill-fn derives from the ETL fields", () => {
    // backfill-fn joins stateCode(lowercased)_externalId_opportunityType[_opportunityId].
    expect(
      resolveTarget(
        "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration_span2",
      )?.id,
    ).toBe("us_tn_123_usTnExpiration_span2");
  });

  it("returns null for sibling subcollections and unrelated paths", () => {
    expect(
      resolveTarget("clientUpdatesV2/us_tn_123/taskUpdates/supervision"),
    ).toBeNull();
    expect(
      resolveTarget("clientUpdatesV2/us_tn_123/custom_tasks/abc"),
    ).toBeNull();
    expect(resolveTarget("clients/us_tn_123")).toBeNull();
    expect(resolveTarget("DEMO_clientUpdatesV2/us_tn_123")).toBeNull();
  });
});

describe("buildPatch", () => {
  it("includes every declared field so a cleared value is actually cleared", () => {
    // Un-denying removes `denial` from the Firestore doc; omitting it from the
    // patch would leave the stale denial in the index.
    expect(buildPatch(["denial", "submitted"], { denial: { x: 1 } })).toEqual({
      denial: { x: 1 },
      submitted: null,
    });
  });

  it("nulls every field when the document was deleted", () => {
    expect(buildPatch(["preferredName"], null)).toEqual({
      preferredName: null,
    });
  });

  it("never emits an id, so the patch can't reshape the target doc", () => {
    expect(
      buildPatch(["denial"], { denial: {}, id: "nope", stateCode: "US_TN" }),
    ).toEqual({ denial: {} });
  });
});

describe("summarizePatch", () => {
  it("separates fields carrying a value from fields being cleared", () => {
    expect(
      summarizePatch({ denial: { x: 1 }, submitted: null, autoSnooze: null }),
    ).toEqual({ set: ["denial"], cleared: ["submitted", "autoSnooze"] });
  });

  it("reports names only, never values", () => {
    // Denial reasons and reviewer emails are officer-entered; they must not
    // reach the logs this feeds.
    const summary = summarizePatch({
      denial: { reasons: ["MEDICAL"], by: "officer@example.com" },
    });
    expect(JSON.stringify(summary)).not.toContain("officer@example.com");
    expect(JSON.stringify(summary)).not.toContain("MEDICAL");
  });
});

describe("ownedFieldsChanged", () => {
  it("ignores a write that touched only fields this sync doesn't own", () => {
    // FirestoreStore merges `stateCode` onto the parent clientUpdatesV2 doc on
    // every opportunity action, firing the person trigger.
    expect(
      ownedFieldsChanged(["preferredName"], null, { stateCode: "US_TN" }),
    ).toBe(false);
    expect(
      ownedFieldsChanged(
        ["denial"],
        { denial: { reasons: ["X"] }, currentReviewerId: "a" },
        { denial: { reasons: ["X"] }, currentReviewerId: "b" },
      ),
    ).toBe(false);
  });

  it("treats a removed field as a change so the index still gets cleared", () => {
    // Un-denying deletes `denial` from the Firestore doc. A presence test would
    // read that as "nothing to do" and leave the stale denial indexed.
    expect(ownedFieldsChanged(["denial"], { denial: { x: 1 } }, {})).toBe(true);
    expect(
      ownedFieldsChanged(["preferredName"], { preferredName: "Bo" }, null),
    ).toBe(true);
  });

  it("compares values deeply, since the owned fields are objects", () => {
    expect(
      ownedFieldsChanged(
        ["denial"],
        { denial: { reasons: ["MEDICAL"] } },
        { denial: { reasons: ["MEDICAL"] } },
      ),
    ).toBe(false);
    expect(
      ownedFieldsChanged(
        ["denial"],
        { denial: { reasons: ["MEDICAL"] } },
        { denial: { reasons: ["OTHER"] } },
      ),
    ).toBe(true);
  });

  it("treats absent and null as the same state", () => {
    expect(
      ownedFieldsChanged(["preferredName"], {}, { preferredName: null }),
    ).toBe(false);
  });
});

describe("syncDocument", () => {
  it("reports which collection the patch landed in and what changed", async () => {
    // This is what makes a deployed sync verifiable from the logs.
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      { denial: { reasons: ["X"] } },
      null,
    );

    expect(result).toEqual({
      status: "patched",
      collection: "opportunities",
      id: "us_tn_123_usTnExpiration",
      set: ["denial"],
      cleared: ["manualSnooze", "autoSnooze", "submitted", "actionHistory"],
    });
  });

  it("reports the id it looked for when the record isn't indexed", async () => {
    const ts = makeTypesense({ missing: ["clients", "residents"] });
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { preferredName: "Bo" },
      null,
    );

    expect(result).toMatchObject({ status: "absent", id: "us_tn_123" });
  });

  it("stops at the first collection that accepts the patch", async () => {
    const ts = makeTypesense();
    await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { preferredName: "Bo" },
      null,
    );

    // A person is a client or a resident, never both — no second write.
    expect(ts.patches).toHaveLength(1);
    expect(ts.patches[0].collection).toBe("clients");
  });

  it("patches only the fields it owns onto the opportunity", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      { denial: { reasons: ["X"] }, actionHistory: [{ type: "SUBMITTED" }] },
      null,
    );

    expect(result.status).toBe("patched");
    expect(ts.patches).toEqual([
      {
        collection: "opportunities",
        id: "us_tn_123_usTnExpiration",
        patch: {
          denial: { reasons: ["X"] },
          manualSnooze: null,
          autoSnooze: null,
          submitted: null,
          actionHistory: [{ type: "SUBMITTED" }],
        },
      },
    ]);
  });

  it("never upserts, so ETL-owned fields survive", async () => {
    const ts = makeTypesense();
    await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { preferredName: "Bo" },
      null,
    );

    // A patch body carrying only preferredName can't clobber personName,
    // officerId, allEligibleOpportunities, etc.
    expect(ts.patches[0].patch).toEqual({ preferredName: "Bo" });
  });

  it("self-routes a person update to whichever collection has the record", async () => {
    const ts = makeTypesense({ missing: ["clients"] });
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { preferredName: "Bo" },
      null,
    );

    expect(result.status).toBe("patched");
    expect(ts.patches).toHaveLength(1);
    expect(ts.patches[0].collection).toBe("residents");
  });

  it("reports absent when the record isn't indexed anywhere yet", async () => {
    // The window between the ETL writing Firestore and the backfill indexing
    // it. Harmless: the next backfill reconciles the update from Firestore.
    const ts = makeTypesense({ missing: ["clients", "residents"] });
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { preferredName: "Bo" },
      null,
    );

    expect(result.status).toBe("absent");
    expect(ts.patches).toHaveLength(0);
  });

  it("clears the fields rather than deleting the record on a Firestore delete", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      null,
      { denial: { reasons: ["X"] } },
    );

    expect(result.status).toBe("patched");
    expect(ts.patches[0].patch).toEqual({
      denial: null,
      manualSnooze: null,
      autoSnooze: null,
      submitted: null,
      actionHistory: null,
    });
  });

  it("rethrows a non-404 failure so the trigger retries", async () => {
    const ts = makeTypesense({ failWith: { httpStatus: 503 } });

    await expect(
      syncDocument(
        ts.client,
        "clientUpdatesV2/us_tn_123",
        { preferredName: "Bo" },
        null,
      ),
    ).rejects.toMatchObject({ httpStatus: 503 });
  });

  it("skips paths it doesn't recognize without writing anything", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/taskUpdates/supervision",
      { foo: "bar" },
      null,
    );

    expect(result.status).toBe("skipped");
    expect(ts.patches).toHaveLength(0);
  });

  it("writes nothing when the write missed the fields it owns", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { stateCode: "US_TN" },
      null,
    );

    expect(result).toEqual({
      status: "unchanged",
      id: "us_tn_123",
      set: [],
      cleared: [],
    });
    expect(ts.patches).toHaveLength(0);
  });

  it("writes nothing when only an opportunity's bookkeeping fields changed", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      { denial: { reasons: ["X"] }, currentReviewerId: "second@example.com" },
      { denial: { reasons: ["X"] }, currentReviewerId: "first@example.com" },
    );

    expect(result.status).toBe("unchanged");
    expect(ts.patches).toHaveLength(0);
  });

  it("still patches when an owned field changed alongside an unowned one", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123",
      { stateCode: "US_TN", preferredName: "Bo" },
      { stateCode: "US_TN" },
    );

    expect(result.status).toBe("patched");
    expect(ts.patches[0].patch).toEqual({ preferredName: "Bo" });
  });
});
