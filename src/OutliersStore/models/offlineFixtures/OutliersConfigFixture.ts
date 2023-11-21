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

import { OutliersConfig } from "../OutliersConfig";
import { ADVERSE_METRIC_IDS } from "./constants";

export const OutliersConfigFixture: OutliersConfig = {
  supervisionOfficerLabel: "officer",
  supervisionDistrictLabel: "region",
  supervisionDistrictManagerLabel: "district manager",
  supervisionJiiLabel: "client",
  supervisionSupervisorLabel: "supervisor",
  supervisionUnitLabel: "team",
  learnMoreUrl: "https://recidiviz.org",
  metrics: [
    {
      name: ADVERSE_METRIC_IDS.enum.absconsions_bench_warrants,
      bodyDisplayName: "absconsion rate",
      titleDisplayName: "Absconsion Rate",
      eventName: "absconsions",
      outcomeType: "ADVERSE",
    },
    {
      name: ADVERSE_METRIC_IDS.enum.incarceration_starts,
      bodyDisplayName: "incarceration rate",
      titleDisplayName: "Incarceration Rate",
      eventName: "incarcerations",
      outcomeType: "ADVERSE",
    },
    {
      name: ADVERSE_METRIC_IDS.enum.incarceration_starts_technical_violation,
      bodyDisplayName: "technical incarceration rate",
      titleDisplayName: "Technical Incarceration Rate",
      eventName: "technical incarcerations",
      outcomeType: "ADVERSE",
    },
  ],
  clientEvents: [
    {
      displayName: "Violations",
      name: "violations",
    },
    {
      displayName: "Sanctions",
      name: "violation_responses",
    },
  ],
};
