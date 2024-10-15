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

import * as Styled from "../../CaseDetails.styles";
import { getOffenseName } from "../../components/charts/RecidivismPlot/RecidivismPlotExplanation";
import { LSIR_SCORE_KEY } from "../../constants";
import { FormFieldList } from "../../types";
import { CaseDetailsForm } from "../CaseDetailsForm";
import { FormField } from "./FormField";

type FormProps = {
  form: CaseDetailsForm;
  formFields: FormFieldList;
};

// eslint-disable-next-line react/display-name
export const Form: React.FC<FormProps> = observer(({ form, formFields }) => {
  const rollupOffenseName = getOffenseName({
    rollupCombinedOffenseCategory:
      form.insight?.rollupCombinedOffenseCategory ?? null,
    rollupNcicCategory: form.insight?.rollupNcicCategory ?? null,
    rollupOffense: form.insight?.rollupOffense?.name,
  });

  return (
    <Styled.Form>
      {formFields.map((element) => {
        if (!element) return;
        const showNestedFields = Array.isArray(element.value)
          ? element.value.some((val) =>
              element.showNestedValuesMatch?.includes(val),
            )
          : element.showNestedValuesMatch?.includes(String(element.value));
        // const currentOffense =
        //   element.key === OFFENSE_KEY && element.value
        //     ? // Narrows the `element.value` to a string type, as we expect the "offense" value to be a valid string and confirmed to be defined at this stage.
        //       form.offensesByName[String(element.value)]
        //     : null;
        return (
          <Styled.InputWrapper key={element.key}>
            <FormField element={element} form={form} />

            {/* Violent/Sex Offense Fields */}
            {/* {element.key === OFFENSE_KEY && element.value && (
              <Styled.ViolentOrSexOffenseCheckboxContainer>
                <Styled.CheckboxWrapper>
                  <label htmlFor="is_violent_offense">Violent Offense</label>
                  <input
                    id="is_violent_offense"
                    type="checkbox"
                    checked={Boolean(currentOffense?.isViolentOffense)}
                    // Placeholder for saving functionality; to be implemented once the backend write path is available
                    onChange={() => null}
                  />
                </Styled.CheckboxWrapper>
                <Styled.CheckboxWrapper>
                  <label htmlFor="is_sex_offense">Sex Offense</label>
                  <input
                    id="is_sex_offense"
                    type="checkbox"
                    checked={Boolean(currentOffense?.isSexOffense)}
                    // Placeholder for saving functionality; to be implemented once the backend write path is available
                    onChange={() => null}
                  />
                </Styled.CheckboxWrapper>
              </Styled.ViolentOrSexOffenseCheckboxContainer>
            )} */}

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
