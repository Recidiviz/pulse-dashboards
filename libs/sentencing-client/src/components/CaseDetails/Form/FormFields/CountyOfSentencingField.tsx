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

import { startCase } from "lodash";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { COUNTY_KEY, DISTRICT_KEY } from "../../constants";
import { Dropdown } from "../Elements/Dropdown";
import { form } from "../FormStore";
import { FormFieldProps, SelectOption } from "../types";
import { useFormField } from "../useFormFields";

function CountyOfSentencingField({ isRequired }: FormFieldProps) {
  const { caseStore, geoConfig } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const omsSystem = geoConfig.omsSystem;
  const countiesOptions = caseStore.counties;
  const countyOfSentencing = startCase(
    caseAttributes?.county?.toLocaleLowerCase() ?? "",
  );
  const options = countiesOptions.map((selection) => ({
    label: startCase(selection.county?.toLocaleLowerCase()),
    value: selection.county,
  }));

  const { selectValue, setSelectValue } = useFormField({
    initialSelectValue: {
      label: countyOfSentencing,
      value: countyOfSentencing,
    },
  });

  const updateDropdownInput = (option?: SelectOption | null) => {
    if (!option) return;

    const county = option.value as string;
    const district = countiesOptions.find(
      (cd) => cd.county === county,
    )?.district;

    setSelectValue(option);
    form.updateForm(COUNTY_KEY, county, isRequired);
    form.updateForm(DISTRICT_KEY, district, isRequired);
  };

  /** Validate previously saved County */
  useEffect(() => {
    form.validate(COUNTY_KEY, caseAttributes?.county, isRequired);
    return () => form.resetErrors();
  }, [caseAttributes, isRequired]);

  return (
    <Styled.InputContainer>
      <Styled.InputLabel>
        County {isRequired && <span>Required*</span>}
      </Styled.InputLabel>
      <Dropdown
        value={selectValue?.value ? selectValue : null}
        options={options}
        onChange={(value) => updateDropdownInput(value as SelectOption)}
        styles={Styled.dropdownStyles}
        isDisabled={caseAttributes.isCountyLocked}
        placeholder="Select a county..."
      />
      {caseAttributes.isCountyLocked && (
        <Styled.InputDescription>
          This county has been pulled in from {omsSystem} and is unable to be
          edited.
        </Styled.InputDescription>
      )}
    </Styled.InputContainer>
  );
}

export default observer(CountyOfSentencingField);
