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

import React, { useEffect, useState } from "react";
import { MultiValue, SingleValue } from "react-select";

import { SAR } from "../../api/APIClient";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { Dropdown } from "../CaseDetails/Form/Elements/Dropdown";
import { SelectOption } from "../CaseDetails/Form/types";
import { LevelOfEducationLabels } from "../constants";
import { SAR_AUTOSAVE_DELAY } from "../SARDetails/constants";
import * as Styled from "./FormComponents.styles";

type LevelOfEducation = NonNullable<SAR["levelOfEducation"]>;

interface TextFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string) => Promise<void>;
  placeholder?: string;
  halfWidth?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  halfWidth = false,
}) => {
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const debouncedSave = useDebouncedCallback(onChange, SAR_AUTOSAVE_DELAY);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    debouncedSave(newValue);
  };

  return (
    <Styled.FieldContainer>
      <Styled.Label>{label}</Styled.Label>
      <Styled.Input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        halfWidth={halfWidth}
      />
    </Styled.FieldContainer>
  );
};

interface EducationDropdownProps {
  label: string;
  value: LevelOfEducation | null;
  onChange: (value: LevelOfEducation | null) => Promise<void>;
}

export const EducationDropdown: React.FC<EducationDropdownProps> = ({
  label,
  value,
  onChange,
}) => {
  const options: SelectOption[] = Object.entries(LevelOfEducationLabels).map(
    ([key, label]) => ({ value: key, label }),
  );

  const selectedOption = value
    ? options.find((opt) => opt.value === value) || null
    : null;

  const handleChange = (
    option: MultiValue<SelectOption> | SingleValue<SelectOption>,
  ) => {
    const singleOption = option as SingleValue<SelectOption>;
    if (!singleOption) {
      onChange(null);
    } else {
      onChange(singleOption.value as LevelOfEducation);
    }
  };

  return (
    <Styled.FieldContainer>
      <Styled.Label>{label}</Styled.Label>
      <Dropdown
        value={selectedOption}
        options={options}
        onChange={handleChange}
        placeholder="Select..."
        styles={Styled.dropdownStyles}
      />
    </Styled.FieldContainer>
  );
};

// Individual options for explicit access (avoid relying on array indexing)
const YES_OPTION: SelectOption = { value: "true", label: "Yes" };
const NO_OPTION: SelectOption = { value: "false", label: "No" };
const UNKNOWN_OPTION: SelectOption = { value: "unknown", label: "Unknown" };

const BOOLEAN_WITH_UNKNOWN_OPTIONS: SelectOption[] = [
  YES_OPTION,
  NO_OPTION,
  UNKNOWN_OPTION,
];

interface BooleanDropdownProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => Promise<void>;
}

export const BooleanDropdown: React.FC<BooleanDropdownProps> = ({
  label,
  value,
  onChange,
}) => {
  const getSelectedOption = () => {
    if (value === true) return YES_OPTION;
    if (value === false) return NO_OPTION;
    // null means unknown/not set
    return UNKNOWN_OPTION;
  };

  const handleChange = (
    option: MultiValue<SelectOption> | SingleValue<SelectOption>,
  ) => {
    const singleOption = option as SingleValue<SelectOption>;
    if (!singleOption || singleOption.value === "unknown") {
      onChange(null);
    } else {
      onChange(singleOption.value === "true");
    }
  };

  return (
    <Styled.FieldContainer>
      <Styled.Label>{label}</Styled.Label>
      <Dropdown
        value={getSelectedOption()}
        options={BOOLEAN_WITH_UNKNOWN_OPTIONS}
        onChange={handleChange}
        placeholder="Select..."
        styles={Styled.dropdownStyles}
      />
    </Styled.FieldContainer>
  );
};
