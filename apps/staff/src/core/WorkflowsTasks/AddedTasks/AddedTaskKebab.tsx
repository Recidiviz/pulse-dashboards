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

import styled from "styled-components";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  Icon,
  palette,
} from "~design-system";

const Wrapper = styled.div`
  justify-self: end;
  cursor: pointer;
`;

const KebabButton = styled(DropdownToggle)`
  align-items: center;
  align-self: center;
  border: none;
  color: ${palette.slate60};
  display: inline-flex;
  justify-self: end;

  &:hover,
  &:focus {
    background-color: transparent;
  }

  &:hover {
    color: ${palette.slate85};
  }
`;

const DeleteMenuItem = styled(DropdownMenuItem)`
  color: ${palette.signal.error};
`;

type AddedTaskKebabProps = {
  // Optional so callers can omit the Edit option entirely — e.g. completed
  // tasks, where edits are disallowed to prevent tampering with completed
  // work as raised in the DAS-424 PR review.
  onEditClick?: () => void;
  onDeleteClick: () => void;
};

/**
 * Per-row action kebab for an Added Task. Surfaces "Edit task" and
 * "Delete task". Both items delegate to the row, which owns the
 * subsequent UI state (edit form / delete confirmation).
 */
export function AddedTaskKebab({
  onEditClick,
  onDeleteClick,
}: AddedTaskKebabProps) {
  return (
    <Wrapper>
      <Dropdown>
        <KebabButton className="AddedTaskKebabButton" aria-label="Task actions">
          <Icon kind="EllipsisVertical" size={16} />
        </KebabButton>

        <DropdownMenu alignment="right">
          {onEditClick && (
            <DropdownMenuItem onClick={onEditClick}>Edit task</DropdownMenuItem>
          )}
          <DeleteMenuItem onClick={onDeleteClick}>Delete task</DeleteMenuItem>
        </DropdownMenu>
      </Dropdown>
    </Wrapper>
  );
}
