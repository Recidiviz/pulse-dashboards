// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { ValuesType } from "utility-types";

import { FixtureMapping, inputFixtureArray, ParsedRecord } from "~datatypes";

import { FixtureOpportunityType } from "./opportunities";

/**
 * Includes documents to import and a function for generating document IDs for them
 */
export type FirestoreFixture<T> = {
  data: T[];
  idFunc: (arg0: T) => string;
};

type StringProperties<Obj extends object> = keyof {
  [P in keyof Obj as Obj[P] extends string ? P : never]: any;
};

/**
 * Given a `key` that appears in all members of `data`, returns a FirestoreFixture
 * with an `idFunc` for that key.
 */
export function fixtureWithIdKey<T extends object>(
  key: StringProperties<T>,
  data: T[],
): FirestoreFixture<T> {
  return {
    data,
    // this narrowing should be enforced by the parameter types, but ts can't figure it out
    idFunc: (r) => r[key] as string,
  };
}

export const externalIdFunc: FirestoreFixture<{
  externalId: string;
}>["idFunc"] = (doc) => doc.externalId;

/**
 * Extracts all raw data fixtures from a FixtureMapping
 */
function allInputFixtures<FM extends FixtureMapping>(
  mapping: FM,
): Array<ValuesType<FM>["input"]> {
  return inputFixtureArray(Object.values(mapping));
}

/**
 * * Given a `key` that appears in all `input` members of `mapping`,
 * returns a FirestoreFixture with an `idFunc` for that key.
 */
export function fixtureFromParsedRecords<FixtureType extends ParsedRecord>(
  key: StringProperties<FixtureType["input"]>,
  mapping: FixtureMapping<FixtureType> | FixtureType[],
): FirestoreFixture<FixtureType> {
  if (Array.isArray(mapping))
    return fixtureWithIdKey(key, inputFixtureArray(mapping));
  return fixtureWithIdKey(key, allInputFixtures(mapping));
}

export type PersonFixture<RecordType> = Omit<
  RecordType,
  "personType" | "recordId" | "allEligibleOpportunities"
> & { allEligibleOpportunities: FixtureOpportunityType[] };
