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
import { PLEA_KEY } from "../../constants";
import { NOT_SURE_YET_OPTION, pleas } from "../constants";
import { RadioInput } from "../Elements/RadioInput";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
import { useFormField } from "../useFormFields";
import { parsePleaValue } from "../utils";

const pleaOptions = [...Object.values(pleas), NOT_SURE_YET_OPTION];

function PleaStatusField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;

  const { inputValue, setInputValue } = useFormField({
    initialInputValue: parsePleaValue(caseAttributes?.plea),
  });

  const updateSelection = (option: string) => {
    setInputValue(option);
    form.updateForm(PLEA_KEY, option, isRequired);
  };

  return (
    <>
      <Styled.InputLabel>
        Plea {isRequired && <span>Required*</span>}
      </Styled.InputLabel>

      <RadioInput
        options={pleaOptions}
        selection={inputValue}
        updateSelection={updateSelection}
      />
    </>
  );
}

export default observer(PleaStatusField);
