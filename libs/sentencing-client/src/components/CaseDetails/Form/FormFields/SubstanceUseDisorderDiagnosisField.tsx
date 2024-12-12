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
import {
  ASAM_CARE_RECOMMENDATION_KEY,
  SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY,
} from "../../constants";
import {
  MILD_OPTION,
  MODERATE_OPTION,
  NONE_OPTION,
  NOT_SURE_YET_OPTION,
  SEVERE_OPTION,
  substanceUseDisorderDiagnosisOptions,
} from "../constants";
import { RadioInput } from "../Elements/RadioInput";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
import { useFormField } from "../useFormFields";

function SubstanceUseDisorderDiagnosisField({ nestedFields }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;

  const { inputValue, setInputValue } = useFormField({
    initialInputValue: caseAttributes?.substanceUseDisorderDiagnosis,
  });

  const showASAMCareRecommendationDropdown = [
    MILD_OPTION,
    MODERATE_OPTION,
    SEVERE_OPTION,
  ].includes(inputValue ?? "");

  const updateSelection = (option: string) => {
    setInputValue(option);
    form.updateForm(SUBSTANCE_USER_DISORDER_DIAGNOSIS_KEY, option);

    if (option === NONE_OPTION || option === NOT_SURE_YET_OPTION) {
      form.updateForm(ASAM_CARE_RECOMMENDATION_KEY, null);
    }
  };

  return (
    <>
      <Styled.InputLabel>Substance use disorder diagnosis</Styled.InputLabel>

      <RadioInput
        options={substanceUseDisorderDiagnosisOptions}
        selection={inputValue}
        updateSelection={updateSelection}
      />

      {showASAMCareRecommendationDropdown && (
        <Styled.NestedWrapper>
          {nestedFields?.map(({ FieldComponent }) => <FieldComponent />)}
        </Styled.NestedWrapper>
      )}
    </>
  );
}

export default observer(SubstanceUseDisorderDiagnosisField);
