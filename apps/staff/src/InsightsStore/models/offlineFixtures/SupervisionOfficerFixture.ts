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

import { usIdSupervisionStaffFixtures } from "~datatypes";

import {
  RawSupervisionOfficer,
  supervisionOfficerSchema,
} from "../SupervisionOfficer";
import { CASELOAD_TYPE_IDS, FAVORABLE_METRIC_IDS } from "./constants";
import { rawSupervisionOfficerMetricOutlierFixtures } from "./SupervisionOfficerMetricOutlierFixture";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

export const rawSupervisionOfficerFixture: RawSupervisionOfficer[] = [
  {
    externalId: usIdSupervisionStaffFixtures[0].id,
    pseudonymizedId: "hashed-so1",
    fullName: {
      givenNames: usIdSupervisionStaffFixtures[0].givenNames,
      surname: usIdSupervisionStaffFixtures[0].surname,
    },
    district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.SEX_OFFENSE,
    supervisorExternalIds: [
      supervisionOfficerSupervisorsFixture[0].externalId,
      supervisionOfficerSupervisorsFixture[1].externalId,
    ],
    outlierMetrics: [
      rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
        .SEX_OFFENSE[0],
      rawSupervisionOfficerMetricOutlierFixtures.incarceration_starts
        .SEX_OFFENSE[0],
      rawSupervisionOfficerMetricOutlierFixtures.treatment_starts
        .SEX_OFFENSE[0],
    ],
    topXPctMetrics: [],
    avgDailyPopulation: 54.321,
  },
  {
    externalId: "so2",
    pseudonymizedId: "hashed-so2",
    fullName: {
      givenNames: "Jack",
      surname: "Hernandez",
    },
    district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[0].externalId],
    outlierMetrics: [],
    topXPctMetrics: [
      { metricId: FAVORABLE_METRIC_IDS.enum.treatment_starts, topXPct: 10 },
    ],
    avgDailyPopulation: 12.345,
  },
  {
    externalId: "so3",
    pseudonymizedId: "hashed-so3",
    fullName: {
      givenNames: "Jason",
      surname: "Nelson",
    },
    district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[0].externalId],
    outlierMetrics: [
      rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
        .GENERAL_OR_OTHER[1],
      rawSupervisionOfficerMetricOutlierFixtures.treatment_starts
        .GENERAL_OR_OTHER[0],
    ],
    topXPctMetrics: [],
    avgDailyPopulation: 32.1,
  },
  {
    externalId: "so4",
    pseudonymizedId: "hashed-so4",
    fullName: {
      givenNames: "Carl",
      middleNames: "Mark",
      surname: "Campbell",
    },
    district: supervisionOfficerSupervisorsFixture[1].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[1].externalId],
    outlierMetrics: [
      rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
        .GENERAL_OR_OTHER[0],
      rawSupervisionOfficerMetricOutlierFixtures.treatment_starts
        .GENERAL_OR_OTHER[0],
    ],
    topXPctMetrics: [],
    avgDailyPopulation: 43.21,
  },
  {
    externalId: "so5",
    pseudonymizedId: "hashed-so5",
    fullName: {
      givenNames: "Casey",
      surname: "Ramirez",
    },
    district: null,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalIds: [supervisionOfficerSupervisorsFixture[2].externalId],
    outlierMetrics: [],
    topXPctMetrics: [],
    avgDailyPopulation: 5.43,
  },
];

export const supervisionOfficerFixture = rawSupervisionOfficerFixture.map(
  (officer) => supervisionOfficerSchema.parse(officer),
);
