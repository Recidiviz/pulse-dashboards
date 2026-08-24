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
  composeDocIdFromFields,
  mergeDocIdFromPath,
  toTypesenseId,
} from "../docIds";

describe("composeDocIdFromFields", () => {
  const OPPORTUNITY_ID_FIELDS = [
    "stateCode",
    "externalId",
    "opportunityType",
    "opportunityId",
  ];

  it("joins the declared fields, lowercasing only what's asked for", () => {
    // Must equal what sync-fn composes from the update's Firestore path
    // (`clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration`),
    // or the two writers address different documents.
    expect(
      composeDocIdFromFields(
        {
          stateCode: "US_TN",
          externalId: "123",
          opportunityType: "usTnExpiration",
        },
        OPPORTUNITY_ID_FIELDS,
        ["stateCode"],
      ),
    ).toBe("us_tn_123_usTnExpiration");
  });

  it("appends opportunityId for repeated eligibility spans", () => {
    expect(
      composeDocIdFromFields(
        {
          stateCode: "US_TN",
          externalId: "123",
          opportunityType: "usTnExpiration",
          opportunityId: "span2",
        },
        OPPORTUNITY_ID_FIELDS,
        ["stateCode"],
      ),
    ).toBe("us_tn_123_usTnExpiration_span2");
  });

  it("skips absent and empty values rather than emitting a bare separator", () => {
    expect(
      composeDocIdFromFields(
        { stateCode: "US_TN", externalId: "", opportunityType: "usTnLSU" },
        OPPORTUNITY_ID_FIELDS,
        ["stateCode"],
      ),
    ).toBe("us_tn_usTnLSU");
  });

  it("returns undefined when nothing usable is present, so callers fall back", () => {
    expect(
      composeDocIdFromFields({ isEligible: true }, OPPORTUNITY_ID_FIELDS),
    ).toBeUndefined();
  });
});

// One definition, shared by the import pass and the prune's confirming scan. The
// two compare id sets against each other, so drift between them would confirm
// nothing and the prune would delete live docs.
describe("toTypesenseId", () => {
  it("uses the Firestore doc id when there is no override", () => {
    expect(toTypesenseId("us_id_123", {}, undefined)).toBe("us_id_123");
  });

  it("prefixes so same-id docs from different sources don't collide", () => {
    expect(
      toTypesenseId("us_tn_123", {}, { type: "prefix", prefix: "LSU" }),
    ).toBe("LSU_us_tn_123");
  });

  it("composes from fields, lowercasing the state code", () => {
    expect(
      toTypesenseId(
        "ignored",
        {
          stateCode: "US_TN",
          externalId: "123",
          opportunityType: "usTnExpiration",
        },
        {
          type: "fields",
          fields: ["stateCode", "externalId", "opportunityType"],
          lowercaseFields: ["stateCode"],
        },
      ),
    ).toBe("us_tn_123_usTnExpiration");
  });

  it("falls back to the Firestore id when a doc carries none of the id fields", () => {
    expect(
      toTypesenseId(
        "fallback_id",
        { isEligible: true },
        { type: "fields", fields: ["stateCode", "externalId"] },
      ),
    ).toBe("fallback_id");
  });
});

describe("mergeDocIdFromPath", () => {
  it("keys a person update by its record id", () => {
    expect(mergeDocIdFromPath("clientUpdatesV2/us_tn_123")).toBe("us_tn_123");
  });

  it("keys a subcollection update by record id + doc id", () => {
    expect(
      mergeDocIdFromPath(
        "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration",
      ),
    ).toBe("us_tn_123_usTnExpiration");
  });

  it("agrees with composeDocIdFromFields on the same record", () => {
    // The correspondence the whole merged-collection design rests on.
    expect(
      mergeDocIdFromPath(
        "clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration_span2",
      ),
    ).toBe(
      composeDocIdFromFields(
        {
          stateCode: "US_TN",
          externalId: "123",
          opportunityType: "usTnExpiration",
          opportunityId: "span2",
        },
        ["stateCode", "externalId", "opportunityType", "opportunityId"],
        ["stateCode"],
      ),
    );
  });
});
