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

import { CollectionFieldSchema } from "typesense/lib/Typesense/Collection";
import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

import type { SystemId } from "~datatypes";

/**
 * The systems a STORED document can belong to.
 *
 * `SystemId` also carries `ALL`, which is a query-time concept — a user asking
 * for both — and never a value in the index. Excluding it means a backfill
 * request carrying `ALL` is rejected rather than indexed and then matched by
 * no scoped key.
 */
export type DocumentSystem = Exclude<SystemId, "ALL">;

/** The same two, for validating a value that arrives at runtime. */
export const DOCUMENT_SYSTEMS: readonly DocumentSystem[] = [
  "SUPERVISION",
  "INCARCERATION",
];

// Discriminates supervision vs incarceration on collections queried by a
// cross-system caseload-scoped key. Stamped by backfill-fn's
// constantFields for staff/person collections (each is inherently single-
// system per collection); locations get their `system` derived from `idType`
// upstream; `opportunities` spans both systems and takes its value from the
// backfill REQUEST, which the ETL stamps per source collection.
const systemField: CollectionFieldSchema = {
  name: "system",
  type: "string",
  facet: true,
  optional: true,
};

const staffCommonFields = [
  { name: "stateCode", type: "string", facet: true },
  { name: "staffExternalId", type: "string" },
  { name: "pseudonymizedId", type: "string" },
  { name: "email", type: "string", optional: true, infix: true },
  { name: "givenNames", type: "string", sort: true, infix: true },
  { name: "surname", type: "string", sort: true, infix: true },
  systemField,
] as CollectionFieldSchema[];

export const schemas: CollectionCreateSchema[] = [
  {
    name: "clients",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      {
        name: "allEligibleOpportunities",
        type: "string[]",
        facet: true,
      },
      { name: "pseudonymizedId", type: "string" },
      { name: "personExternalId", type: "string", infix: true },
      { name: "displayId", type: "string", optional: true },
      { name: "officerId", type: "string", facet: true },
      {
        name: "personName.givenNames",
        type: "string",
        infix: true,
      },
      {
        name: "personName.surname",
        type: "string",
        infix: true,
      },
      { name: "district", type: "string", optional: true, facet: true },
      // User-set override, merged from the `clientUpdatesV2/{recordId}`
      // Firestore document. Searched, so it has to live here.
      { name: "preferredName", type: "string", optional: true, infix: true },
      systemField,
    ],
  },
  {
    name: "residents",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      {
        name: "allEligibleOpportunities",
        type: "string[]",
        facet: true,
      },
      { name: "pseudonymizedId", type: "string" },
      { name: "personExternalId", type: "string", infix: true },
      { name: "displayId", type: "string", optional: true },
      { name: "officerId", type: "string", optional: true, facet: true },
      {
        name: "personName.givenNames",
        type: "string",
        infix: true,
      },
      {
        name: "personName.surname",
        type: "string",
        infix: true,
      },
      { name: "facilityId", type: "string", optional: true, facet: true },
      { name: "facilityUnitId", type: "string", optional: true, facet: true },
      // Used by US_ID tenant config (searchField: ["metadata", "crcFacilities"])
      // to filter residents by Community Reentry Center facility. The full
      // `metadata` blob is much larger on residents; declaring only this
      // nested leaf keeps the indexed surface tight.
      {
        name: "metadata.crcFacilities",
        type: "string[]",
        optional: true,
        facet: true,
        infix: true,
      },
      // See the note on clients.preferredName — `clientUpdatesV2` feeds both
      // person collections.
      { name: "preferredName", type: "string", optional: true, infix: true },
      systemField,
    ],
  },
  {
    name: "supervisionStaff",
    enable_nested_fields: true,
    fields: [
      ...staffCommonFields,
      { name: "district", type: "string", facet: true, optional: true },
      {
        name: "supervisorExternalId",
        type: "string",
        facet: true,
        optional: true,
      },
      {
        name: "supervisorExternalIds",
        type: "string[]",
        facet: true,
        optional: true,
      },
      { name: "hasCaseload", type: "bool", facet: true, optional: false },
    ],
  },
  {
    name: "incarcerationStaff",
    enable_nested_fields: true,
    fields: [
      ...staffCommonFields,
      // Declared but never populated.
      // Matches firestore schema null incarcerationStaff.distrct
      { name: "district", type: "string", optional: true },
    ],
  },
  {
    name: "locations",
    enable_nested_fields: true,
    fields: [
      // A district's identity IS its `locationId` on `idType: "districtId"`
      // docs, so the caseload key's district predicate matches this field here
      // rather than a separate `district` attribute. Locations carry no email
      // and no supervisor data, so no other scope clause reaches them — see
      // CASELOAD_COLLECTION_FIELDS in ../scope/compileToTypesense.
      { name: "locationId", type: "string" },
      { name: "idType", type: "string", facet: true },
      { name: "stateCode", type: "string", facet: true },
      { name: "name", type: "string", sort: true, infix: true },
      // Districts and facilities share this collection, so the caseload key
      // needs this discriminator to apply supervision rules to one and
      // incarceration rules to the other.
      systemField,
    ],
  },
  {
    name: "opportunities",
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "opportunityType", type: "string", facet: true },
      { name: "externalId", type: "string" },
      // Distinguishes repeated eligibility spans. Firestore keys these as
      // `<stateCode>_<externalId>_<opportunityId>` when set — see
      // WorkflowsStore/CLAUDE.md "Repeated-eligibility-span footgun".
      { name: "opportunityId", type: "string", optional: true },
      { name: "isEligible", type: "bool", facet: true },
      { name: "isAlmostEligible", type: "bool", facet: true },
      // Hashed id, to keep PII out of Segment events.
      { name: "opportunityPseudonymizedId", type: "string", optional: true },
      { name: "eligibleDate", type: "string", optional: true },
      { name: "tabName", type: "string", facet: true, optional: true },
      { name: "tabDescription", type: "string", facet: true, optional: true },
      { name: "hasGrantedDate", type: "bool", facet: true, optional: true },
      // `eligibleDate` as an int64, because a range facet cannot use a string.
      // NOT the date the `eligibilityDate` overrides resolve to.
      {
        name: "eligibleDateTimestamp",
        type: "int64",
        facet: true,
        optional: true,
      },
      // Only some types populate this, and it is NOT a general almost-eligible date.
      { name: "almostEligibleDate", type: "string", optional: true },
      // Firestore source-collection name (e.g. `US_TN-compliantReportingReferrals`).
      // Stamped by backfill-fn per source; used only as the prune's `filter_by`
      // discriminator to isolate a single source's partition — not consumed by
      // the frontend.
      { name: "sourceCollection", type: "string", facet: true },

      // Person references. Both carry the person document's own id, so
      // backfill-fn needs no lookup. Exactly one always dangles, and join
      // filters exclude a dangling reference, so this fails closed.
      {
        name: "clientDocId",
        type: "string",
        reference: "clients.id",
        optional: true,
        // Lets an opportunity index before its person document exists. ALSO
        // REQUIRED by `cascade_delete: false` below.
        async_reference: true,
        // MUST be false, and Typesense DEFAULTS IT TO TRUE. Left alone, the
        // `clients` prune deletes opportunity documents across a partition
        // boundary.
        cascade_delete: false,
      },
      {
        name: "residentDocId",
        type: "string",
        reference: "residents.id",
        optional: true,
        async_reference: true,
        cascade_delete: false,
      },

      // Authorization scope, read ONLY by the minted scoped key. Denormalized
      // rather than joined: put any join into a top-level OR and Typesense
      // erases the key's condition, leaving the other branch unrestricted. The
      // key ships to the browser, so this must hold against a hostile query.
      //
      // OPTIONAL because the merge may find no person, and a REQUIRED field
      // would reject that document outright.
      { name: "officerId", type: "string", facet: true, optional: true },
      // A client's `district` or a resident's `facilityId`, COARSEST only.
      // `system` below disambiguates: the two could collide as strings.
      { name: "locationId", type: "string", facet: true, optional: true },
      systemField,
    ],
  },
  {
    // Officer-written state, mirroring
    // `clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}`.
    //
    // Its own collection: very few opportunities carry a real officer action,
    // so the homepage fetches those and subtracts for the rest.
    //
    // MUST be declared after `opportunities` — provisioning follows this array's
    // order, and a reference to a missing collection is rejected.
    name: "opportunityUpdates",
    enable_nested_fields: true,
    fields: [
      {
        // Equal to this document's own id, by construction.
        name: "opportunityDocId",
        type: "string",
        reference: "opportunities.id",
        // Required by `cascade_delete: false`, and lets an update index before
        // the opportunity backfill has run.
        async_reference: true,
        // An opportunity leaving the ETL must NOT delete the officer's denial:
        // the record may become eligible again. Orphans are swept by our prune.
        cascade_delete: false,
      },
      { name: "stateCode", type: "string", facet: true },

      // Derived by the shared function both writers import. NOT a tab.
      { name: "updateStatus", type: "string", facet: true },
      // The homepage's fetch predicate, and deliberately not
      // `updateStatus:!=NONE` — a snooze is an action that produces no tab.
      { name: "hasOfficerAction", type: "bool", facet: true },

      // Epoch SECONDS, both. `lastViewedTimestamp` is ABSENT when never viewed:
      // the stale-alert partition queries for documents lacking it.
      {
        name: "lastViewedTimestamp",
        type: "int64",
        facet: true,
        optional: true,
        sort: true,
      },
      {
        name: "submittedDateTimestamp",
        type: "int64",
        facet: true,
        optional: true,
      },

      // Projected, never filtered on. `index: false` also keeps the officer
      // email in each `by` out of the index.
      { name: "denial", type: "object", index: false, optional: true },
      { name: "manualSnooze", type: "object", index: false, optional: true },
      { name: "autoSnooze", type: "object", index: false, optional: true },
      { name: "omsSnooze", type: "object", index: false, optional: true },
      { name: "submitted", type: "object", index: false, optional: true },
      { name: "lastViewed", type: "object", index: false, optional: true },
      { name: "completed", type: "object", index: false, optional: true },
      {
        name: "adjudicationStatus",
        type: "object",
        index: false,
        optional: true,
      },
      // Its LAST element drives `isInSupervisorReview` / `isGrantApproved`,
      // which is why `updateStatus` is precomputed.
      { name: "actionHistory", type: "object[]", index: false, optional: true },
    ],
  },
];

export const collectionNames = schemas.map((s) => s.name);

/**
 * Collections a BROWSER may hold a key for, and the exact list the parent
 * search key is scoped to in every environment.
 *
 * A scoped key reaches anything its PARENT covers — the embedded `filter_by`
 * is appended to whichever collection endpoint the holder queries — so this
 * list, not the filter, is what isolates a collection.
 *
 * An ALLOWLIST rather than a subtraction from `collectionNames`: a new
 * collection is unreachable by the browser until someone adds it here and
 * reasons about its scope fields.
 *
 * One is deliberately absent:
 *   - `opportunityUpdates` — reached only by a join FROM `opportunities`,
 *     which Typesense evaluates server-side under the parent collection's
 *     permission.
 */
export const BROWSER_SEARCHABLE_COLLECTIONS = [
  "clients",
  "residents",
  "locations",
  "supervisionStaff",
  "incarcerationStaff",
  "opportunities",
] as const;
