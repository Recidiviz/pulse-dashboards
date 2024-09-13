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

import { faker } from "@faker-js/faker";

import {
  FIXTURE_SEED_DEFAULT,
  hasDifferentValuesAtKeys,
} from "~fixture-generator";

import { rawSupervisionOfficerSupervisorFactory } from "../../SupervisionOfficerSupervisor/factory/factory";
import { supervisionOfficerSupervisorSchema } from "../../SupervisionOfficerSupervisor/schema";
import {
  excludedSupervisionOfficerSchema,
  supervisionOfficerSchema,
} from "../schema";
import {
  rawExcludedSupervisionOfficerFactory,
  rawSupervisionOfficerFactory,
} from "./factory";

faker.seed(FIXTURE_SEED_DEFAULT);

const getTestSupervisors = (count = 3) =>
  rawSupervisionOfficerSupervisorFactory()
    .buildList(count)
    .map((s) => supervisionOfficerSupervisorSchema.parse(s));

describe("function: SupervisionOfficerRawFactory", () => {
  it("should generate a valid supervision officer", () => {
    const supervisionOfficer =
      rawSupervisionOfficerFactory(getTestSupervisors()).build();
    expect(() =>
      supervisionOfficerSchema.parse(supervisionOfficer),
    ).not.toThrow();
  });

  it("should generate realistic supervision officers", () => {
    const supervisionOfficers =
      rawSupervisionOfficerFactory(getTestSupervisors()).buildList(3);
    expect(
      supervisionOfficers.map((s) => supervisionOfficerSchema.parse(s)),
    ).toMatchSnapshot();
  });

  it("should have variation in values", () => {
    const supervisionOfficers =
      rawSupervisionOfficerFactory(getTestSupervisors()).buildList(30);
    expect(
      hasDifferentValuesAtKeys(
        supervisionOfficers.map((s) => supervisionOfficerSchema.parse(s)),
      ),
    ).toBeTrue();
  });
});

describe("function: ExcludedSupervisionOfficerRawFactory", () => {
  it("should generate a valid excluded supervision officer", () => {
    const supervisionOfficer =
      rawExcludedSupervisionOfficerFactory(getTestSupervisors()).build();
    expect(() =>
      excludedSupervisionOfficerSchema.parse(supervisionOfficer),
    ).not.toThrow();
  });

  it("should generate realistic excluded supervision officers", () => {
    const supervisionOfficers =
      rawExcludedSupervisionOfficerFactory(getTestSupervisors()).buildList(3);
    expect(
      supervisionOfficers.map((s) => excludedSupervisionOfficerSchema.parse(s)),
    ).toMatchSnapshot();
  });

  it("should have variations in values", () => {
    const supervisionOfficers =
      rawExcludedSupervisionOfficerFactory(getTestSupervisors()).buildList(30);
    expect(
      hasDifferentValuesAtKeys(
        supervisionOfficers.map((s) =>
          excludedSupervisionOfficerSchema.parse(s),
        ),
      ),
    ).toBeTrue();
  });
});
