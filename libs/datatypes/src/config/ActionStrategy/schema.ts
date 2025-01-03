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

import { z } from "zod";

export const ACTION_STRATEGY_TYPE = z.enum([
  "ACTION_STRATEGY_OUTLIER",
  "ACTION_STRATEGY_OUTLIER_3_MONTHS",
  "ACTION_STRATEGY_OUTLIER_ABSCONSION",
  "ACTION_STRATEGY_OUTLIER_NEW_OFFICER",
  "ACTION_STRATEGY_60_PERC_OUTLIERS",
]);

// The key in this record is the pseudoId of the officer/supervisor
export const actionStrategySchema = z.record(
  z.string(),
  ACTION_STRATEGY_TYPE.nullable(),
);

export type ActionStrategyType = z.infer<typeof ACTION_STRATEGY_TYPE>;

export type ActionStrategy = z.infer<typeof actionStrategySchema>;
export type RawActionStrategy = z.input<typeof actionStrategySchema>;
