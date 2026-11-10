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

import React, { useEffect, useState } from "react";

import { formatPhone } from "~@idaho-th/shared";

import CheckOutlineIcon from "../../assets/check-outline.svg?react";
import PencilIcon from "../../assets/pencil.svg?react";
import XIcon from "../../assets/x.svg?react";
import { GhostIconButton } from "../../common/buttons";
import { TextInput } from "../../common/inputs";
import { FALLBACK_VALUE } from "./fieldRow.constants";
import * as Styled from "./FieldRow.styles";
import {
  maxLengthFor,
  toMutationValue,
  validateEditableField,
} from "./fieldRow.utils";
import { EditableFieldKey } from "./types";

export interface FieldRowProps {
  fieldKey: EditableFieldKey;
  label: string;
  value: string;
  editable: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (newValue: string) => void;
}

export const FieldRow: React.FC<FieldRowProps> = ({
  fieldKey,
  label,
  value,
  editable,
  isEditing,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onSave,
}) => {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
      setError(null);
    }
  }, [isEditing, value]);

  const handleSave = () => {
    const nextValue = toMutationValue(draft);
    if (nextValue === value) {
      onCancelEdit();
      return;
    }

    const validationError = validateEditableField(fieldKey, value, draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(nextValue);
  };

  const handleChange = (next: string) => {
    setDraft(fieldKey === "contactPhone" ? formatPhone(next) : next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSave();
      return;
    }

    if (event.key !== "Escape") return;
    // Stops the settings modal's own Escape-to-close from also firing.
    event.stopPropagation();
    onCancelEdit();
  };

  return (
    <Styled.FieldGroup>
      <Styled.FieldLabel>{label}</Styled.FieldLabel>
      {isEditing ? (
        <Styled.EditRow>
          <Styled.InputWrapper>
            <TextInput
              aria-label={label}
              value={draft}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              hasError={!!error}
              errorText={error ?? undefined}
              disabled={isSaving}
              maxLength={maxLengthFor(fieldKey)}
            />
          </Styled.InputWrapper>
          <GhostIconButton
            aria-label={`Save ${label}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            <CheckOutlineIcon />
          </GhostIconButton>
          <GhostIconButton
            aria-label={`Cancel editing ${label}`}
            onClick={onCancelEdit}
            disabled={isSaving}
          >
            <XIcon />
          </GhostIconButton>
        </Styled.EditRow>
      ) : (
        <Styled.EditRow>
          <Styled.FieldValue>{value || FALLBACK_VALUE}</Styled.FieldValue>
          {editable && (
            <GhostIconButton aria-label={`Edit ${label}`} onClick={onStartEdit}>
              <PencilIcon />
            </GhostIconButton>
          )}
        </Styled.EditRow>
      )}
    </Styled.FieldGroup>
  );
};
