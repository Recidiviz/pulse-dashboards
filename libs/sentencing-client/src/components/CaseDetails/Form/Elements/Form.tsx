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
import { useState } from "react";

import * as Styled from "../../CaseDetails.styles";
import { getOffenseName } from "../../components/charts/RecidivismPlot/RecidivismPlotExplanation";
import {
  CURRENT_OFFENSE_SEXUAL_KEY,
  CURRENT_OFFENSE_VIOLENT_KEY,
  LSIR_SCORE_KEY,
  OFFENSE_KEY,
} from "../../constants";
import { FormFieldList } from "../../types";
import { CaseDetailsForm } from "../CaseDetailsForm";
import { FormField } from "./FormField";

type FormProps = {
  form: CaseDetailsForm;
  formFields: FormFieldList;
};

// eslint-disable-next-line react/display-name
export const Form: React.FC<FormProps> = observer(({ form, formFields }) => {
  const [isViolentOffense, setIsViolentOffense] = useState(
    Boolean(form.caseAttributes.isCurrentOffenseViolent),
  );
  const [isSexOffense, setIsSexOffense] = useState(
    Boolean(form.caseAttributes.isCurrentOffenseSexual),
  );

  const rollupOffenseName = getOffenseName({
    rollupCombinedOffenseCategory:
      form.insight?.rollupCombinedOffenseCategory ?? null,
    rollupNcicCategory: form.insight?.rollupNcicCategory ?? null,
    rollupOffense: form.insight?.rollupOffense?.name,
  });

  const handleViolentSexualOffenseSelection = (
    key: typeof CURRENT_OFFENSE_VIOLENT_KEY | typeof CURRENT_OFFENSE_SEXUAL_KEY,
  ) => {
    if (key === CURRENT_OFFENSE_VIOLENT_KEY) {
      setIsViolentOffense(!isViolentOffense);
      form.updateForm(
        CURRENT_OFFENSE_VIOLENT_KEY,
        !isViolentOffense,
        undefined,
        false,
        true,
      );
    } else if (key === CURRENT_OFFENSE_SEXUAL_KEY) {
      setIsSexOffense(!isSexOffense);
      form.updateForm(
        CURRENT_OFFENSE_SEXUAL_KEY,
        !isSexOffense,
        undefined,
        false,
        true,
      );
    }
  };

  return (
    <Styled.Form>
      {formFields.map((element) => {
        if (!element) return;
        const showNestedFields = Array.isArray(element.value)
          ? element.value.some((val) =>
              element.showNestedValuesMatch?.includes(val),
            )
          : element.showNestedValuesMatch?.includes(String(element.value));

        return (
          <Styled.InputWrapper key={element.key}>
            <FormField element={element} form={form} />

            {/* Violent/Sex Offense Fields */}
            {element.key === OFFENSE_KEY && element.value && (
              <Styled.ViolentOrSexOffenseCheckboxContainer>
                <Styled.CheckboxWrapper>
                  <label htmlFor="is_violent_offense">Violent Offense</label>
                  <input
                    id="is_violent_offense"
                    type="checkbox"
                    checked={isViolentOffense}
                    onChange={() =>
                      handleViolentSexualOffenseSelection(
                        CURRENT_OFFENSE_VIOLENT_KEY,
                      )
                    }
                  />
                </Styled.CheckboxWrapper>
                <Styled.CheckboxWrapper>
                  <label htmlFor="is_sex_offense">Sex Offense</label>
                  <input
                    id="is_sex_offense"
                    type="checkbox"
                    checked={isSexOffense}
                    onChange={() =>
                      handleViolentSexualOffenseSelection(
                        CURRENT_OFFENSE_SEXUAL_KEY,
                      )
                    }
                  />
                </Styled.CheckboxWrapper>
              </Styled.ViolentOrSexOffenseCheckboxContainer>
            )}

            {element.nested &&
              showNestedFields &&
              element.nested.map((nestedElement) => (
                <Styled.NestedWrapper key={nestedElement.key}>
                  <FormField
                    element={nestedElement}
                    form={form}
                    parentKey={element.key}
                  />
                </Styled.NestedWrapper>
              ))}

            {element.key === LSIR_SCORE_KEY &&
              form.insight &&
              rollupOffenseName !== form.insight.offense.name && (
                <Styled.RollupOffenseCategory>
                  <Styled.InputLabel>Recidivism Cohort</Styled.InputLabel>
                  <span>{rollupOffenseName}</span>
                  <Styled.InputDescription>
                    In order to provide recidivism rates based on a sufficient
                    sample size, we need to broaden the group of similar cases
                    we use to compare this case to. The new cohort may include
                    all genders, risk scores, and/or a more general category of
                    offense. A description of the cohort is listed above. If you
                    think this categorization is inaccurate, reach out to
                    Recidiviz.
                  </Styled.InputDescription>
                </Styled.RollupOffenseCategory>
              )}
          </Styled.InputWrapper>
        );
      })}
    </Styled.Form>
  );
});
