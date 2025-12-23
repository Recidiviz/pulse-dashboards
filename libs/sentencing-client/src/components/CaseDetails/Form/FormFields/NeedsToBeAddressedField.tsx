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

import { formatPossessiveName } from "../../../../utils/utils";
import { NOT_SURE_YET_OPTION, OTHER_OPTION } from "../../../constants";
import { MultiSelectRadioInput } from "../../../shared/MultiSelectRadioInput";
import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import {
  NEEDS_TO_BE_ADDRESSED_KEY,
  NeedsToBeAddressed,
  OTHER_NEED_TO_BE_ADDRESSED_KEY,
} from "../../constants";
import { PROTECTIVE_FACTORS_NEEDS_LIST_LIMIT } from "../../Recommendations/constants";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
import { useFormField } from "../useFormFields";
import { isSelectionOverLimit, parseNeedsToBeAddressedValue } from "../utils";

const needsToBeAddressedOptions = [
  ...Object.values(NeedsToBeAddressed),
  NOT_SURE_YET_OPTION,
];

function NeedsToBeAddressedField({ isRequired }: FormFieldProps) {
  const { PSIStore } = useStore();
  const caseAttributes = PSIStore.caseAttributes;
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

  const updateOtherTextArea = (value: string) => {
    setOtherInputValue(value);
    form.updateForm(OTHER_NEED_TO_BE_ADDRESSED_KEY, value, isRequired);
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
        helperText={`Select up to ${PROTECTIVE_FACTORS_NEEDS_LIST_LIMIT} that apply for ${caseAttributes.client?.firstName ?? "the defendant"}.`}
        otherValue={otherInputValue}
        onOtherChange={updateOtherTextArea}
        otherPlaceholder="Please specify other need"
      />
    </>
  );
}

export default observer(NeedsToBeAddressedField);
