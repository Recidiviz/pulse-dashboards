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

import { rem } from "polished";
import styled from "styled-components";

import { semantics } from "~@parole-board/common";

const { space, text, type } = semantics;

// TODO(CO-935): Waiting on ~design-system to export a semibold (600) weight token. Use it for the counts once it lands.
const COUNT_WEIGHT = 600;

const List = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${rem(space.lg)};
  margin: 0;
`;

const Pair = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${rem(space.xs)};
`;

const Term = styled.dt`
  ${type.Sans12}
  color: ${text.secondary};
  text-transform: uppercase;
`;

// TODO(CO-935): Waiting on ~design-system to export a text alias for pine1, the design's count colour. Use it for the counts once it lands; text.primary (pine2) stands in.
const Value = styled.dd`
  ${type.Sans14}
  margin: 0;
  font-weight: ${COUNT_WEIGHT};
  color: ${text.primary};
`;

type CountsBarProps = {
  /** Days in the month with at least one entry that counts, from the server. */
  entryDays: number;
  /** Entries in the month that count, from the server. */
  entryCount: number;
};

/**
 * The month's hearing days and hearings, as label and number pairs in a
 * description list so screen readers read each label with its number. Shows
 * the server's counts as given. Matches the counts above the grid on the
 * Public Calendar screen in the Calendar Unit Dashboard design.
 */
export function CountsBar({ entryDays, entryCount }: CountsBarProps) {
  return (
    <List>
      <Pair>
        <Term>Hearing days</Term>
        <Value>{entryDays}</Value>
      </Pair>
      <Pair>
        <Term>Hearings</Term>
        <Value>{entryCount}</Value>
      </Pair>
    </List>
  );
}
