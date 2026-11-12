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

import { injectable, withDi } from "react-magnetic-di";

import { semantics, usePrefetchMonth } from "~@parole-board/common";
import { Icon } from "~design-system";

import { Mirrored } from "./MonthHeader.styles";
import { MonthLink, MonthNav } from "./MonthNav";

const usePrefetchMonthDi = injectable(usePrefetchMonth, () => () => undefined);

const arrow = <Icon kind="Arrow" size={semantics.space.md} />;

function Arrows({
  previous,
  next,
}: {
  previous: { year: number; month: number } | null;
  next: { year: number; month: number } | null;
}) {
  return (
    <MonthNav>
      <MonthLink month={previous} label="Previous month">
        <Mirrored>{arrow}</Mirrored>
      </MonthLink>
      <MonthLink month={next} label="Next month">
        {arrow}
      </MonthLink>
    </MonthNav>
  );
}

const InjectedArrows = withDi(Arrows, [usePrefetchMonthDi]);

export default {};

// The arrows follow the Public Calendar screen in the Calendar Unit Dashboard
// design and look like the ~design-system borderless Button in its block
// shape.

/** Both arrows are links, to September and November 2026. */
export const Links = () => (
  <InjectedArrows
    previous={{ year: 2026, month: 9 }}
    next={{ year: 2026, month: 11 }}
  />
);

/** At the first stored month the previous arrow is a disabled button. */
export const FirstMonth = () => (
  <InjectedArrows previous={null} next={{ year: 2026, month: 11 }} />
);

/** At the last stored month the next arrow is a disabled button. */
export const LastMonth = () => (
  <InjectedArrows previous={{ year: 2026, month: 11 }} next={null} />
);
