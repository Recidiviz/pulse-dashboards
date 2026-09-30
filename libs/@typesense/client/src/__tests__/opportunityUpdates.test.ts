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

import { describe, expect, it } from "vitest";

import {
  deriveOpportunityFields,
  deriveUpdateFields,
  toEpochSeconds,
} from "../opportunityUpdates";

// The in-process Admin SDK shape, and the shape it serializes to.
const ts = (seconds: number) => ({ seconds, nanoseconds: 0 });
const serializedTs = (seconds: number) => ({
  _seconds: seconds,
  _nanoseconds: 0,
});

// A real update-document id: `mergeDocIdFromPath` over
// clientUpdatesV2/us_tn_123/clientOpportunityUpdates/usTnExpiration.
const DOC_ID = "us_tn_123_usTnExpiration";

const action = (over: Record<string, unknown> = {}) => ({
  type: "APPROVAL",
  isStale: false,
  date: ts(1_700_000_000),
  by: "officer@example.gov",
  ...over,
});

describe("toEpochSeconds", () => {
  it("reads an Admin SDK Timestamp", () => {
    expect(toEpochSeconds(ts(1_700_000_000))).toBe(1_700_000_000);
  });

  it("reads a serialized Timestamp", () => {
    expect(toEpochSeconds(serializedTs(1_700_000_000))).toBe(1_700_000_000);
  });

  it("reads a Date", () => {
    expect(toEpochSeconds(new Date(1_700_000_000_000))).toBe(1_700_000_000);
  });

  it("returns seconds, not milliseconds", () => {
    const seconds = toEpochSeconds(new Date(1_700_000_000_000));
    expect(seconds).toBeLessThan(2_000_000_000);
  });

  it("returns undefined for anything it cannot read", () => {
    expect(toEpochSeconds(undefined)).toBeUndefined();
    expect(toEpochSeconds(null)).toBeUndefined();
    expect(toEpochSeconds("2026-01-01")).toBeUndefined();
    expect(toEpochSeconds({})).toBeUndefined();
  });
});

describe("deriveUpdateFields — updateStatus", () => {
  it("is NONE for an empty update", () => {
    expect(deriveUpdateFields({}, DOC_ID).updateStatus).toBe("NONE");
  });

  it("is NONE for a view-only update", () => {
    const update = { lastViewed: { date: ts(1), by: "o@e.gov" } };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("NONE");
  });

  it("is DENIED when a denial is present", () => {
    const update = { denial: { reasons: ["COURT_ORDER"] } };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("DENIED");
  });

  it("is SUBMITTED when a submission is present", () => {
    const update = { submitted: { date: ts(1), by: "o@e.gov" } };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("SUBMITTED");
  });

  it("prefers DENIED over SUBMITTED, matching tabTitle's branch order", () => {
    const update = {
      denial: { reasons: ["X"] },
      submitted: { date: ts(1), by: "o@e.gov" },
    };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("DENIED");
  });

  it("is IN_REVIEW when the latest action awaits a supervisor", () => {
    const update = { actionHistory: [action()] };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("IN_REVIEW");
  });

  it("is APPROVED when a supervisor approved an approval request", () => {
    const update = {
      actionHistory: [
        action({ supervisorResponse: { type: "APPROVAL", by: "s@e.gov" } }),
      ],
    };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("APPROVED");
  });

  it("is NONE when a supervisor DENIED an approval request", () => {
    const update = {
      actionHistory: [
        action({ supervisorResponse: { type: "DENIAL", by: "s@e.gov" } }),
      ],
    };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("NONE");
  });

  it("ignores a STALE action", () => {
    const update = { actionHistory: [action({ isStale: true })] };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("NONE");
  });

  it("reads only the LAST action, never any earlier one", () => {
    // Why the field is precomputed: an array filter matches ANY element.
    const update = {
      actionHistory: [
        action({ supervisorResponse: { type: "APPROVAL" } }),
        action({ isStale: true }),
      ],
    };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("NONE");
  });

  it("is NONE for an empty action history", () => {
    expect(deriveUpdateFields({ actionHistory: [] }, DOC_ID).updateStatus).toBe(
      "NONE",
    );
  });

  it("stores SUBMITTED regardless of config.supportsSubmitted", () => {
    const update = { submitted: { date: ts(1), by: "o@e.gov" } };
    expect(deriveUpdateFields(update, DOC_ID).updateStatus).toBe("SUBMITTED");
  });
});

describe("deriveUpdateFields — hasOfficerAction", () => {
  it("is false for an empty update", () => {
    expect(deriveUpdateFields({}, DOC_ID).hasOfficerAction).toBe(false);
  });

  it("is FALSE for a view-only update", () => {
    const update = { lastViewed: { date: ts(1), by: "o@e.gov" } };
    expect(deriveUpdateFields(update, DOC_ID).hasOfficerAction).toBe(false);
  });

  it.each([
    ["denial", { denial: { reasons: ["X"] } }],
    ["submitted", { submitted: { date: ts(1), by: "o@e.gov" } }],
    ["manualSnooze", { manualSnooze: { snoozeForDays: 30 } }],
    ["autoSnooze", { autoSnooze: { snoozeUntil: "2026-01-01" } }],
    ["omsSnooze", { omsSnooze: { status: "PENDING" } }],
    ["completed", { completed: { update: { by: "o@e.gov" } } }],
    ["adjudicationStatus", { adjudicationStatus: { by: "o@e.gov" } }],
    ["actionHistory", { actionHistory: [action()] }],
  ])("is true for %s", (_label, update) => {
    expect(deriveUpdateFields(update, DOC_ID).hasOfficerAction).toBe(true);
  });

  it("is true for a snooze even though updateStatus stays NONE", () => {
    const derived = deriveUpdateFields(
      { manualSnooze: { snoozeForDays: 30 } },
      DOC_ID,
    );
    expect(derived.updateStatus).toBe("NONE");
    expect(derived.hasOfficerAction).toBe(true);
  });

  it("is false for an empty action history", () => {
    expect(
      deriveUpdateFields({ actionHistory: [] }, DOC_ID).hasOfficerAction,
    ).toBe(false);
  });
});

describe("deriveUpdateFields — timestamps", () => {
  it("sets submittedDateTimestamp only when the status is SUBMITTED", () => {
    const derived = deriveUpdateFields(
      {
        submitted: { date: ts(1_700_000_000), by: "o@e.gov" },
      },
      DOC_ID,
    );
    expect(derived.submittedDateTimestamp).toBe(1_700_000_000);
  });

  it("omits submittedDateTimestamp when a denial outranks a stray submission", () => {
    // A stray `submitted` outlives a denial on most types, and a range facet
    // counts every document where the field is present.
    const derived = deriveUpdateFields(
      {
        denial: { reasons: ["X"] },
        submitted: { date: ts(1_700_000_000), by: "o@e.gov" },
      },
      DOC_ID,
    );
    expect(derived).not.toHaveProperty("submittedDateTimestamp");
  });

  it("sets lastViewedTimestamp whenever the record was viewed", () => {
    const derived = deriveUpdateFields(
      {
        lastViewed: { date: serializedTs(1_700_000_000), by: "o@e.gov" },
      },
      DOC_ID,
    );
    expect(derived.lastViewedTimestamp).toBe(1_700_000_000);
  });

  it("OMITS lastViewedTimestamp entirely when never viewed", () => {
    // Absent, not zero: the partition asks Typesense for documents lacking it.
    const derived = deriveUpdateFields({ denial: { reasons: ["X"] } }, DOC_ID);
    expect(derived).not.toHaveProperty("lastViewedTimestamp");
  });

  it("omits a timestamp it cannot read rather than emitting undefined", () => {
    const derived = deriveUpdateFields(
      {
        lastViewed: { date: "not-a-timestamp", by: "o@e.gov" },
      },
      DOC_ID,
    );
    expect(derived).not.toHaveProperty("lastViewedTimestamp");
  });
});

describe("deriveUpdateFields — purity", () => {
  it("does not mutate its input", () => {
    const update = { denial: { reasons: ["X"] } };
    const snapshot = JSON.stringify(update);
    deriveUpdateFields(update, DOC_ID);
    expect(JSON.stringify(update)).toBe(snapshot);
  });

  it("is deterministic across calls, with no clock dependence", () => {
    const update = { actionHistory: [action()] };
    expect(deriveUpdateFields(update, DOC_ID)).toEqual(
      deriveUpdateFields(update, DOC_ID),
    );
  });

  it("needs no eligibility field to produce a status", () => {
    expect(
      deriveUpdateFields({ denial: { reasons: ["X"] } }, DOC_ID).updateStatus,
    ).toBe("DENIED");
  });
});

describe("deriveUpdateFields — stateCode", () => {
  it("copies the value the document carries", () => {
    expect(deriveUpdateFields({ stateCode: "US_ND" }, DOC_ID).stateCode).toBe(
      "US_ND",
    );
  });

  it("yields undefined when the document has none, so the import rejects", () => {
    // The schema declares it required, and `JSON.stringify` drops an undefined
    // value — so the field reaches Typesense absent and fails that one document
    // loudly, rather than filing it under no state. Every update document
    // carries it, and a state-scoped backfill filters on it directly.
    expect(deriveUpdateFields({}, DOC_ID).stateCode).toBeUndefined();
  });

  it("always sets opportunityDocId to the document's own id", () => {
    expect(deriveUpdateFields({}, DOC_ID).opportunityDocId).toBe(DOC_ID);
  });
});

describe("deriveOpportunityFields", () => {
  it("lifts metadata.tabName out to a flat field", () => {
    // Flat, not `metadata.tabName`.
    expect(
      deriveOpportunityFields({ metadata: { tabName: "OVERDUE" } }),
    ).toEqual({ tabName: "OVERDUE" });
  });

  it("omits tabName when metadata has none, or is not an object", () => {
    for (const metadata of [undefined, null, {}, "x", { tabName: 7 }]) {
      expect(deriveOpportunityFields({ metadata })).toEqual({});
    }
  });

  it("yields both fields together", () => {
    expect(
      deriveOpportunityFields({
        eligibleDate: "2026-01-01",
        metadata: { tabName: "DUE" },
      }),
    ).toEqual({ eligibleDateTimestamp: 1767225600, tabName: "DUE" });
  });

  it("converts an ISO date to epoch seconds", () => {
    // 2026-01-01 at UTC midnight.
    expect(deriveOpportunityFields({ eligibleDate: "2026-01-01" })).toEqual({
      eligibleDateTimestamp: 1767225600,
    });
  });

  it("accepts a full ISO timestamp", () => {
    expect(
      deriveOpportunityFields({ eligibleDate: "2026-01-01T12:00:00Z" }),
    ).toEqual({ eligibleDateTimestamp: 1767268800 });
  });

  it("omits the field rather than guessing", () => {
    // `Date.parse` accepts all of these, and the stale-alert facet counts every
    // document that HAS the field — so a guessed value inflates it silently.
    for (const eligibleDate of ["2026", "March 5", "", "not a date"]) {
      expect(deriveOpportunityFields({ eligibleDate })).toEqual({});
    }
  });

  it("omits the field when the date is absent or not a string", () => {
    for (const eligibleDate of [undefined, null, 1767225600, {}]) {
      expect(deriveOpportunityFields({ eligibleDate })).toEqual({});
    }
  });
});
