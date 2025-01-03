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

import { usIdSupervisionStaffFixtures } from "../../Workflows/fixture";
import { supervisionOfficerSupervisorsFixture } from "../SupervisionOfficerSupervisor/fixture";
import {
  excludedSupervisionOfficerSchema,
  RawExcludedSupervisionOfficer,
  RawSupervisionOfficer,
  supervisionOfficerSchema,
} from "./schema";

export const rawSupervisionOfficerFixture = [
  {
    externalId: usIdSupervisionStaffFixtures[0].id,
    pseudonymizedId: "hashed-so1",
    fullName: {
      givenNames: usIdSupervisionStaffFixtures[0].givenNames,
      surname: usIdSupervisionStaffFixtures[0].surname,
    },
    supervisorExternalIds: [
      supervisionOfficerSupervisorsFixture[0].externalId,
      supervisionOfficerSupervisorsFixture[1].externalId,
    ],
    avgDailyPopulation: 54.321,
    zeroGrantOpportunities: ["LSU", "pastFTRD"],
    includeInOutcomes: true,
  },
  {
    externalId: "so2",
    pseudonymizedId: "hashed-so2",
    fullName: {
      givenNames: "Jack",
      surname: "Hernandez",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[0].externalId],
    avgDailyPopulation: 12.345,
    includeInOutcomes: true,
  },
  {
    externalId: "so3",
    pseudonymizedId: "hashed-so3",
    fullName: {
      givenNames: "Jason",
      surname: "Nelson",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[0].externalId],
    avgDailyPopulation: 32.1,
    includeInOutcomes: true,
  },
  {
    externalId: "so4",
    pseudonymizedId: "hashed-so4",
    fullName: {
      givenNames: "Carl",
      middleNames: "Mark",
      surname: "Campbell",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[1].externalId],
    avgDailyPopulation: 43.21,
    includeInOutcomes: true,
  },
  {
    externalId: "so5",
    pseudonymizedId: "hashed-so5",
    fullName: {
      givenNames: "Casey",
      surname: "Ramirez",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[2].externalId],
    avgDailyPopulation: 5.43,
    includeInOutcomes: true,
  },
  {
    externalId: "so8",
    pseudonymizedId: "hashed-so8",
    fullName: {
      givenNames: "Elizabeth",
      surname: "Ramirez",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[2].externalId],
    avgDailyPopulation: 43.21,
    includeInOutcomes: true,
  },
  {
    externalId: "so9",
    pseudonymizedId: "hashed-so9",
    fullName: {
      givenNames: "Harriet",
      surname: "Boyd",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[0].externalId],
    avgDailyPopulation: 43.21,
    includeInOutcomes: true,
  },
  {
    externalId: "so10",
    pseudonymizedId: "hashed-so10",
    fullName: {
      givenNames: "Stephen",
      surname: "Mann",
    },
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[0].externalId],
    avgDailyPopulation: 43.21,
    includeInOutcomes: true,
  },
] satisfies RawSupervisionOfficer[];

export const rawExcludedSupervisionOfficerFixture: RawExcludedSupervisionOfficer[] =
  [
    {
      externalId: "so6",
      pseudonymizedId: "hashed-so6",
      fullName: {
        givenNames: "John",
        surname: "Harris",
      },
      supervisorExternalIds: [
        supervisionOfficerSupervisorsFixture[0].externalId,
      ],
    },
    {
      externalId: "so7",
      pseudonymizedId: "hashed-so7",
      fullName: {
        givenNames: "Larry",
        surname: "Hernandez",
      },
      supervisorExternalIds: [
        supervisionOfficerSupervisorsFixture[0].externalId,
      ],
    },
  ];

export const excludedSupervisionOfficerFixture =
  rawExcludedSupervisionOfficerFixture.map((officer) =>
    excludedSupervisionOfficerSchema.parse(officer),
  );

export const supervisionOfficerFixture = rawSupervisionOfficerFixture.map(
  (officer) => supervisionOfficerSchema.parse(officer),
);
