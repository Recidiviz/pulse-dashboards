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

import { useQuery } from "@tanstack/react-query";

import type { YearMonthOption } from "~@parole-board/common";
import { useMonthQueryOptions } from "~@parole-board/common";

/**
 * Reads the same months.get query as useMonth without suspending, for parts
 * of the screen that stay up while the month loads, such as the header's
 * actions. isPending is true until the month first loads.
 */
export function useMonthWithoutSuspense(viewed: YearMonthOption) {
  return useQuery(useMonthQueryOptions(viewed));
}
