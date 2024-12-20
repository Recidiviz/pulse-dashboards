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
import { ChangeEvent, useEffect } from "react";

import { useStore } from "../../../StoreProvider/StoreProvider";
import * as Styled from "../../CaseDetails.styles";
import {
  LSIR_SCORE_KEY,
  OFFENSE_KEY,
  SEX_OFFENSE_KEY,
  VIOLENT_OFFENSE_KEY,
} from "../../constants";
import { TextInput } from "../Elements/TextInput";
import { form } from "../FormStore";
import { FormFieldProps } from "../types";
import { useFormField } from "../useFormFields";
import { isValidLsirScore } from "../utils";

function LsirScoreField({ isRequired }: FormFieldProps) {
  const { caseStore } = useStore();
  const caseAttributes = caseStore.caseAttributes;
  const insight = caseStore.insight;
  const prevLsirScore =
    caseAttributes?.lsirScore === null ? "" : String(caseAttributes?.lsirScore);

  const currentOffense =
    form.updates[OFFENSE_KEY] ?? caseStore.caseAttributes?.offense;
  const isCurrentOffenseViolentDefault =
    currentOffense !== undefined &&
    caseStore.offensesByName[currentOffense]?.isViolentOffense;
  const isCurrentOffenseSexualDefault =
    currentOffense !== undefined &&
    caseStore.offensesByName[currentOffense]?.isSexOffense;

  const { inputValue, setInputValue } = useFormField({
    initialInputValue: prevLsirScore,
  });

  const showRollup =
    !form.hasError &&
    inputValue !== "" &&
    insight &&
    insight.rollupOffense !== insight.offense;

  const updateLsirScore = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.trim());
    form.updateForm(
      LSIR_SCORE_KEY,
      e.target.value.trim() ? Number(e.target.value) : null,
      isRequired,
      isValidLsirScore,
    );

    /** Fetches insights when LSI-R score changes to display rollup text under the LSI-R score field  */

    const isCurrentOffenseViolent =
      form.updates[VIOLENT_OFFENSE_KEY] ??
      (caseAttributes?.offense === currentOffense
        ? caseAttributes?.isCurrentOffenseViolent
        : isCurrentOffenseViolentDefault);
    const isCurrentOffenseSexual =
      form.updates[SEX_OFFENSE_KEY] ??
      (caseAttributes?.offense === currentOffense
        ? caseAttributes?.isCurrentOffenseSexual
        : isCurrentOffenseSexualDefault);

    caseStore.getInsight(
      form.updates[OFFENSE_KEY] ?? caseStore.caseAttributes.offense,
      form.hasError ? undefined : Number(e.target.value.trim()),
      isCurrentOffenseSexual,
      isCurrentOffenseViolent,
    );
  };

  /** Validate previously saved LSI-R score */
  useEffect(() => {
    form.validate(LSIR_SCORE_KEY, prevLsirScore, isRequired, isValidLsirScore);
    return () => form.resetErrors();
  }, [prevLsirScore, isRequired]);

  /** Fetch insights on previously saved values */
  useEffect(() => {
    caseStore.getInsight(
      caseStore.caseAttributes.offense,
      caseAttributes?.lsirScore ?? undefined,
      caseAttributes?.isCurrentOffenseSexual ?? isCurrentOffenseSexualDefault,
      caseAttributes?.isCurrentOffenseViolent ?? isCurrentOffenseViolentDefault,
    );
    // We only need to call this once on load to update/clear previously fetched insights
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Styled.InputLabel htmlFor={LSIR_SCORE_KEY}>
        LSI-R Score {isRequired && <span>Required*</span>}
      </Styled.InputLabel>

      <TextInput
        id={LSIR_SCORE_KEY}
        value={inputValue ?? ""}
        onChange={updateLsirScore}
        isDisabled={caseAttributes.isLsirScoreLocked}
      />

      {form.errors[LSIR_SCORE_KEY]?.inputError && (
        <Styled.ErrorMessage>
          Please enter a number between 0 and 54.
        </Styled.ErrorMessage>
      )}

      {!caseAttributes.isLsirScoreLocked && (
        <Styled.InputDescription>
          If this is a File Review or if the LSI-R has not yet been scored,
          enter the most recent risk score for this individual.
        </Styled.InputDescription>
      )}

      {caseAttributes.isLsirScoreLocked && (
        <Styled.InputDescription>
          This score has been pulled in from Atlas and is unable to be edited.
        </Styled.InputDescription>
      )}

      {showRollup && (
        <Styled.RollupOffenseCategory>
          <Styled.InputLabel>Recidivism Cohort</Styled.InputLabel>
          <span>{insight.rollupOffenseDescription}</span>
          <Styled.InputDescription>
            In order to provide recidivism rates based on a sufficient sample
            size, we need to broaden the group of similar cases we use to
            compare this case to. The new cohort may include all genders, risk
            scores, and/or a more general category of offense. A description of
            the cohort is listed above. If you think this categorization is
            inaccurate, reach out to Recidiviz.
          </Styled.InputDescription>
        </Styled.RollupOffenseCategory>
      )}
    </>
  );
}

export default observer(LsirScoreField);
