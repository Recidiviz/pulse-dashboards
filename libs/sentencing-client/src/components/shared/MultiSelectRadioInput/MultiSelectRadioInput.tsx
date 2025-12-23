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

import { debounce } from "lodash";
import { useEffect, useRef, useState } from "react";

import CheckIcon from "../../assets/green-check-icon.svg?react";
import { NeedsIcons } from "../../CaseDetails/components/NeedsIcons/NeedsIcons";
import { NOT_SURE_YET_OPTION, OTHER_OPTION } from "../../constants";
import { SAR_AUTOSAVE_DELAY } from "../../SARDetails/constants";
import * as Styled from "./MultiSelectRadioInput.styles";

export interface MultiSelectRadioInputProps {
  options: string[];
  selections: string[];
  updateSelections: (option: string) => void;
  disabled?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
  skipped?: boolean;
  onSkipChange?: (skipped: boolean) => void;
  skipLabel?: string;
  helperText?: string;
  title?: string;
  includeIcon?: boolean;
}

export function MultiSelectRadioInput({
  options,
  selections,
  updateSelections,
  disabled = false,
  otherValue,
  onOtherChange,
  otherPlaceholder = "Please specify",
  skipped = false,
  onSkipChange,
  skipLabel = "Skip",
  helperText,
  title,
  includeIcon = true,
}: MultiSelectRadioInputProps) {
  // When skipped, disable the input
  const isDisabled = disabled || skipped;

  // Determine if "Other" is selected
  const showOtherTextField = selections.includes(OTHER_OPTION) && !isDisabled;

  // Local state for "Other" text input to provide instant UI feedback
  const [localOtherValue, setLocalOtherValue] = useState(otherValue ?? "");

  // Sync local state with prop changes
  useEffect(() => {
    setLocalOtherValue(otherValue ?? "");
  }, [otherValue]);

  // Create stable debounced save function for "Other" text input
  const debouncedSaveRef = useRef(
    debounce((value: string) => {
      if (onOtherChange) {
        onOtherChange(value);
      }
    }, SAR_AUTOSAVE_DELAY),
  );

  // Cleanup on unmount - flush pending saves
  useEffect(() => {
    const debouncedFn = debouncedSaveRef.current;
    return () => {
      debouncedFn?.flush();
    };
  }, []);

  const handleOtherTextChange = (value: string) => {
    setLocalOtherValue(value);
    debouncedSaveRef.current(value);
  };

  return (
    <>
      {/* Title and Skip checkbox in flexbox column */}
      {(title || onSkipChange) && (
        <Styled.HeaderContainer>
          {title && <Styled.Title>{title}</Styled.Title>}
          {onSkipChange && (
            <Styled.SkipContainer>
              <Styled.SkipLabel>{skipLabel}</Styled.SkipLabel>
              <Styled.SkipCheckbox
                type="checkbox"
                checked={skipped}
                onChange={(e) => onSkipChange(e.target.checked)}
              />
            </Styled.SkipContainer>
          )}
        </Styled.HeaderContainer>
      )}

      {/* Helper text */}
      {helperText && <Styled.HelperText>{helperText}</Styled.HelperText>}

      {/* Selection chips */}
      <Styled.MultiSelectContainer disabled={isDisabled}>
        {options.map((option) => {
          const selected = selections.includes(option);
          const hasNoSelections = selections.length === 0;
          const isDefaultNotSureYetSelected =
            option === NOT_SURE_YET_OPTION && selections.length === 0;

          return (
            <Styled.SelectChip
              key={option}
              selected={selected || isDefaultNotSureYetSelected}
              disabled={isDisabled}
              onClick={() => !isDisabled && updateSelections(option)}
              isNotSureYetOption={hasNoSelections}
            >
              {includeIcon && selected && <CheckIcon />}
              {includeIcon && NeedsIcons[option]}
              {option}
            </Styled.SelectChip>
          );
        })}
      </Styled.MultiSelectContainer>

      {/* "Other" text field - built into component */}
      {showOtherTextField && onOtherChange && (
        <Styled.OtherTextArea
          placeholder={otherPlaceholder}
          value={localOtherValue}
          onChange={(e) => handleOtherTextChange(e.target.value)}
        />
      )}
    </>
  );
}
