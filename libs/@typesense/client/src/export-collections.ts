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

// Emits the canonical collection→fields mapping as a single JSON array on
// stdout. Consumed by atmos stack files via the `!exec` YAML tag so the
// schema definitions drive the typesense-backfill Cloud Function's
// COLLECTIONS_JSON env var (see libs/atmos/stacks/typesense/*.yaml).
//
// Output is pure JSON with no decoration — any noise breaks the YAML parse on
// the atmos side. Stderr is unused.
//
// Alongside the base entries, emits a template config for the unified
// `opportunities` target: it carries no source, and the caller (typically the
// per-source opportunity ETL trigger) POSTs `{ sourceCollection: "US_XX-..." }`
// for backfill-fn to instantiate it at runtime.

import { OPPORTUNITY_UPDATE_FIELDS } from "./opportunityUpdates";
import { schemas } from "./schemas";

// Static `system` discriminator for each collection whose docs are inherently
// single-system. backfill-fn stamps this onto every emitted doc via
// `constantFields` so the cross-system caseload-scoped key's `system:=X`
// filter_by works. `locations` is absent here — its docs are mixed (facilities
// vs districts) and get `system` derived per-doc from `idType`; see
// LOCATIONS_DERIVED_FIELDS below.
const SYSTEM_BY_COLLECTION: Record<string, "SUPERVISION" | "INCARCERATION"> = {
  clients: "SUPERVISION",
  supervisionStaff: "SUPERVISION",
  residents: "INCARCERATION",
  incarcerationStaff: "INCARCERATION",
};

// Per-doc derivations for `locations`, applied by backfill-fn's derivedFields
// hook. `system` is derived from `idType`: `districtId` → SUPERVISION; every
// facility variant → INCARCERATION. Unmapped idTypes leave `system` unset (safe
// default).
//
// There is deliberately no `locationId` → `district` copy. The caseload key's
// district predicate matches `locationId` directly on this collection, so the
// duplicate attribute would carry no information the doc does not already have.
const LOCATIONS_DERIVED_FIELDS = [
  {
    from: "idType",
    into: "system",
    valueMapping: {
      districtId: "SUPERVISION",
      facilityId: "INCARCERATION",
      facilityUnitId: "INCARCERATION",
      crcFacilityId: "INCARCERATION",
    },
  },
];

// Not 1:1 Firestore↔Typesense pairs, so each gets a hand-written config below:
// `opportunities` is a template with no source, and `opportunityUpdates` reads
// a subcollection group and keys itself from the document path.
const BACKFILL_FN_EXCLUDED = new Set(["opportunities", "opportunityUpdates"]);

// User-written updates merged onto the record they update. See
// CollectionConfig.mergeSources in backfill-fn for the mechanism.
const PERSON_MERGE_SOURCES = [
  {
    sourceCollection: "clientUpdatesV2",
    hasStateCode: true,
    fields: ["preferredName"],
  },
];

// The path-derived id is also the opportunity's own id, so `opportunityDocId`
// resolves without a lookup.
const opportunityUpdatesConfig = {
  name: "opportunityUpdates",
  sourceCollection: "clientOpportunityUpdates",
  collectionGroup: true,
  // `stateCode` is on the update document itself, which is what lets a
  // state-scoped run filter this group server-side.
  fields: [...OPPORTUNITY_UPDATE_FIELDS, "stateCode"],
  docIdOverrides: { type: "path" as const },
  // Named rather than inlined because this config is JSON.
  transform: "opportunityUpdate" as const,
};

// The person document's own id
const PERSON_LOOKUP_KEY = {
  type: "fields" as const,
  fields: ["stateCode", "externalId"],
  lowercaseFields: ["stateCode"],
};

// How an opportunity names the person it belongs to. Exactly one of the two
// resolves and the other dangles, which join filters exclude.
const OPPORTUNITY_REFERENCE_FIELDS = [
  {
    into: "clientDocId",
    fields: PERSON_LOOKUP_KEY.fields,
    lowercaseFields: PERSON_LOOKUP_KEY.lowercaseFields,
  },
  {
    into: "residentDocId",
    fields: PERSON_LOOKUP_KEY.fields,
    lowercaseFields: PERSON_LOOKUP_KEY.lowercaseFields,
  },
];

// Person SCOPE merged onto the opportunities it governs — the three fields the
// minted scoped key reads, and nothing else.
const OPPORTUNITY_SCOPE_MERGE_SOURCES = [
  {
    sourceCollection: "clients",
    lookupKey: PERSON_LOOKUP_KEY,
    hasStateCode: true,
    fields: [
      "officerId",
      { from: "district", into: "locationId" },
      { value: "SUPERVISION", into: "system" },
    ],
  },
  {
    sourceCollection: "residents",
    lookupKey: PERSON_LOOKUP_KEY,
    hasStateCode: true,
    // Nothing filters on the resident side yet. Populated now anyway: the
    // alternative is a collection recreate plus a full re-backfill the day a
    // state turns facility scoping on.
    fields: [
      "officerId",
      { from: "facilityId", into: "locationId" },
      { value: "INCARCERATION", into: "system" },
    ],
  },
];

const PERSON_COLLECTIONS = new Set(["clients", "residents"]);

const baseCollections = schemas
  .filter((s) => !BACKFILL_FN_EXCLUDED.has(s.name))
  .map((s) => {
    const system = SYSTEM_BY_COLLECTION[s.name];
    return {
      name: s.name,
      fields: (s.fields ?? []).map((f) => f.name),
      ...(system && { constantFields: { system } }),
      ...(s.name === "locations" && {
        derivedFields: LOCATIONS_DERIVED_FIELDS,
      }),
      // clients/residents doc ids are already `<lowercase state>_<externalId>`,
      // the same key clientUpdatesV2 is filed under, so the merge needs no id
      // translation on either side.
      ...(PERSON_COLLECTIONS.has(s.name) && {
        mergeSources: PERSON_MERGE_SOURCES,
      }),
    };
  });

const opportunityTemplate = {
  name: "opportunities",
  fields: [
    "stateCode",
    "opportunityType",
    "externalId",
    "opportunityId",
    "isEligible",
    "isAlmostEligible",
    "opportunityPseudonymizedId",
    "eligibleDate",
    "almostEligibleDate",
  ],
  // Changing this rewrites every opportunity id: the next backfill writes the
  // new ones and the prune sweeps the old.
  docIdOverrides: {
    type: "fields",
    fields: ["stateCode", "externalId", "opportunityType", "opportunityId"],
    lowercaseFields: ["stateCode"],
  },
  // Flattens `eligibleDate` to an epoch and lifts `metadata.tabName` out.
  transform: "opportunityFields" as const,
  referenceFields: OPPORTUNITY_REFERENCE_FIELDS,
  mergeSources: OPPORTUNITY_SCOPE_MERGE_SOURCES,
};

const collections = [
  ...baseCollections,
  opportunityTemplate,
  opportunityUpdatesConfig,
];

process.stdout.write(JSON.stringify(collections));
