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

import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

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
      { name: "personExternalId", type: "string" },
      { name: "officerId", type: "string", facet: true },
      { name: "personName.givenNames", type: "string", optional: true },
      { name: "personName.surname", type: "string", optional: true },
      { name: "district", type: "string", optional: true, facet: true },
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
      { name: "personExternalId", type: "string" },
      { name: "officerId", type: "string", optional: true, facet: true },
      { name: "personName.givenNames", type: "string", optional: true },
      { name: "personName.surname", type: "string", optional: true },
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
      },
    ],
  },
  {
    name: "supervisionStaff",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "district", type: "string", facet: true, optional: true },
      {
        name: "supervisorExternalId",
        type: "string",
        facet: true,
        optional: true,
      },
      { name: "pseudonymizedId", type: "string" },
      { name: "email", type: "string", optional: true },
      { name: "givenNames", type: "string", sort: true },
      { name: "surname", type: "string", sort: true },
    ],
  },
  {
    name: "incarcerationStaff",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "pseudonymizedId", type: "string" },
      { name: "email", type: "string", optional: true },
      { name: "givenNames", type: "string", sort: true },
      { name: "surname", type: "string", sort: true },
    ],
  },
  {
    name: "locations",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "name", type: "string", sort: true },
    ],
  },
];

// Collections whose Typesense `id` should come from the source record's own
// `id` field (e.g. staff `OFFICER4`, location `FAC1`) rather than the
// composite Firestore document id (e.g. `us_id_OFFICER4`). For these, the
// non-composite id lets queries match cross-collection references like
// `client.officerId → staff.id` directly. Person collections keep the
// composite Firestore doc id as their Typesense id and expose
// `personExternalId` as a separately searchable field instead.
export const COLLECTIONS_WITH_SOURCE_ID = new Set<string>([
  "supervisionStaff",
  "incarcerationStaff",
  "locations",
]);

export const collectionNames = schemas.map((s) => s.name);
