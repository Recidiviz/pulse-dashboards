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

import moment from "moment";

export const isBeforeDueDate = (dueDate: Date | null, offset?: number) => {
  if (!dueDate) return;

  return (
    moment().utc() <
    moment(dueDate)
      .utc()
      .add(offset ?? 1, "day")
  );
};

export const isBeforeDueDateWithExtraDayOffset = (dueDate: Date | null) => {
  if (!dueDate) return;
  /**
   * This due date offset will allow PSI an extra day to access their due cases within
   * the Active status filter before they get archived
   * @example a case that's due on 5/15/2025 should be archived on 5/17/2025
   */
  return isBeforeDueDate(dueDate, 2);
};
