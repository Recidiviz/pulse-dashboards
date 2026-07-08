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

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownToggle,
  Icon,
  palette,
  spacing,
} from "~design-system";

export const FilterHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${rem(spacing.sm)};
`;

export type TaskSectionFilterProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  testId?: string;
};

// Strip the default Button chrome so the toggle reads as a plain icon button,
// and drive the icon color (the Icon renders with `currentColor`) via `color`.
const FilterToggle = styled(DropdownToggle)`
  color: ${palette.slate60};
  padding: 0px;
  min-height: unset;
  min-width: unset;

  & svg {
    height: 12px;
    width: 12px;
  }
`;

const FilterMenuItem = styled(DropdownMenuItem)`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.sm)};
`;

// Reserve the indicator's space so the label doesn't shift when toggling.
const CheckSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${rem(16)};
  color: ${palette.signal.highlight};
`;

/**
 * A fully-presentational filter control: an icon-only dropdown toggle that
 * reveals a single menu item. Clicking the item toggles `checked` (the menu
 * stays open) and surfaces a check indicator when active.
 */
export function TaskSectionFilter({
  label,
  checked,
  onChange,
  testId,
}: TaskSectionFilterProps) {
  return (
    <Dropdown>
      <FilterToggle
        kind="borderless"
        icon="Filter"
        aria-label={`Filter: ${label}`}
      />
      {/*
       * Anchor the menu to the toggle's right edge so it opens leftward. The
       * toggle sits at the right edge of the module header, so the default
       * left alignment lets the absolutely-positioned menu overflow past the
       * panel's right edge and introduce a horizontal scrollbar.
       */}
      <DropdownMenu alignment="right">
        <DropdownMenuLabel>Filter</DropdownMenuLabel>
        <FilterMenuItem
          preventCloseOnClickEvent
          onClick={() => onChange(!checked)}
          className={testId}
        >
          <CheckSlot aria-hidden>
            {checked && <Icon kind="Check" size={12} />}
          </CheckSlot>
          {label}
        </FilterMenuItem>
      </DropdownMenu>
    </Dropdown>
  );
}
