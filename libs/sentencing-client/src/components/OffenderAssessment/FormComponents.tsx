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

import { SAR } from "../../api/APIClient";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
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
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    if (selectedValue === "") {
      onChange(null);
    } else {
      onChange(selectedValue as LevelOfEducation);
    }
  };

  return (
    <Styled.FieldContainer>
      <Styled.Label>{label}</Styled.Label>
      <Styled.Select value={value ?? ""} onChange={handleChange}>
        <option value="">Select...</option>
        {Object.entries(LevelOfEducationLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Styled.Select>
    </Styled.FieldContainer>
  );
};
