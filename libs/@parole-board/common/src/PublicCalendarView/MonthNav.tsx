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

import { useHostLink } from "../host/ParoleBoardHostContext";
import {
  ArrowLink,
  DisabledArrow,
  MonthTitle,
  Nav,
} from "./PublicCalendarView.styles";

type Direction = "previous" | "next";

const ARROWS: Record<Direction, { glyph: string; label: string }> = {
  previous: { glyph: "‹", label: "Previous month" },
  next: { glyph: "›", label: "Next month" },
};

function Arrow({
  direction,
  month,
  monthHref,
}: {
  direction: Direction;
  month: string | null;
  monthHref: (month: string) => string;
}) {
  const HostLink = useHostLink();
  const { glyph, label } = ARROWS[direction];
  const content = <span aria-hidden>{glyph}</span>;
  // At the first or last published month there's nowhere to go, so the arrow
  // is a disabled button rather than a link with no address.
  if (!month) {
    return (
      <DisabledArrow kind="secondary" shape="block" disabled aria-label={label}>
        {content}
      </DisabledArrow>
    );
  }
  return (
    <ArrowLink as={HostLink} to={monthHref(month)} aria-label={label}>
      {content}
    </ArrowLink>
  );
}

/**
 * The month title between links to the previous and next published months.
 * The links are router links (useHostLink), so moving between months is a
 * route change: the page stays and the title's text changes in place. The
 * title is a live region, so a screen reader announces the new month.
 */
export function MonthNav({
  title,
  previous,
  next,
  monthHref,
}: {
  title: string;
  previous: string | null;
  next: string | null;
  monthHref: (month: string) => string;
}) {
  return (
    <Nav aria-label="Months">
      <Arrow direction="previous" month={previous} monthHref={monthHref} />
      <MonthTitle aria-live="polite">{title}</MonthTitle>
      <Arrow direction="next" month={next} monthHref={monthHref} />
    </Nav>
  );
}
