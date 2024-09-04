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

import {
  ACTION_STRATEGY_TYPE,
  actionStrategySchema,
  RawActionStrategy,
} from "../ActionStrategy";
import { rawSupervisionOfficerFixture } from "./SupervisionOfficerFixture";
import { supervisionOfficerSupervisorsFixture } from "./SupervisionOfficerSupervisor";

export const rawActionStrategyFixture: RawActionStrategy = {
  [rawSupervisionOfficerFixture[0].pseudonymizedId]:
    ACTION_STRATEGY_TYPE.enum.ACTION_STRATEGY_OUTLIER,
  [rawSupervisionOfficerFixture[5].pseudonymizedId]:
    ACTION_STRATEGY_TYPE.enum.ACTION_STRATEGY_OUTLIER_3_MONTHS,
  [rawSupervisionOfficerFixture[2].pseudonymizedId]:
    ACTION_STRATEGY_TYPE.enum.ACTION_STRATEGY_OUTLIER_ABSCONSION,
  [rawSupervisionOfficerFixture[3].pseudonymizedId]:
    ACTION_STRATEGY_TYPE.enum.ACTION_STRATEGY_OUTLIER_NEW_OFFICER,
  [supervisionOfficerSupervisorsFixture[0].pseudonymizedId]:
    ACTION_STRATEGY_TYPE.enum.ACTION_STRATEGY_60_PERC_OUTLIERS,
  [supervisionOfficerSupervisorsFixture[2].pseudonymizedId]:
    ACTION_STRATEGY_TYPE.enum.ACTION_STRATEGY_60_PERC_OUTLIERS,
};

export const actionStrategyFixture = actionStrategySchema.parse(
  rawActionStrategyFixture,
);
