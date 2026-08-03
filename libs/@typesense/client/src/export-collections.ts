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
// stdout. Consumed by atmos stack files via the `!exec` YAML tag so the same
// schema definitions drive both:
//   - the Typesense collection schemas (via provision.ts and inspect.ts)
//   - the Firebase extension's FIRESTORE_COLLECTION_FIELDS_LIST and
//     FIRESTORE_COLLECTION_PATHS params (via apps/firestore-typesense-search)
//   - the typesense-backfill Cloud Function's COLLECTIONS_JSON env var
//
// Output is pure JSON with no decoration — any noise breaks the YAML parse on
// the atmos side. Stderr is unused.

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

const collections = schemas.map((s) => {
  const system = SYSTEM_BY_COLLECTION[s.name];
  return {
    name: s.name,
    fields: (s.fields ?? []).map((f) => f.name),
    ...(system && { constantFields: { system } }),
    ...(s.name === "locations" && { derivedFields: LOCATIONS_DERIVED_FIELDS }),
  };
});

process.stdout.write(JSON.stringify(collections));
