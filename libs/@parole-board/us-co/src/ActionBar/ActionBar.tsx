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
import { Children, isValidElement, ReactNode } from "react";
import styled, { css } from "styled-components";

import { semantics } from "~@parole-board/common";
import { Toolbar, ToolbarItem } from "~design-system";

import { formatMonthDay } from "../model/month";

const { size, space, text, type } = semantics;

// TODO(CO-935): Waiting on ~design-system to export a semibold (600) weight token. Use it for the label once it lands.
const LABEL_WEIGHT = 600;

// Every form of the bar, the empty one and the hint included, is at least a
// control's height, so the counts row it sits in keeps one height and the
// grid below doesn't move when an action button appears.
const rowStyles = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${rem(space.sm)};
  min-height: ${size.control};
`;

// With no actions there's nothing to reach, so the bar is plain text rather
// than a toolbar that would take focus. With nothing to show it's an empty
// slot.
const Row = styled.div`
  ${rowStyles}
`;

// The DS Toolbar spreads its items across the full width; the bar sits at the
// right end of the counts row instead, with its items wrapping from the right.
const Bar = styled(Toolbar)`
  && {
    ${rowStyles}
    width: auto;
    height: auto;
  }
`;

// TODO(CO-935): Waiting on ~design-system to export a text alias for pine1, the design's label colour. Use it for the label once it lands; text.primary (pine2) stands in.
const Summary = styled.span`
  ${type.Sans14}
  color: ${text.primary};
`;

const Label = styled.span`
  font-weight: ${LABEL_WEIGHT};
`;

const Day = styled.span`
  color: ${text.secondary};
`;

// The design's hint, in the counts' small uppercase label style.
const Hint = styled.span`
  ${type.Sans12}
  color: ${text.secondary};
  text-transform: uppercase;
`;

/** The fields the bar shows for a selected entry. */
export type ActionBarEntry = {
  /** The entry's label, such as "FCF". */
  label: string;
  /** The entry's date, "YYYY-MM-DD". */
  date: string;
};

type ActionBarProps = {
  /** The selected entries, in the order they were selected. */
  selected: readonly ActionBarEntry[];
  /**
   * Actions for the selection, right-aligned. Each child becomes one toolbar
   * item, reached with the arrow keys.
   */
  children?: ReactNode;
  /**
   * Text for the slot while nothing is selected, such as "Drag a session to
   * move it". It shows in the counts' small uppercase style.
   */
  hint?: string;
};

/**
 * The bar shown while entries are selected. With one, it reads the entry's
 * label and day, such as "FCF · September 14", then the actions for that
 * entry. With several, it holds only the actions that apply to all of them,
 * with no label or day; "Move to…" is the only one, so several hearings can
 * move without dragging. With none selected it shows hint, and with several
 * selected and no actions it's empty, in a slot of the same height either
 * way, so the grid below never moves as the selection changes.
 *
 * With actions it's the ~design-system Toolbar, so screen readers announce
 * what the actions apply to and the arrow keys move between them. Matches
 * the bar right of the counts on the Public Calendar screen in the Calendar
 * Unit Dashboard design.
 */
export function ActionBar({ selected, children, hint }: ActionBarProps) {
  // Children.toArray gives every element a key.
  const items = Children.toArray(children).map((action, index) => (
    <ToolbarItem key={isValidElement(action) ? action.key : index}>
      {action}
    </ToolbarItem>
  ));

  if (selected.length === 0) return <Row>{hint && <Hint>{hint}</Hint>}</Row>;

  if (selected.length > 1) {
    if (items.length === 0) return <Row />;
    return (
      <Bar ariaLabel={`Actions for ${selected.length} selected hearings`}>
        {items}
      </Bar>
    );
  }

  const [{ label, date }] = selected;
  const day = formatMonthDay(date);
  const summary = (
    <Summary key="summary">
      <Label>{label}</Label> <Day>· {day}</Day>
    </Summary>
  );

  if (items.length === 0) return <Row>{summary}</Row>;

  // The DS Toolbar takes elements only, so the summary and the items go in
  // as one array.
  return (
    <Bar ariaLabel={`Actions for ${label} on ${day}`}>
      {[summary, ...items]}
    </Bar>
  );
}
