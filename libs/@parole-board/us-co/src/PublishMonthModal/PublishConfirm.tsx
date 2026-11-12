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

import { MouseEvent, Ref } from "react";

import { Checkbox, CheckboxGroup } from "~design-system";

import { ConfirmPanel } from "./PublishMonthModal.styles";

const CONFIRMED = "confirmed";

export interface PublishConfirmProps {
  /** The confirmation sentence, the checkbox's label. */
  label: string;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  disabled?: boolean;
  /** The panel, so the dialog can move focus to the checkbox inside it. */
  panelRef?: Ref<HTMLDivElement>;
}

/**
 * The confirm checkbox in its shaded panel. The ~design-system Checkbox only
 * works inside a CheckboxGroup, so it sits in a one-item group. Its label
 * covers only the text, so a click anywhere else on the panel toggles it too,
 * as the design's whole-panel button does. Keyboard users reach the checkbox
 * itself.
 */
export function PublishConfirm({
  label,
  confirmed,
  onConfirmedChange,
  disabled = false,
  panelRef,
}: PublishConfirmProps) {
  const onPanelClick = (event: MouseEvent<HTMLDivElement>) => {
    // A click on the input or its label already toggles the checkbox.
    if (disabled || (event.target as Element).closest("input, label")) return;
    onConfirmedChange(!confirmed);
  };

  return (
    <ConfirmPanel ref={panelRef} $disabled={disabled} onClick={onPanelClick}>
      <CheckboxGroup
        ariaLabel="Publish confirmation"
        value={confirmed ? [CONFIRMED] : []}
        onChange={(value) => onConfirmedChange(value.includes(CONFIRMED))}
        disabled={disabled}
      >
        <Checkbox value={CONFIRMED}>{label}</Checkbox>
      </CheckboxGroup>
    </ConfirmPanel>
  );
}
