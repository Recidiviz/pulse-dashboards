// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { FixtureData } from "../workflowsFixtures";

export const externalIdFunc: FixtureData<{ externalId: string }>["idFunc"] = (
  doc,
) => doc.externalId;

export function fixtureWithIdKey<T extends object>(
  key: keyof {
    [P in keyof T as T[P] extends string ? P : never]: any;
  },
  data: T[],
): FixtureData<T> {
  return {
    data,
    // this narrowing should be enforced by the parameter types, but ts can't figure it out
    idFunc: (r) => r[key] as string,
  };
}
