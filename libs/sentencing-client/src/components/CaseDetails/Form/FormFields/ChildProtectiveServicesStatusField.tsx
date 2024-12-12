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
import { HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY } from "../../constants";
import { yesNoUnsureOptions } from "../constants";
import { RadioInput } from "../Elements/RadioInput";
import { form } from "../FormStore";
import { useFormField } from "../useFormFields";
import { parseBooleanValue } from "../utils";

function ChildProtectiveServicesStatusField() {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;

  const { inputValue, setInputValue } = useFormField({
    initialInputValue: parseBooleanValue(
      caseAttributes.hasOpenChildProtectiveServicesCase,
    ),
  });

  const updateSelection = (option: string) => {
    setInputValue(option);
    form.updateForm(HAS_OPEN_CHILD_PROTECTIVE_SERVICES_CASE_KEY, option);
  };

  return (
    <>
      <Styled.InputLabel>
        Has an open child protective services case
      </Styled.InputLabel>

      <RadioInput
        options={yesNoUnsureOptions}
        selection={inputValue}
        updateSelection={updateSelection}
      />
    </>
  );
}

export default observer(ChildProtectiveServicesStatusField);
