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

import {
  RawSupervisionOfficer,
  supervisionOfficerSchema,
} from "../SupervisionOfficer";
import { CASELOAD_TYPE_IDS } from "./constants";
import { rawSupervisionOfficerMetricOutlierFixtures } from "./SupervisionOfficerMetricOutlierFixture";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

export const rawSupervisionOfficerFixture: RawSupervisionOfficer[] = [
  {
    externalId: "so1",
    pseudonymizedId: "hashed-so1",
    fullName: {
      givenNames: "Duke",
      surname: "Ellington",
    },
    district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.SEX_OFFENSE,
    supervisorExternalId: supervisionOfficerSupervisorsFixture[0].externalId,
    outlierMetrics: [
      rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
        .SEX_OFFENSE[0],
      rawSupervisionOfficerMetricOutlierFixtures.incarceration_starts
        .SEX_OFFENSE[0],
    ],
  },
  {
    externalId: "so2",
    pseudonymizedId: "hashed-so2",
    fullName: {
      givenNames: "Chet",
      surname: "Baker",
    },
    district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalId: supervisionOfficerSupervisorsFixture[0].externalId,
    outlierMetrics: [],
  },
  {
    externalId: "so3",
    pseudonymizedId: "hashed-so3",
    fullName: {
      givenNames: "Louis",
      surname: "Armstrong",
    },
    district: supervisionOfficerSupervisorsFixture[0].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalId: supervisionOfficerSupervisorsFixture[0].externalId,
    outlierMetrics: [
      rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
        .GENERAL_OR_OTHER[1],
    ],
  },
  {
    externalId: "so4",
    pseudonymizedId: "hashed-so4",
    fullName: {
      givenNames: "William James",
      middleNames: '"Count"',
      surname: "Basie",
    },
    district: supervisionOfficerSupervisorsFixture[1].supervisionDistrict,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalId: supervisionOfficerSupervisorsFixture[1].externalId,
    outlierMetrics: [
      rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
        .GENERAL_OR_OTHER[0],
    ],
  },
  {
    externalId: "so5",
    pseudonymizedId: "hashed-so5",
    fullName: {
      givenNames: "Mary Lou",
      surname: "Williams",
    },
    district: null,
    caseloadType: CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
    supervisorExternalId: supervisionOfficerSupervisorsFixture[2].externalId,
    outlierMetrics: [],
  },
];

export const supervisionOfficerFixture = rawSupervisionOfficerFixture.map(
  (officer) => supervisionOfficerSchema.parse(officer),
);
