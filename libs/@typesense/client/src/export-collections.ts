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
// hook.
//   1. `system` from `idType`: `districtId` → SUPERVISION; every facility
//      variant → INCARCERATION. Unmapped idTypes leave `system` unset (safe
//      default).
//   2. `district` copied from `locationId` on districtId-type docs only —
//      for those docs the district name already lives in `locationId`, and
//      the caseload-scoped key's byDistricts predicate references `district`.
//      Facility-type docs leave `district` unset; the `system:=SUPERVISION`
//      gate keeps them out of the byDistricts arm anyway.
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
  {
    copyFrom: "locationId",
    into: "district",
    when: { field: "idType", equals: "districtId" },
  },
];

// Not a direct 1:1 Firestore↔Typesense pair — emitted as a template below.
const BACKFILL_FN_EXCLUDED = new Set(["opportunities"]);

// User-written updates merged onto the record they update. See
// CollectionConfig.mergeSources in backfill-fn for the mechanism.
const PERSON_MERGE_SOURCES = [
  {
    sourceCollection: "clientUpdatesV2",
    fields: ["preferredName"],
  },
];

const OPPORTUNITY_MERGE_SOURCES = [
  {
    sourceCollection: "clientOpportunityUpdates",
    collectionGroup: true,
    fields: [
      "denial",
      "manualSnooze",
      "autoSnooze",
      "submitted",
      "actionHistory",
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
  ],
  // Changing this rewrites every opportunity id: the next backfill writes the
  // new ones and the prune sweeps the old.
  docIdOverrides: {
    type: "fields",
    fields: ["stateCode", "externalId", "opportunityType", "opportunityId"],
    lowercaseFields: ["stateCode"],
  },
  mergeSources: OPPORTUNITY_MERGE_SOURCES,
};

const collections = [...baseCollections, opportunityTemplate];

process.stdout.write(JSON.stringify(collections));
