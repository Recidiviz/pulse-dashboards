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

import { ReactNode, useId } from "react";

import { Checkbox } from "~@jii/common-ui";
import { palette } from "~design-system";

import {
  BadgeSlot,
  Content,
  ErrorMessage,
  Label,
  Row,
  Wrapper,
} from "./ChecklistItem.styles";

export type ChecklistItemProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  badge?: ReactNode;
  error?: string;
};

/**
 * One checklist row: a checkbox with its label, an optional clickable badge beside it,
 * and an optional error below it. Tapping anywhere on the row except the badge
 * toggles the checkbox.
 */
export const ChecklistItem = ({
  label,
  checked,
  onCheckedChange,
  badge,
  error,
}: ChecklistItemProps) => {
  const checkboxId = useId();
  const errorId = useId();
  const describedBy = error ? errorId : undefined;

  return (
    <Wrapper $hasError={!!error}>
      <Row>
        <Checkbox
          id={checkboxId}
          $size={24}
          $accentColor={palette.pine2}
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          aria-describedby={describedBy}
        />
        <Content>
          <Label htmlFor={checkboxId}>{label}</Label>
          {error && (
            <ErrorMessage id={errorId} role="alert">
              {error}
            </ErrorMessage>
          )}
        </Content>
        {badge && <BadgeSlot>{badge}</BadgeSlot>}
      </Row>
    </Wrapper>
  );
};
