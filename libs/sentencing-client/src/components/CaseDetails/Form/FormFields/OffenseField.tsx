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
import { useEffect } from "react";
import { components, MenuProps, OptionProps } from "react-select";

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { LSIR_SCORE_KEY, OFFENSE_KEY } from "../../constants";
import { Dropdown } from "../Elements/Dropdown";
import { form } from "../FormStore";
import { FormFieldProps, SelectOption } from "../types";
import { useFormField } from "../useFormFields";
import { fuzzyMatch, highlightMatchedText } from "../utils";

export const customFilter = (option: SelectOption, inputValue: string) => {
  if (!inputValue) return true;
  return fuzzyMatch(inputValue, option);
};

function OffenseField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;

  const { inputValue, setInputValue, selectValue, setSelectValue } =
    useFormField({
      initialSelectValue: {
        label: caseAttributes?.offense,
        value: caseAttributes?.offense,
      },
    });
  /* TODO(Recidiviz/recidiviz-data#36133) - Reverse temporary disabling of this feature once fixes are complete */
  // const [isViolentSexOffense, setIsViolentSexOffense] = useState({
  //   isViolentOffense: Boolean(caseAttributes?.isCurrentOffenseViolent),
  //   isSexOffense: Boolean(caseAttributes?.isCurrentOffenseSexual),
  // });

  const options = Object.keys(caseStore.offensesByName).map(
    (selection: string) => ({
      label: selection,
      value: selection,
    }),
  );

  const updateDropdownInput = (option?: SelectOption | null) => {
    if (!option) return;

    setSelectValue(option);
    form.updateForm(OFFENSE_KEY, option.value, isRequired);

    /** Fetches insights when offense changes to display rollup text under the LSI-R score field  */
    /* TODO(Recidiviz/recidiviz-data#36133) - Reverse temporary disabling of this feature once fixes are complete */
    caseStore.getInsight(
      String(option.value),
      form.updates[LSIR_SCORE_KEY] ??
        caseStore.caseAttributes.lsirScore ??
        undefined,
      null,
      null,
      // isViolentSexOffense.isSexOffense,
      // isViolentSexOffense.isViolentOffense,
    );
  };

  /* TODO(Recidiviz/recidiviz-data#36133) - Reverse temporary disabling of this feature once fixes are complete */
  // const toggleViolentSexOffenseSelection = (
  //   key: typeof VIOLENT_OFFENSE_KEY | typeof SEX_OFFENSE_KEY,
  // ) => {
  //   let violentOffenseValue = isViolentSexOffense.isViolentOffense;
  //   let sexOffenseValue = isViolentSexOffense.isSexOffense;

  //   if (key === VIOLENT_OFFENSE_KEY) {
  //     violentOffenseValue = !isViolentSexOffense.isViolentOffense;
  //     setIsViolentSexOffense((prev) => ({
  //       ...prev,
  //       isViolentOffense: violentOffenseValue,
  //     }));
  //     form.updateForm(key, violentOffenseValue);
  //   } else if (key === SEX_OFFENSE_KEY) {
  //     sexOffenseValue = !isViolentSexOffense.isSexOffense;
  //     setIsViolentSexOffense((prev) => ({
  //       ...prev,
  //       isSexOffense: sexOffenseValue,
  //     }));
  //     form.updateForm(key, sexOffenseValue);
  //   }

  //   /** Fetches insights when violent/sex offense changes to display rollup text under the LSI-R score field  */

  //   caseStore.getInsight(
  //     selectValue?.value ? String(selectValue?.value) : undefined,
  //     form.updates[LSIR_SCORE_KEY] ??
  //       caseStore.caseAttributes.lsirScore ??
  //       undefined,
  //     sexOffenseValue,
  //     violentOffenseValue,
  //   );
  // };

  const customFilter = (option: SelectOption, inputValue: string | null) => {
    if (!inputValue) return true;
    return fuzzyMatch(inputValue, option);
  };

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

  /** Validate previously saved offense field */
  useEffect(() => {
    form.validate(OFFENSE_KEY, caseAttributes?.offense, isRequired);
    return () => form.resetErrors();
  }, [caseAttributes, isRequired]);

  /** Fetch insights on previously saved values */
  useEffect(() => {
    /* TODO(Recidiviz/recidiviz-data#36133) - Reverse temporary disabling of this feature once fixes are complete */
    caseStore.getInsight(
      caseAttributes?.offense,
      caseStore.caseAttributes.lsirScore ?? undefined,
      null,
      null,
      // isViolentSexOffense.isSexOffense,
      // isViolentSexOffense.isViolentOffense,
    );
    // We only need to call this once on load to update/clear previously fetched insights
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Styled.InputLabel>
        Offense {isRequired && <span>Required*</span>}
      </Styled.InputLabel>

      <Dropdown
        value={selectValue?.value ? selectValue : null}
        options={options}
        onChange={(value) => updateDropdownInput(value as SelectOption)}
        onInputChange={setInputValue}
        filterOption={customFilter}
        customComponents={{
          Option: CustomOption,
          Menu: CustomMenu,
        }}
        styles={Styled.dropdownStyles}
      />

      <Styled.InputDescription>
        If there are multiple charges for this case, choose the most severe
      </Styled.InputDescription>

      {/* TODO(Recidiviz/recidiviz-data#36133) - Reverse temporary disabling of this feature once fixes are complete */}
      {/* <Styled.ViolentOrSexOffenseCheckboxContainer>
        <Styled.CheckboxWrapper>
          <label htmlFor="is_violent_offense">Violent Offense</label>
          <input
            id="is_violent_offense"
            type="checkbox"
            checked={isViolentSexOffense.isViolentOffense}
            onChange={() =>
              toggleViolentSexOffenseSelection(VIOLENT_OFFENSE_KEY)
            }
          />
        </Styled.CheckboxWrapper>
        <Styled.CheckboxWrapper>
          <label htmlFor="is_sex_offense">Sex Offense</label>
          <input
            id="is_sex_offense"
            type="checkbox"
            checked={isViolentSexOffense.isSexOffense}
            onChange={() => toggleViolentSexOffenseSelection(SEX_OFFENSE_KEY)}
          />
        </Styled.CheckboxWrapper>
      </Styled.ViolentOrSexOffenseCheckboxContainer> */}
    </>
  );
}

export default observer(OffenseField);
