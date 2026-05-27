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

// Phase 1 collection schemas. Each declares only the fields needed for
// facet/filter/scope enforcement. Search-target fields (givenNames, surname,
// name, etc.) are added in later stacked PRs as the search bar lands. Any
// fields not declared here are dropped by Typesense on import — by design, so
// we never store more than we need to index.
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
        optional: true,
      },
      { name: "pseudonymizedId", type: "string", optional: true },
      { name: "personExternalId", type: "string" },
      { name: "personName", type: "object" },
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
        optional: true,
      },
      { name: "pseudonymizedId", type: "string", optional: true },
      { name: "personExternalId", type: "string" },
      { name: "personName", type: "object" },
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
      { name: "email", type: "string", optional: true },
      { name: "givenNames", type: "string" },
      { name: "surname", type: "string" },
    ],
  },
  {
    name: "incarcerationStaff",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "email", type: "string", optional: true },
      { name: "givenNames", type: "string" },
      { name: "surname", type: "string" },
    ],
  },
  {
    name: "locations",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "id", type: "string" },
      { name: "name", type: "string" },
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
