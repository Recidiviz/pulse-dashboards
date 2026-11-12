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

import {
  getCalendarErrorCode,
  semantics,
  StatusMessage,
} from "~@parole-board/common";
import { Icon } from "~design-system";

export const MONTH_LOAD_ERROR_TITLE = "We couldn't load this month.";

/**
 * Shows the access message for a FORBIDDEN error, and leaves every other
 * error to SuspenseBoundary's LoadError and its "Try again".
 */
export function renderCalendarError(error: unknown) {
  if (getCalendarErrorCode(error) !== "FORBIDDEN") return undefined;
  return (
    <StatusMessage
      icon={<Icon kind="Alert" size={semantics.space.lg} />}
      title="You don't have access to the Public Calendar."
    />
  );
}
