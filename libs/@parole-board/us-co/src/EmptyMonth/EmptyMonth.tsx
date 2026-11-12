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

import type { YearMonthOption } from "~@parole-board/common";
import { semantics, StatusMessage } from "~@parole-board/common";
import { Button, Icon } from "~design-system";

import { formatMonthYear } from "../model/month";

const { space } = semantics;

/**
 * The body for a month that doesn't exist yet (months.get returned null),
 * with "+ Add month" when onAddMonth is set.
 */
export function EmptyMonth({
  viewed,
  onAddMonth,
}: {
  viewed: YearMonthOption;
  onAddMonth?: () => void;
}) {
  return (
    <StatusMessage
      icon={<Icon kind="Calendar" size={space.xl} />}
      title={`No calendar yet for ${formatMonthYear(viewed)}.`}
    >
      {onAddMonth && (
        <Button kind="secondary" shape="block" onClick={onAddMonth}>
          + Add month
        </Button>
      )}
    </StatusMessage>
  );
}
