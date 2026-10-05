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

// Names a census bucket by asking the REAL `tabTitle()`.
//
// Each census bucket is a distinct combination of the key fields, and Typesense
// reports its size. Turning that size into a rendered tab needs a NAME, and the
// only correct source is the opportunity class — many override `tabTitle()` in
// ways no query can express.
//
// This is an ADAPTER, not a copy. No tab rule is written here.
//
// A bucket holds records nobody has acted on, so every approval-flow branch
// that reads the OVERLAY is false by construction. What survives reads only the
// RECORD fields the bucket key already carries.
//
//
// The index stores those fields and nothing else of the record, so a document
// from it cannot be parsed by its Zod schema. That is why the class is not
// constructed the usual way.

import { OpportunityType } from "~datatypes";

import { RootStore } from "../../RootStore";
import {
  Opportunity,
  OpportunityTab,
  OpportunityTabGroup,
} from "../Opportunity";
import { OpportunityBase } from "../Opportunity/OpportunityBase";
import { opportunityConstructors } from "../Opportunity/opportunityConstructors";
import { JusticeInvolvedPerson } from "../types";

/**
 * Types whose untouched tab reads data the bucket key does not carry, so one
 * exemplar cannot speak for its bucket.
 *
 * Returning undefined withholds the count, which is right — a guess would
 * render a wrong number that looks right. Dropping the card is NOT right, and
 * is why this set must be empty before launch rather than merely accurate.
 *
 * TODO(OBT-53660) Do not maintain this list and derive every tab title directly
 */
export const BUCKET_KEY_INSUFFICIENT: ReadonlySet<string> = new Set([
  // Compare `eligibilityDate` against the current week. A date is continuous,
  // so it cannot join the key the way `tabName` does; they need their own
  // date-bucketed grouping.
  "usMoOverdueRestrictiveHousingInitialHearing",
  "usMoOverdueRestrictiveHousingRelease",
  "usMoOverdueRestrictiveHousingReviewHearing",
  // Reads the COMPANION opportunity's denial, which is not on the record.
  "usIaCompleteSupervisionLevelDowngrade",
]);

/** The fields a census bucket is keyed by. */
export type BucketKey = {
  opportunityType: OpportunityType;
  isEligible: boolean;
  isAlmostEligible: boolean;
  tabName?: string;
  /** US_AZ's own discriminator; see the field in schemas/index.ts. */
  tabDescription?: string;
  /** US_TX reads a grant off the RECORD; see the field in schemas/index.ts. */
  hasGrantedDate?: boolean;
};

/**
 * A stand-in for the person the record belongs to.
 *
 * A bucket has no single person, and no untouched branch reads one — except
 * `UsIaSupervisionLevelDowngrade`, which reaches a COMPANION opportunity's
 * denial. That one throws here and is reported unreconstructable.
 */
function personStub(rootStore: RootStore): JusticeInvolvedPerson {
  return {
    // Non-empty, and deliberately not a real id. The update subscription builds
    // a Firestore DocumentReference in its constructor, and an empty recordId
    // makes an invalid one-segment path. Nothing ever subscribes to it.
    recordId: "us_xx_TAB_PROBE",
    externalId: "TAB_PROBE",
    pseudonymizedId: "TAB_PROBE",
    stateCode: "US_XX",
    rootStore,
    opportunities: {},
    flattenedOpportunities: [],
  } as unknown as JusticeInvolvedPerson;
}

/**
 * The tab a record with these fields lands on, or undefined when the class
 * cannot answer without a real document.
 *
 * With no `updates` the answer is the UNTOUCHED tab, which is what a census
 * bucket needs. With them it is the record's real tab.
 *
 * `OpportunityBase`'s own constructor does NOT parse — each subclass parses
 * before calling `super` — so building the base directly gives a properly
 * initialised instance. The update subscription is inert: its listener only
 * attaches when something subscribes, and nothing here does.
 */
export function tabTitleForBucket(
  {
    opportunityType,
    isEligible,
    isAlmostEligible,
    tabName,
    tabDescription,
    hasGrantedDate,
  }: BucketKey,
  rootStore: RootStore,
  updates?: unknown,
): OpportunityTab | undefined {
  // Present but empty, so `metadata.tabName` reads as absent rather than
  // throwing on the types that switch on it.
  const record = {
    stateCode: "",
    externalId: "",
    opportunityType,
    isEligible,
    isAlmostEligible,
    metadata: {
      ...(tabName !== undefined ? { tabName } : {}),
      ...(tabDescription !== undefined ? { tabDescription } : {}),
      // Only its PRESENCE is read, by `isGrantApproved`. The value is a
      // placeholder; the parity test catches a branch that compares the date.
      ...(hasGrantedDate ? { grantedAt: "2000-01-01" } : {}),
    },
    eligibleCriteria: {},
    ineligibleCriteria: {},
  };

  if (BUCKET_KEY_INSUFFICIENT.has(opportunityType)) return undefined;

  try {
    const base = new OpportunityBase(
      personStub(rootStore),
      opportunityType,
      rootStore,
      record,
    );
    // Without a config there are no tab titles to return and no tab group to
    // pass, so there is no answer to give.
    if (!base.config) return undefined;

    // Assigning the subscription is how this codebase stubs an overlay; the
    // field is writable for that reason. Nothing subscribes, so `data` is the
    // only member any tab branch reaches.
    base.updatesSubscription = {
      data: updates,
    } as unknown as typeof base.updatesSubscription;

    // Re-point the instance at the REAL class rather than borrowing `tabTitle`
    // onto a base instance. Borrowing resolves every OTHER getter against
    // `OpportunityBase.prototype`, so an override that leans on another
    // override silently gets the base one.
    const prototype = opportunityConstructors[opportunityType]?.prototype;
    if (prototype) Object.setPrototypeOf(base, prototype);

    // The group `OpportunityTypeSummary` renders by. No override reads it
    // today, but disagreeing silently would be worse than passing it.
    const tabGroup = Object.keys(
      base.config.tabGroups ?? {},
    )[0] as OpportunityTabGroup;

    return (base as unknown as Opportunity).tabTitle(tabGroup);
  } catch {
    // A class that needs more than the bucket key. Reported rather than
    // guessed — see `reconstructTabCounts`.
    return undefined;
  }
}
