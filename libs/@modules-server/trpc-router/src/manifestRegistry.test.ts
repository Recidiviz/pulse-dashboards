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

import { baseProcedure, router } from "~@modules-server/trpc-base";

import { registerModuleRouters } from "./manifestRegistry";

const BASE_PROCEDURES = {
  hi: baseProcedure.query(async () => "hello"),
  bye: baseProcedure.query(async () => "goodbye"),
};

const ROUTERS = {
  UserSettings: router({
    somePig: baseProcedure.query(async () => "Bah Ram Ewe"),
  }),
  Classification: router({
    shouldINap: baseProcedure.query(async () => "yes"),
  }),
};

describe("registerManifests", () => {
  it("adds all supplied manifests to the base set of procedures under the name of the module", () => {
    const res = registerModuleRouters(BASE_PROCEDURES, ROUTERS);

    expect(res["hi"]).toBeDefined();
    expect(res["bye"]).toBeDefined();
    expect(res["UserSettings"]).toBeDefined();
    expect(res["Classification"]).toBeDefined();
  });
  it("does not mutate the supplied base procedures", () => {
    registerModuleRouters(BASE_PROCEDURES, ROUTERS);

    expect(BASE_PROCEDURES["hi"]).toBeDefined();
    expect(BASE_PROCEDURES["bye"]).toBeDefined();
    // @ts-expect-error We're ensuring the key does not exist
    expect(BASE_PROCEDURES["UserSettings"]).toBeUndefined();
    // @ts-expect-error We're ensuring the key does not exist
    expect(BASE_PROCEDURES["Classification"]).toBeUndefined();
  });
  it("throws if a module name already exists on the base procedures", () => {
    const repeatedRouters = {
      UserSettings: router({
        somePig: baseProcedure.query(async () => "Bah Ram Ewe"),
      }),
      bye: router({
        shouldINap: baseProcedure.query(async () => "yes"),
      }),
    };

    expect(() =>
      registerModuleRouters(BASE_PROCEDURES, repeatedRouters),
    ).toThrowError();
  });
});
