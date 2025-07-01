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

import { formatPossessiveName } from "../../../../utils/utils";
import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import {
  NEEDS_TO_BE_ADDRESSED_KEY,
  NeedsToBeAddressed,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
} from "../../constants";
import { PROTECTIVE_FACTORS_NEEDS_LIST_LIMIT } from "../../Recommendations/constants";
import { NOT_SURE_YET_OPTION, OTHER_OPTION } from "../constants";
import { MultiSelectRadioInput } from "../Elements/MultiSelectRadioInput";
import { TextArea } from "../Elements/TextArea";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
import { useFormField } from "../useFormFields";
import { isSelectionOverLimit, parseNeedsToBeAddressedValue } from "../utils";

const needsToBeAddressedOptions = [
  ...Object.values(NeedsToBeAddressed),
  NOT_SURE_YET_OPTION,
];

function NeedsToBeAddressedField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const formattedFirstName = formatPossessiveName(
    caseAttributes.client?.firstName,
  );
  const {
    multiInputValues,
    setMultiInputValues,
    otherInputValue,
    setOtherInputValue,
  } = useFormField({
    initialMultiInputValues: parseNeedsToBeAddressedValue(
      caseAttributes.needsToBeAddressed,
    ),
    initialOtherInputValue: caseAttributes.otherNeedToBeAddressed ?? "",
  });

  const showOtherTextField = multiInputValues?.includes(
    NeedsToBeAddressed[OTHER_OPTION],
  );

  const updateSelections = (option: string | null) => {
    if (option === null) return;

    if (
      isSelectionOverLimit(
        multiInputValues,
        option,
        PROTECTIVE_FACTORS_NEEDS_LIST_LIMIT,
      )
    ) {
      return;
    }

    // Clear out Other text field input when "Not Sure Yet" is selected or "Other" option is de-selected
    if (
      option === NOT_SURE_YET_OPTION ||
      (option === NeedsToBeAddressed[OTHER_OPTION] &&
        multiInputValues?.includes(NeedsToBeAddressed[OTHER_OPTION]))
    ) {
      setOtherInputValue("");
      form.updateForm(OTHER_NEED_TO_BE_ADDRESSED_KEY, null);
    }

    if (option === NOT_SURE_YET_OPTION) {
      setMultiInputValues([]);
      form.updateForm(NEEDS_TO_BE_ADDRESSED_KEY, []);
      return;
    }

    const updatedValue = multiInputValues?.includes(option)
      ? multiInputValues.filter((val) => val !== option)
      : [...(multiInputValues ?? []), option];

    setMultiInputValues(updatedValue);
    form.updateForm(NEEDS_TO_BE_ADDRESSED_KEY, updatedValue);
  };

  const updateOtherTextArea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setOtherInputValue(e.target.value);
    form.updateForm(OTHER_NEED_TO_BE_ADDRESSED_KEY, e.target.value, isRequired);
  };

  return (
    <>
      <Styled.InputLabel>
        What are {formattedFirstName} primary needs? Select up to{" "}
        {PROTECTIVE_FACTORS_NEEDS_LIST_LIMIT} that apply.{" "}
        {isRequired && <span>Required*</span>}
      </Styled.InputLabel>

      <MultiSelectRadioInput
        options={needsToBeAddressedOptions}
        selections={multiInputValues ?? []}
        updateSelections={updateSelections}
      />

      {showOtherTextField && (
        <TextArea
          id="needs-other"
          placeholder="Please specify other need"
          value={otherInputValue}
          onChange={updateOtherTextArea}
        />
      )}
    </>
  );
}

export default observer(NeedsToBeAddressedField);
