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
import { ADVERSE_METRIC_IDS, CASELOAD_TYPE_IDS } from "./constants";
import { rawSupervisionOfficerMetricOutlierFixtures } from "./SupervisionOfficerMetricOutlierFixture";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

export const rawSupervisionOfficerFixture: RawSupervisionOfficer[] = [
  {
    externalId: "so1",
    fullName: {
      given_names: "Duke",
      surname: "Ellington",
    },
    district: supervisionOfficerSupervisorsFixture[0].district,
    supervisorId: supervisionOfficerSupervisorsFixture[0].externalId,
    caseloadTypes: [
      CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER,
      CASELOAD_TYPE_IDS.enum.SEX_OFFENSE,
    ],
    currentPeriodStatuses: {
      far: [
        rawSupervisionOfficerMetricOutlierFixtures
          .absconsions_bench_warrants[0],
        rawSupervisionOfficerMetricOutlierFixtures.incarceration_starts[0],
      ],
      near: [ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation],
      met: [],
    },
  },
  {
    externalId: "so2",
    fullName: {
      given_names: "Chet",
      surname: "Baker",
    },
    district: supervisionOfficerSupervisorsFixture[0].district,
    supervisorId: supervisionOfficerSupervisorsFixture[0].externalId,
    caseloadTypes: [CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER],
    currentPeriodStatuses: {
      far: [],
      near: [
        ADVERSE_METRIC_IDS.enum.incarceration_starts,
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      ],
      met: [ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants],
    },
  },
  {
    externalId: "so3",
    fullName: {
      given_names: "Louis",
      surname: "Armstrong",
    },
    district: supervisionOfficerSupervisorsFixture[0].district,
    supervisorId: supervisionOfficerSupervisorsFixture[0].externalId,
    caseloadTypes: [CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER],
    currentPeriodStatuses: {
      far: [
        rawSupervisionOfficerMetricOutlierFixtures
          .absconsions_bench_warrants[1],
      ],
      near: [ADVERSE_METRIC_IDS.enum.incarceration_starts],
      met: [ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation],
    },
  },
  {
    externalId: "so4",
    fullName: {
      given_names: "William James",
      middle_names: '"Count"',
      surname: "Basie",
    },
    district: supervisionOfficerSupervisorsFixture[1].district,
    supervisorId: supervisionOfficerSupervisorsFixture[1].externalId,
    caseloadTypes: [CASELOAD_TYPE_IDS.enum.GENERAL_OR_OTHER],
    currentPeriodStatuses: {
      far: [
        rawSupervisionOfficerMetricOutlierFixtures
          .absconsions_bench_warrants[2],
      ],
      near: [ADVERSE_METRIC_IDS.enum.incarceration_starts],
      met: [ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation],
    },
  },
];

export const supervisionOfficerFixture = rawSupervisionOfficerFixture.map(
  (officer) => supervisionOfficerSchema.parse(officer)
);
