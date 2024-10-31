// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { action } from "mobx";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import Select, {
  components,
  MenuProps,
  OptionProps,
  SingleValue,
} from "react-select";

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { OFFENSE_KEY } from "../../constants";
import { InputFieldProps, SelectOption } from "../types";
import { fuzzyMatch, highlightMatchedText } from "../utils";
import { OtherContextInputField } from "./OtherContextField";

// eslint-disable-next-line react/display-name
export const DropdownField: React.FC<InputFieldProps> = observer(
  ({ element, parentKey, prevValue, updateForm }) => {
    const { caseStore } = useStore();

    const [inputValue, setInputValue] = useState("");
    const [currentValue, setCurrentValue] = useState<SelectOption | null>({
      label: String(prevValue),
      value: prevValue,
    });

    const updateDropdownInput = (option?: SelectOption | null) => {
      if (!option) return;

      setCurrentValue(option);
      updateForm(element.key, option.value, parentKey);
    };

    const customFilter = (option: SelectOption, inputValue: string) => {
      if (!inputValue) return true;
      return fuzzyMatch(inputValue, option);
    };

    const options = element.options?.map((selection) => ({
      label: selection,
      value: selection,
    }));

    const CustomHeader = () => {
      const filteredOptions = options?.filter((option) =>
        customFilter(option, inputValue),
      );

      return (
        <Styled.DropdownHeader>
          <span>{filteredOptions?.length} Results (as of 3 years)</span>
          <span>Sorted by Frequency</span>
        </Styled.DropdownHeader>
      );
    };

    const CustomOption = action((props: OptionProps<SelectOption>) => {
      const frequencyLabel =
        props.data.label &&
        caseStore.offensesByName[props.data.label].frequency.toLocaleString();

      return (
        <components.Option {...props}>
          <Styled.OptionFrequencyLabelWrapper>
            <Styled.OptionLabel>
              {highlightMatchedText(inputValue, props.data.label)}
            </Styled.OptionLabel>
            <Styled.FrequencyLabel>{frequencyLabel}</Styled.FrequencyLabel>
          </Styled.OptionFrequencyLabelWrapper>
        </components.Option>
      );
    });

    const CustomMenu = (props: MenuProps<SelectOption>) => {
      return (
        <components.Menu {...props}>
          <CustomHeader />
          {props.children}
        </components.Menu>
      );
    };

    return (
      <>
        <Select
          placeholder={element.placeholder}
          value={currentValue?.value ? currentValue : null}
          options={options}
          isMulti={false}
          components={
            element.key === OFFENSE_KEY
              ? { Option: CustomOption, Menu: CustomMenu }
              : undefined
          }
          onInputChange={(value) => setInputValue(value)}
          onChange={(value) => {
            updateDropdownInput(value as SingleValue<SelectOption>);
            element.onChange && element.onChange();
          }}
          isDisabled={element.isDisabled}
          filterOption={customFilter}
          styles={Styled.dropdownStyles}
        />
        <OtherContextInputField
          {...{ element, parentKey, prevValue, updateForm }}
        />
      </>
    );
  },
);
