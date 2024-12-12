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
import { ChangeEvent } from "react";
import { MultiValue } from "react-select";

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import {
  MENTAL_HEALTH_DIAGNOSES_KEY,
  OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY,
} from "../../constants";
import { FormValue } from "../../types";
import { mentalHealthDiagnoses, NONE_OPTION, OTHER_OPTION } from "../constants";
import { Dropdown } from "../Elements/Dropdown";
import { TextArea } from "../Elements/TextArea";
import { form } from "../FormStore";
import { SelectOption } from "../types";
import { useFormField } from "../useFormFields";
import { parseMentalHealthDiagnosesValue } from "../utils";

function MentalHealthDiagnosisField() {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const options = Object.values(mentalHealthDiagnoses).map((diagnosis) => ({
    label: diagnosis,
    value: diagnosis,
  }));
  const prevValues = parseMentalHealthDiagnosesValue(
    caseAttributes?.mentalHealthDiagnoses,
  )?.map((diagnosis) => ({
    label: diagnosis,
    value: diagnosis,
  }));

  const {
    multiSelectValues,
    setMultiSelectValues,
    otherInputValue,
    setOtherInputValue,
  } = useFormField({
    initialMultiSelectValues: prevValues,
    initialOtherInputValue: caseAttributes.otherMentalHealthDiagnosis ?? "",
  });

  const showOtherTextField = multiSelectValues?.some(
    (diagnosis) => diagnosis.value === mentalHealthDiagnoses[OTHER_OPTION],
  );

  const updateDropdownInput = (options: MultiValue<SelectOption>) => {
    if (!options) return;

    /**
     * Note: there is special handling when selecting the "None" option.
     *  - If there are existing non-"None" selections, and a user selects "None",
     *    then all other selections are cleared except for "None".
     *  - If "None" is the existing selection and a user selects another option,
     *    then the "None" selection is removed.
     */

    const hasNoneOption = options.find(
      (option: SelectOption) => option.value === NONE_OPTION,
    );
    /**
     * "None" as the first option means that the "None" selection already existed
     * before an attempt to add a new item to the list.
     */
    const hasNoneAsFirstOption =
      options.length > 1 && options[0]?.value === NONE_OPTION;

    if (
      (hasNoneOption && !hasNoneAsFirstOption) ||
      (multiSelectValues?.some(
        (option) => option.value === mentalHealthDiagnoses[OTHER_OPTION],
      ) &&
        !options.some(
          (option) => option.value === mentalHealthDiagnoses[OTHER_OPTION],
        ))
    ) {
      setOtherInputValue("");
      form.updateForm(OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY, null);
    }
    if (hasNoneOption && !hasNoneAsFirstOption) {
      // Clears out all other pre-selected options except for "None"
      setMultiSelectValues([{ label: NONE_OPTION, value: NONE_OPTION }]);
      form.updateForm(MENTAL_HEALTH_DIAGNOSES_KEY, [NONE_OPTION]);
      return;
    }

    // Filter out the "None" option
    const filteredOptions = options.filter(
      (item) => item.value !== NONE_OPTION,
    );
    setMultiSelectValues(filteredOptions);
    form.updateForm(
      MENTAL_HEALTH_DIAGNOSES_KEY,
      filteredOptions.map((selection) => selection.value) as FormValue,
    );
  };

  const updateOtherTextArea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOtherInputValue(e.target.value);
    form.updateForm(OTHER_MENTAL_HEALTH_DIAGNOSIS_KEY, e.target.value);
  };

  return (
    <>
      <Styled.InputLabel>Mental health diagnoses</Styled.InputLabel>

      <Dropdown
        value={multiSelectValues}
        options={options}
        onChange={(value) => updateDropdownInput(value as SelectOption[])}
        styles={Styled.multiDropdownStyles}
        isMulti
      />

      {showOtherTextField && (
        <TextArea
          id="mental-health-diagnosis-other"
          placeholder="Please specify other diagnosis"
          value={otherInputValue}
          onChange={updateOtherTextArea}
        />
      )}
    </>
  );
}

export default observer(MentalHealthDiagnosisField);
