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

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import { PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY } from "../../constants";
import { YES_OPTION, yesNoUnsureOptions } from "../constants";
import { RadioInput } from "../Elements/RadioInput";
import { form } from "../FormStore";
import { useFormField } from "../useFormFields";
import { parseBooleanValue } from "../utils";
import PriorFelonyConvictionField from "./PriorFelonyConvictionField";
import PriorSexOffenseConvictionField from "./PriorSexOffenseConvictionField";
import PriorTreatmentCourtField from "./PriorTreatmentCourtField";
import PriorViolentOffenseConvictionField from "./PriorViolentOffenseConvictionField";

function PriorIncarcerationOrSupervisionField() {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;

  const { inputValue, setInputValue } = useFormField({
    initialInputValue: parseBooleanValue(
      caseAttributes?.previouslyIncarceratedOrUnderSupervision,
    ),
  });
  const showNestedFields = inputValue === YES_OPTION;

  const updateSelection = (option: string) => {
    setInputValue(option);
    form.updateForm(PREVIOUSLY_INCARCERATED_OR_UNDER_SUPERVISION_KEY, option);
  };

  return (
    <>
      <Styled.InputLabel>
        Has a prior history of supervision/incarceration
      </Styled.InputLabel>

      <RadioInput
        options={yesNoUnsureOptions}
        selection={inputValue}
        updateSelection={updateSelection}
      />

      {showNestedFields && (
        <Styled.NestedWrapper>
          <PriorFelonyConvictionField />
          <PriorViolentOffenseConvictionField />
          <PriorSexOffenseConvictionField />
          <PriorTreatmentCourtField />
        </Styled.NestedWrapper>
      )}
    </>
  );
}

export default observer(PriorIncarcerationOrSupervisionField);