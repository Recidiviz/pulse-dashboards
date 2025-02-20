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

import { observer } from "mobx-react-lite";

import { titleCase } from "../../../../utils/utils";
import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { CLIENT_COUNTY_KEY, CLIENT_DISTRICT_KEY } from "../../constants";
import { Dropdown } from "../Elements/Dropdown";
import { form } from "../FormStore";
import { FormFieldProps, SelectOption } from "../types";
import { useFormField } from "../useFormFields";
import { getFilteredCountyOptions } from "../utils";

function CountyOfSentencingField({ isRequired }: FormFieldProps) {
  const { caseStore, geoConfig } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const omsSystem = geoConfig.omsSystem;
  const countiesOptions = caseStore.counties;
  const countyOfResidence = titleCase(caseAttributes?.client?.county);
  const options = getFilteredCountyOptions(countiesOptions, {
    county: caseAttributes.client?.county,
    district: caseAttributes.client?.district,
  });

  const { selectValue, setSelectValue } = useFormField({
    initialSelectValue: {
      label: countyOfResidence,
      value: countyOfResidence,
    },
  });

  const updateDropdownInput = (option?: SelectOption | null) => {
    if (!option) return;

    const county = option.value as string;
    const district = countiesOptions.find(
      (cd) => cd.county === county,
    )?.district;

    setSelectValue(option);
    form.updateForm(CLIENT_COUNTY_KEY, county, isRequired);
    form.updateForm(CLIENT_DISTRICT_KEY, district, isRequired);
  };

  return (
    <Styled.InputContainer>
      <Styled.InputLabel>
        County of Residence {isRequired && <span>Required*</span>}
      </Styled.InputLabel>
      <Dropdown
        value={selectValue?.value ? selectValue : null}
        options={options}
        onChange={(value) => updateDropdownInput(value as SelectOption)}
        styles={Styled.dropdownStyles}
        isDisabled={caseAttributes.client?.isCountyLocked}
        placeholder="Select a county..."
      />
      {caseAttributes.client?.isCountyLocked && (
        <Styled.InputDescription>
          This county has been pulled in from {omsSystem} and is unable to be
          edited.
        </Styled.InputDescription>
      )}
    </Styled.InputContainer>
  );
}

export default observer(CountyOfSentencingField);
