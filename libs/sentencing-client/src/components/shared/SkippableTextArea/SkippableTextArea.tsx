// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { useEffect, useState } from "react";

import { useDebouncedCallback } from "../../../hooks/useDebouncedCallback";
import { SAR_AUTOSAVE_DELAY } from "../../SARDetails/constants";
import * as Styled from "./SkippableTextArea.styles";

export interface SkippableTextAreaProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => Promise<void>;
  placeholder: string;
  disabled?: boolean;
  height?: string;
  onLocalChange?: () => void; // Called immediately on every keystroke (not debounced) for instant UI updates
  placeholderColor?: string;
}

export function SkippableTextArea({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  height = "6.8125rem",
  onLocalChange,
  placeholderColor,
}: SkippableTextAreaProps) {
  // Local state for text input to provide instant UI feedback
  const [localValue, setLocalValue] = useState(value ?? "");

  // Sync local state with prop changes
  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  // Create debounced save function
  const debouncedSave = useDebouncedCallback(onChange, SAR_AUTOSAVE_DELAY);

  const handleTextChange = (value: string) => {
    // Call onLocalChange immediately for instant UI updates (e.g., marking as edited)
    // The handler can guard against duplicate work if needed
    onLocalChange?.();

    setLocalValue(value);
    debouncedSave(value);
  };

  return (
    <Styled.Container>
      {label && <Styled.Label>{label}</Styled.Label>}
      <Styled.StyledTextArea
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={disabled}
        height={height}
        $placeholderColor={placeholderColor}
      />
    </Styled.Container>
  );
}
