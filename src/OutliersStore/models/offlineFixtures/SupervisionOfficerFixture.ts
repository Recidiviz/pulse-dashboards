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
import { ADVERSE_METRIC_IDS } from "./constants";
import { rawSupervisionOfficerMetricOutlierFixtures } from "./SupervisionOfficerMetricOutlierFixture";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

export const rawSupervisionOfficerFixture: RawSupervisionOfficer[] = [
  {
    externalId: "so1",
    name: {
      given_names: "Duke",
      surname: "Ellington",
    },
    district: supervisionOfficerSupervisorsFixture[0].district,
    supervisorId: supervisionOfficerSupervisorsFixture[0].externalId,
    currentPeriodStatuses: {
      far: [
        rawSupervisionOfficerMetricOutlierFixtures.absconsions_bench_warrants
          .GENERAL_OR_OTHER[0],
      ],
      near: [
        ADVERSE_METRIC_IDS.enum.incarceration_starts,
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      ],
      met: [],
    },
  },
  {
    externalId: "so2",
    name: {
      given_names: "Chet",
      surname: "Baker",
    },
    district: supervisionOfficerSupervisorsFixture[0].district,
    supervisorId: supervisionOfficerSupervisorsFixture[0].externalId,
    currentPeriodStatuses: {
      far: [],
      near: [
        ADVERSE_METRIC_IDS.enum.incarceration_starts,
        ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      ],
      met: [ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants],
    },
  },
];

export const supervisionOfficerFixture = rawSupervisionOfficerFixture.map(
  (officer) => supervisionOfficerSchema.parse(officer)
);
