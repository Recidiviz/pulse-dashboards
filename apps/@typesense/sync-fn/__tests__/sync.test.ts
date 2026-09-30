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

// Records every write, by kind, because the two triggers now write differently:
// the person path PATCHes a document backfill-fn owns, the opportunity path
// UPSERTs one nothing else writes.
//
// `missing` marks collections that should 404, standing in for a record that
// lives in the other person collection, or one the batch side has not indexed.
function makeTypesense({
  missing = [] as string[],
  failWith,
}: { missing?: string[]; failWith?: unknown } = {}) {
  const patches: Array<{ collection: string; id: string; patch: unknown }> = [];
  const upserts: Array<{ collection: string; doc: Record<string, unknown> }> =
    [];
  const deletes: Array<{ collection: string; id: string }> = [];

  const client = {
    collections: (collection: string) => ({
      documents: (id?: string) => ({
        update: async (patch: unknown) => {
          if (failWith) throw failWith;
          if (missing.includes(collection)) throw { httpStatus: 404 };
          patches.push({ collection, id: id as string, patch });
        },
        // Upsert CREATES, which is why the opportunity path needs no 404 branch.
        upsert: async (doc: Record<string, unknown>) => {
          if (failWith) throw failWith;
          upserts.push({ collection, doc });
        },
        delete: async () => {
          if (failWith) throw failWith;
          if (missing.includes(collection)) throw { httpStatus: 404 };
          deletes.push({ collection, id: id as string });
        },
      }),
    }),
  } as unknown as TypesenseClient;

  return { client, patches, upserts, deletes };
}

describe("resolveTarget", () => {
  it("routes a person update at both person collections", () => {
    // The path can't say whether the record is a client or a resident, so both
    // are attempted and the wrong one 404s harmlessly.
    expect(resolveTarget("clientUpdatesV2/us_tn_123")).toEqual({
      mode: "patch",
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
      // Its own collection, and this function is its only writer.
      mode: "own",
      collections: ["opportunityUpdates"],
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
  it("reports which collection the write landed in and what changed", async () => {
    // This is what makes a deployed sync verifiable from the logs.
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      { denial: { reasons: ["X"] }, stateCode: "US_TN" },
      null,
    );

    expect(result).toEqual({
      status: "upserted",
      collection: "opportunityUpdates",
      id: "us_tn_123_usTnExpiration",
      set: ["denial", "stateCode"],
      // Under upsert an omitted field is a cleared field, so these are
      // reported the same way a patch would report an explicit null.
      cleared: [
        "manualSnooze",
        "autoSnooze",
        "omsSnooze",
        "submitted",
        "actionHistory",
        "lastViewed",
        "completed",
        "adjudicationStatus",
      ],
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

  it("upserts a whole document, omitting rather than nulling absent fields", async () => {
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      { denial: { reasons: ["X"] }, stateCode: "US_TN" },
      null,
    );

    expect(result.status).toBe("upserted");
    expect(ts.patches).toHaveLength(0);
    expect(ts.upserts).toHaveLength(1);

    const { collection, doc } = ts.upserts[0];
    expect(collection).toBe("opportunityUpdates");
    expect(doc).toEqual({
      id: "us_tn_123_usTnExpiration",
      // Equal to the id, so the reference resolves without a lookup.
      opportunityDocId: "us_tn_123_usTnExpiration",
      denial: { reasons: ["X"] },
      stateCode: "US_TN",
      updateStatus: "DENIED",
      hasOfficerAction: true,
    });
    // Absent fields are OMITTED, not nulled — an upsert replaces the document,
    // so leaving them out already clears them.
    expect(doc).not.toHaveProperty("submitted");
    expect(doc).not.toHaveProperty("lastViewedTimestamp");
  });

  it("derives status without reading anything", async () => {
    // The property that keeps this function cheap: everything stored comes from
    // the write payload, so an officer action costs no document read.
    const ts = makeTypesense();
    await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      {
        stateCode: "US_TN",
        lastViewed: { date: { seconds: 1_700_000_000 }, by: "o@e.gov" },
      },
      null,
    );

    const { doc } = ts.upserts[0];
    // Viewing is not acting — this is what keeps the homepage's fetch small.
    expect(doc["hasOfficerAction"]).toBe(false);
    expect(doc["updateStatus"]).toBe("NONE");
    expect(doc["lastViewedTimestamp"]).toBe(1_700_000_000);
  });

  it("never upserts on the PERSON path, so ETL-owned fields survive", async () => {
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

  it("DELETES the mirror when the Firestore update is deleted", async () => {
    // The opposite of the person path, and for a reason: an opportunity record
    // outlives any officer action on it, but an update document IS the action.
    const ts = makeTypesense();
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      null,
      { denial: { reasons: ["X"] } },
    );

    expect(result.status).toBe("deleted");
    expect(ts.upserts).toHaveLength(0);
    expect(ts.deletes).toEqual([
      { collection: "opportunityUpdates", id: "us_tn_123_usTnExpiration" },
    ]);
  });

  it("tolerates deleting a mirror that is already gone", async () => {
    // A re-delivered trigger. Nothing to retry — the prune would remove it too.
    const ts = makeTypesense({ missing: ["opportunityUpdates"] });
    const result = await syncDocument(
      ts.client,
      "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      null,
      { denial: { reasons: ["X"] } },
    );

    expect(result.status).toBe("absent");
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
