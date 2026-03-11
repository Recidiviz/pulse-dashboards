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

import React, { useState } from "react";
import { MultiValue, SingleValue } from "react-select";

import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { Dropdown } from "../CaseDetails/Form/Elements/Dropdown";
import { SelectOption } from "../CaseDetails/Form/types";
import { SAR_AUTOSAVE_DELAY } from "../SARDetails/constants";
import * as Styled from "./CaseInformation.styles";
import {
  BackToListLink,
  HelperText,
  InlineRow,
  judgeDropdownStyles,
  JudgeNameSection,
  PencilInput,
  TitlePrefix,
} from "./JudgeSelector.styles";

const OTHER_VALUE = "__other__";

export type JudgeOption = {
  label: string;
  value: string;
  division: string | null;
};

interface JudgeSelectorProps {
  judgeOptions: JudgeOption[];
  selectedJudgeName: string | null;
  selectedDivision: string | null;
  onUpdate: (name: string | null, division?: string | null) => Promise<void>;
}

export const JudgeSelector: React.FC<JudgeSelectorProps> = ({
  judgeOptions,
  selectedJudgeName,
  selectedDivision,
  onUpdate,
}) => {
  const [isOther, setIsOther] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [divisionValue, setDivisionValue] = useState(selectedDivision ?? "");

  const debouncedDivisionUpdate = useDebouncedCallback(
    (name: string | null, division: string) => {
      onUpdate(name, division || null);
    },
    SAR_AUTOSAVE_DELAY,
  );

  const debouncedOtherNameUpdate = useDebouncedCallback(
    (name: string, division: string) => {
      onUpdate(name || null, division || null);
    },
    SAR_AUTOSAVE_DELAY,
  );

  const dropdownOptions: SelectOption[] = [
    ...judgeOptions.map((o) => ({ label: o.label, value: o.value })),
    { label: "Other", value: OTHER_VALUE },
  ];

  const dropdownValue: SelectOption | null = selectedJudgeName
    ? { label: selectedJudgeName, value: selectedJudgeName }
    : null;

  const handleDropdownChange = (
    option: MultiValue<SelectOption> | SingleValue<SelectOption> | null,
  ) => {
    if (!option || Array.isArray(option)) return;
    const selected = option as SelectOption;

    if (selected.value === OTHER_VALUE) {
      setIsOther(true);
      // Pre-fill with any previously saved name that wasn't in the list
      const savedOtherName =
        selectedJudgeName &&
        !judgeOptions.some((o) => o.value === selectedJudgeName)
          ? selectedJudgeName
          : "";
      setOtherName(savedOtherName);
      if (!savedOtherName) {
        setDivisionValue("");
        onUpdate(null, null);
      }
    } else {
      const value = selected.value as string;
      const matchingOption = judgeOptions.find((o) => o.value === value);
      const division = matchingOption?.division ?? null;
      setIsOther(false);
      setDivisionValue(division ?? "");
      onUpdate(value, division);
    }
  };

  const handleOtherNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOtherName(value);
    debouncedOtherNameUpdate(value, divisionValue);
  };

  const handleDivisionChange = (value: string) => {
    setDivisionValue(value);
    const currentName = isOther ? otherName : selectedJudgeName;
    debouncedDivisionUpdate(currentName, value);
  };

  return (
    <Styled.JudgeInformationContainer>
      <Styled.StaffInfoColumn>
        <JudgeNameSection>
          <TitlePrefix>To Honorable</TitlePrefix>
          {isOther ? (
            <PencilInput
              type="text"
              value={otherName}
              onChange={handleOtherNameChange}
              placeholder="Type in judge name here"
            />
          ) : (
            <Dropdown
              value={dropdownValue}
              options={dropdownOptions}
              onChange={handleDropdownChange}
              styles={judgeDropdownStyles}
              placeholder="Select Judge"
            />
          )}
          {isOther && (
            <HelperText>
              <span>Type in the judge&apos;s name above.</span>
              {judgeOptions.length > 0 && (
                <BackToListLink
                  onClick={() => {
                    setIsOther(false);
                    setOtherName("");
                    onUpdate(null, null);
                  }}
                >
                  Choose from list
                </BackToListLink>
              )}
            </HelperText>
          )}
        </JudgeNameSection>
      </Styled.StaffInfoColumn>
      <InlineRow>
        <TitlePrefix>Division</TitlePrefix>
        <PencilInput
          type="text"
          value={divisionValue}
          onChange={(e) => handleDivisionChange(e.target.value)}
          placeholder="Enter Division"
        />
      </InlineRow>
    </Styled.JudgeInformationContainer>
  );
};
