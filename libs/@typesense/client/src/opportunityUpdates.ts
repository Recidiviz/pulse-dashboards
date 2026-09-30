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

// An agreement between two separately deployed Cloud Functions that never call
// each other. Divergence fails silently, so both writers import from here.

import type { FirestoreDoc } from "./docIds";

export type OpportunityUpdateStatus =
  | "NONE"
  | "DENIED"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED";

export type DerivedUpdateFields = {
  /** Equal to the document's own id, which is also the opportunity's. */
  opportunityDocId: string;
  /** Derived from the document id */
  stateCode: string;
  updateStatus: OpportunityUpdateStatus;
  /**
   * Not `updateStatus !== "NONE"`: a snooze produces no `tabTitle` branch.
   * Excludes `lastViewed` — viewing is not acting.
   */
  hasOfficerAction: boolean;
  /** Epoch SECONDS. Set only under a SUBMITTED status. */
  submittedDateTimestamp?: number;
  /** Epoch SECONDS. ABSENT when never viewed — the stale partition needs that. */
  lastViewedTimestamp?: number;
};

/**
 * Every officer-written field mirrored onto an `opportunityUpdates` document.
 * One list, imported by both writers.
 */
export const OPPORTUNITY_UPDATE_FIELDS = [
  "denial",
  "manualSnooze",
  "autoSnooze",
  "omsSnooze",
  "submitted",
  "actionHistory",
  "lastViewed",
  "completed",
  "adjudicationStatus",
] as const;

// `lastViewed` is excluded on purpose — see `hasOfficerAction`.
const OFFICER_ACTION_FIELDS = [
  "denial",
  "submitted",
  "manualSnooze",
  "autoSnooze",
  "omsSnooze",
  "completed",
  "adjudicationStatus",
] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * To epoch SECONDS. The Admin SDK gives a `Timestamp` in process but
 * `{_seconds, _nanoseconds}` across a boundary.
 */
export function toEpochSeconds(value: unknown): number | undefined {
  if (typeof value === "number") return Math.floor(value);
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  if (!isObject(value)) return undefined;

  // Admin SDK Timestamp instance, and its serialized form.
  const seconds = value["seconds"] ?? value["_seconds"];
  if (typeof seconds === "number") return Math.floor(seconds);

  if (typeof value["toMillis"] === "function") {
    const millis = (value as { toMillis: () => unknown }).toMillis();
    if (typeof millis === "number") return Math.floor(millis / 1000);
  }
  return undefined;
}

/** Precomputed: a Typesense array filter matches ANY element, not the last. */
function latestAction(data: FirestoreDoc): Record<string, unknown> | undefined {
  const history = data["actionHistory"];
  if (!Array.isArray(history) || history.length === 0) return undefined;
  const last: unknown = history[history.length - 1];
  return isObject(last) ? last : undefined;
}

// TODO(OBT-52818): Share this branch order with OpportunityBase so the two
// can't drift.
function deriveStatus(data: FirestoreDoc): OpportunityUpdateStatus {
  // Branch order mirrors OpportunityBase.tabTitle, ungated.
  if (data["denial"]) return "DENIED";
  if (data["submitted"]) return "SUBMITTED";

  const action = latestAction(data);
  // Stale means superseded outside the approval flow, so it cannot decide status.
  if (!action || action["isStale"] === true) return "NONE";

  const supervisorResponse = action["supervisorResponse"];
  if (!supervisorResponse) return "IN_REVIEW";
  if (
    action["type"] === "APPROVAL" &&
    isObject(supervisorResponse) &&
    supervisorResponse["type"] === "APPROVAL"
  ) {
    return "APPROVED";
  }
  return "NONE";
}

/** `docId` is `mergeDocIdFromPath` over the Firestore path. */
export function deriveUpdateFields(
  data: FirestoreDoc,
  docId: string,
): DerivedUpdateFields {
  const updateStatus = deriveStatus(data);

  const history = data["actionHistory"];
  const hasOfficerAction =
    OFFICER_ACTION_FIELDS.some(
      (field) => data[field] !== undefined && data[field] !== null,
    ) ||
    // Kept out of the list above because an EMPTY array is truthy in JS.
    (Array.isArray(history) && history.length > 0);

  const submitted = data["submitted"];
  const lastViewed = data["lastViewed"];

  // Gated on the derived status, not presence: where `supportsSubmitted` is
  // off, a stray `submitted` outlives a denial.
  const submittedDateTimestamp =
    updateStatus === "SUBMITTED" && isObject(submitted)
      ? toEpochSeconds(submitted["date"])
      : undefined;
  const lastViewedTimestamp = isObject(lastViewed)
    ? toEpochSeconds(lastViewed["date"])
    : undefined;

  return {
    opportunityDocId: docId,
    updateStatus,
    hasOfficerAction,
    // Omitted, not undefined: the import must reject a document with no state.
    stateCode: data["stateCode"] as string,
    // Spread, not assigned: absent and present-and-undefined differ to the
    // stale-alert partition.
    ...(submittedDateTimestamp !== undefined ? { submittedDateTimestamp } : {}),
    ...(lastViewedTimestamp !== undefined ? { lastViewedTimestamp } : {}),
  };
}

/**
 * ISO date to epoch SECONDS. Pattern-checked because `Date.parse` turns junk
 * like "2026" into a number. Parses as UTC while the frontend's cutoff is
 * local, so a record on a boundary can land a day either side.
 */
function isoDateToEpochSeconds(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}(T|$)/.test(value)) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : Math.floor(parsed / 1000);
}

/**
 * The flat opportunity fields the homepage facets on. `eligibleDateTimestamp`
 * is `record.eligibleDate`, NOT what the `eligibilityDate` overrides resolve to.
 */
export function deriveOpportunityFields(data: FirestoreDoc): FirestoreDoc {
  const eligibleDateTimestamp = isoDateToEpochSeconds(data["eligibleDate"]);

  // `enable_nested_fields: false` is immutable, so a dotted field costs a recreate.
  const metadata = data["metadata"];
  const rawTabName = isObject(metadata) ? metadata["tabName"] : undefined;
  const tabName = typeof rawTabName === "string" ? rawTabName : undefined;

  // A second discriminator, not a synonym for `tabName`.
  const rawTabDescription = isObject(metadata)
    ? metadata["tabDescription"]
    : undefined;
  const tabDescription =
    typeof rawTabDescription === "string" ? rawTabDescription : undefined;

  // Emitted only when true, so absent reads as false.
  const metadataGrantedAt = isObject(metadata)
    ? metadata["grantedAt"]
    : undefined;
  const hasGrantedDate =
    typeof metadataGrantedAt === "string" && metadataGrantedAt !== "";

  return {
    ...(eligibleDateTimestamp !== undefined ? { eligibleDateTimestamp } : {}),
    ...(tabName !== undefined ? { tabName } : {}),
    ...(tabDescription !== undefined ? { tabDescription } : {}),
    ...(hasGrantedDate ? { hasGrantedDate } : {}),
  };
}
