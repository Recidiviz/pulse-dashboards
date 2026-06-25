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

const staffCommonFields = [
  { name: "stateCode", type: "string", facet: true },
  { name: "staffExternalId", type: "string" },
  { name: "pseudonymizedId", type: "string" },
  { name: "email", type: "string", optional: true, infix: true },
  { name: "givenNames", type: "string", sort: true, infix: true },
  { name: "surname", type: "string", sort: true, infix: true },
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
      { name: "personExternalId", type: "string" },
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
    fields: staffCommonFields,
  },
  {
    name: "locations",
    enable_nested_fields: true,
    fields: [
      { name: "locationId", type: "string" },
      { name: "idType", type: "string", facet: true },
      { name: "stateCode", type: "string", facet: true },
      { name: "name", type: "string", sort: true, infix: true },
    ],
  },
  {
    name: "clientUpdatesV2",
    enable_nested_fields: true,
    fields: [
      { name: "stateCode", type: "string", facet: true },
      { name: "preferredName", type: "string", optional: true },
    ],
  },
];

export const collectionNames = schemas.map((s) => s.name);
