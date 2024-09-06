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

import { Insight } from "../../../../../api";
import { getDescriptionGender } from "../common/utils";
import { LsirScoreText } from "../components/LsirScoreText";
import { TextContainer } from "../components/Styles";
import { stateCodeToStateName } from "./utils";

function getRollupGenderString(rollupGender: Insight["rollupGender"]) {
  if (rollupGender === null) {
    return undefined;
  }

  return getDescriptionGender(rollupGender);
}

interface OffenseSpanProps {
  rollupOffense: string | undefined;
  rollupNcicCategory: string | null;
  rollupCombinedOffenseCategory: string | null;
  rollupViolentOffense: boolean | null;
}

function OffenseText({
  rollupOffense,
  rollupNcicCategory,
  rollupCombinedOffenseCategory,
  rollupViolentOffense,
}: OffenseSpanProps) {
  const offenseString =
    rollupOffense ||
    rollupCombinedOffenseCategory ||
    rollupNcicCategory ||
    (rollupViolentOffense === true ? "violent" : null) ||
    (rollupViolentOffense === false ? "non-violent" : null);

  return offenseString ? (
    <>
      {" "}
      with <span>{offenseString} convictions</span>
    </>
  ) : null;
}

interface RecidivismPlotExplanationProps {
  insight: Insight;
}

export function RecidivismPlotExplanation({
  insight,
}: RecidivismPlotExplanationProps) {
  const {
    rollupGender,
    rollupAssessmentScoreBucketStart,
    rollupAssessmentScoreBucketEnd,
    rollupOffense,
    rollupNcicCategory,
    rollupCombinedOffenseCategory,
    rollupViolentOffense,
    rollupStateCode,
  } = insight;

  const genderString = getRollupGenderString(rollupGender);

  return (
    <TextContainer>
      These recidivism rates represent the percentage of individuals who have
      been convicted of a subsequent offense or violated the conditions of their
      probation or parole over the course of the three years immediately after
      their release into the community. The rates are based on{" "}
      <span>
        <span>
          {genderString ??
            `all cases in ${stateCodeToStateName(rollupStateCode)}`}
        </span>
        <LsirScoreText
          rollupAssessmentScoreBucketStart={rollupAssessmentScoreBucketStart}
          rollupAssessmentScoreBucketEnd={rollupAssessmentScoreBucketEnd}
        />
        <OffenseText
          rollupOffense={rollupOffense}
          rollupNcicCategory={rollupNcicCategory}
          rollupCombinedOffenseCategory={rollupCombinedOffenseCategory}
          rollupViolentOffense={rollupViolentOffense}
        />
      </span>
      . The shaded areas represent the confidence intervals, or the range of
      possible values for the true recidivism rate.
    </TextContainer>
  );
}
