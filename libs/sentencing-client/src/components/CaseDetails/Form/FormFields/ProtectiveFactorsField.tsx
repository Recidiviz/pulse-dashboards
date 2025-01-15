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

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import {
  OTHER_PROTECTIVE_FACTORS_KEY,
  PROTECTIVE_FACTORS_KEY,
  ProtectiveFactors,
} from "../../constants";
import { NOT_SURE_YET_OPTION, OTHER_OPTION } from "../constants";
import { MultiSelectRadioInput } from "../Elements/MultiSelectRadioInput";
import { TextArea } from "../Elements/TextArea";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
import { useFormField } from "../useFormFields";
import { parseProtectiveFactorsValue } from "../utils";

const protectiveFactorsOptions = [
  ...Object.values(ProtectiveFactors),
  NOT_SURE_YET_OPTION,
];

function ProtectiveFactorsField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const firstName = caseAttributes.client?.firstName;
  const {
    multiInputValues,
    setMultiInputValues,
    otherInputValue,
    setOtherInputValue,
  } = useFormField({
    initialMultiInputValues: parseProtectiveFactorsValue(
      caseAttributes.protectiveFactors,
    ),
    initialOtherInputValue: caseAttributes.otherProtectiveFactor ?? "",
  });

  const showOtherTextField = multiInputValues?.includes(
    ProtectiveFactors[OTHER_OPTION],
  );

  const updateSelections = (option: string | null) => {
    if (option === null) return;
    // Clear out Other text field input when "Not Sure Yet" is selected or "Other" option is de-selected
    if (
      option === NOT_SURE_YET_OPTION ||
      (option === ProtectiveFactors[OTHER_OPTION] &&
        multiInputValues?.includes(ProtectiveFactors[OTHER_OPTION]))
    ) {
      setOtherInputValue("");
      form.updateForm(OTHER_PROTECTIVE_FACTORS_KEY, null);
    }

    if (option === NOT_SURE_YET_OPTION) {
      setMultiInputValues([]);
      form.updateForm(PROTECTIVE_FACTORS_KEY, []);
      return;
    }

    const updatedValue = multiInputValues?.includes(option)
      ? multiInputValues.filter((val) => val !== option)
      : [...(multiInputValues ?? []), option];

    setMultiInputValues(updatedValue);
    form.updateForm(PROTECTIVE_FACTORS_KEY, updatedValue);
  };

  const updateOtherTextArea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOtherInputValue(e.target.value);
    form.updateForm(OTHER_PROTECTIVE_FACTORS_KEY, e.target.value, isRequired);
  };

  return (
    <>
      <Styled.InputLabel>
        Which protective factors describe {firstName}? Select all that apply.{" "}
        {isRequired && <span>Required*</span>}
      </Styled.InputLabel>

      <MultiSelectRadioInput
        options={protectiveFactorsOptions}
        selections={multiInputValues ?? []}
        updateSelections={updateSelections}
      />

      {showOtherTextField && (
        <TextArea
          id="protective-factors-other"
          placeholder="Please specify other protective factor"
          value={otherInputValue}
          onChange={updateOtherTextArea}
        />
      )}
    </>
  );
}

export default observer(ProtectiveFactorsField);
