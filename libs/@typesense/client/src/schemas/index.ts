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

// Discriminates supervision vs incarceration on collections queried by a
// cross-system caseload-scoped key. Stamped by backfill-fn's
// constantFields for staff/person collections (each is inherently single-
// system per collection); locations get their `system` derived from `idType`
// upstream
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
      { name: "officerId", type: "string", facet: true },
      {
        name: "personName.givenNames",
        type: "string",
        optional: true,
        infix: true,
      },
      {
        name: "personName.surname",
        type: "string",
        optional: true,
        infix: true,
      },
      { name: "preferredName", type: "string", optional: true, infix: true },
      { name: "district", type: "string", optional: true, facet: true },
      // User-set override merged from `clientUpdatesV2/{recordId}`. Read this
      // one, not the `clientUpdatesV2` collection, which is still written
      // during the frontend swap.
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
      { name: "officerId", type: "string", optional: true, facet: true },
      {
        name: "personName.givenNames",
        type: "string",
        optional: true,
        infix: true,
      },
      {
        name: "personName.surname",
        type: "string",
        optional: true,
        infix: true,
      },
      { name: "preferredName", type: "string", optional: true, infix: true },
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
      { name: "locationId", type: "string" },
      { name: "idType", type: "string", facet: true },
      { name: "stateCode", type: "string", facet: true },
      { name: "name", type: "string", sort: true, infix: true },
      // Declared here so the caseload-scoped key's byDistricts predicate
      // (`district:=[...]`) passes Typesense's upfront schema check. On
      // district-idType location docs, `district` is populated per-doc via
      // backfill-fn's derivedFields "copy" hook (copies `locationId` → `district`
      // when `idType === "districtId"`), since the district name already
      // lives in `locationId` for those docs. Facility-idType docs leave
      // `district` unset; the `system:=SUPERVISION` gate prevents them from
      // reaching the district clause anyway.
      { name: "district", type: "string", optional: true },
      systemField,
    ],
  },
  // Transitional. Both copies of `preferredName` stay in sync: the extension
  // and the base-collection backfill write here, the merge pass writes
  // `clients`/`residents`. Delete once nothing reads this collection.
  {
    name: "clientUpdatesV2",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "preferredName", type: "string", optional: true, infix: true },
    ],
  },
  {
    name: "opportunities",
    // Update fields below are objects, so nested fields must be enabled even
    // though nothing on the ETL side is nested.
    enable_nested_fields: true,
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
      // Firestore source-collection name (e.g. `US_TN-compliantReportingReferrals`).
      // Stamped by backfill-fn per source; used only as the prune's `filter_by`
      // discriminator to isolate a single source's partition — not consumed by
      // the frontend.
      { name: "sourceCollection", type: "string", facet: true },

      // Officer-written state merged from
      // `clientUpdatesV2/{recordId}/clientOpportunityUpdates/{docId}`. Written
      // by two paths: backfill-fn reconciles them alongside the ETL fields on
      // every run, sync-fn partial-updates them on write. Optional because an
      // opportunity nobody has acted on has none of them.
      { name: "denial", type: "object", index: false, optional: true },
      { name: "manualSnooze", type: "object", index: false, optional: true },
      { name: "autoSnooze", type: "object", index: false, optional: true },
      { name: "submitted", type: "object", index: false, optional: true },
      // Real Firestore field is `actionHistory: OfficerRequest[]`; drives
      // `latestAction` → `isInSupervisorReview`/`isGrantApproved`/etc.
      { name: "actionHistory", type: "object[]", index: false, optional: true },
    ],
  },
];

export const collectionNames = schemas.map((s) => s.name);
