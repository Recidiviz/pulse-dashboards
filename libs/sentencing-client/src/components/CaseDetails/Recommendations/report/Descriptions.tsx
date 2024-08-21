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

import { Insight } from "../../../../api";
import { Gender } from "../../types";
import * as Styled from "./Report.styles";

function getGenderString(rollupGender: Insight["gender"]) {
  let genderString;
  if (Gender[rollupGender] === Gender.MALE) {
    genderString = "men";
  } else if (Gender[rollupGender] === Gender.FEMALE) {
    genderString = "women";
  } else if (Gender[rollupGender] === Gender.NON_BINARY) {
    genderString = "non-binary people";
  } else if (Gender[rollupGender] === Gender.TRANS) {
    genderString = "trans people";
  } else if (Gender[rollupGender] === Gender.TRANS_FEMALE) {
    genderString = "trans women";
  } else if (Gender[rollupGender] === Gender.TRANS_MALE) {
    genderString = "trans men";
  }

  return ` ${genderString}`;
}

function getRollupGenderString(rollupGender: Insight["rollupGender"]) {
  if (rollupGender === null) {
    return undefined;
  }

  return getGenderString(rollupGender);
}

interface LsirScoreSpanProps {
  rollupAssessmentScoreBucketStart: number | null;
  rollupAssessmentScoreBucketEnd: number | null;
}

function LsirScoreSpan({
  rollupAssessmentScoreBucketStart,
  rollupAssessmentScoreBucketEnd,
}: LsirScoreSpanProps) {
  if (
    rollupAssessmentScoreBucketStart === null ||
    rollupAssessmentScoreBucketStart === -1 ||
    rollupAssessmentScoreBucketEnd === null
  ) {
    return null;
  }

  if (rollupAssessmentScoreBucketEnd === -1) {
    return (
      <span>
        {" "}
        with{" "}
        <Styled.Bold>
          LSI-R scores of at least {rollupAssessmentScoreBucketStart}
        </Styled.Bold>
      </span>
    );
  }

  return (
    <span>
      {" "}
      with{" "}
      <Styled.Bold>
        LSI-R scores between {rollupAssessmentScoreBucketStart} and{" "}
        {rollupAssessmentScoreBucketEnd}
      </Styled.Bold>
    </span>
  );
}

interface OffenseSpanProps {
  rollupOffense: string | undefined;
  rollupNcicCategory: string | null;
  rollupCombinedOffenseCategory: string | null;
  rollupViolentOffense: boolean | null;
}

function OffenseSpan({
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
    <span>
      {" "}
      with <Styled.Bold>{offenseString} convictions</Styled.Bold>
    </span>
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
  } = insight;

  const genderString = getRollupGenderString(rollupGender);

  return (
    <span>
      These recidivism rates represent the percentage of individuals who have
      been convicted of a subsequent offense or violated the conditions of their
      probation or parole over the course of the three years immediately after
      their release into the community. The rates are based on{" "}
      <span>
        <Styled.Bold>{genderString ?? "all people"}</Styled.Bold>
        <LsirScoreSpan
          rollupAssessmentScoreBucketStart={rollupAssessmentScoreBucketStart}
          rollupAssessmentScoreBucketEnd={rollupAssessmentScoreBucketEnd}
        />
        <OffenseSpan
          rollupOffense={rollupOffense}
          rollupNcicCategory={rollupNcicCategory}
          rollupCombinedOffenseCategory={rollupCombinedOffenseCategory}
          rollupViolentOffense={rollupViolentOffense}
        />
      </span>
      . The shaded areas represent the confidence intervals, or the range of
      possible values for the true recidivism rate.
    </span>
  );
}

interface DispositionExplanationProps {
  insight: Insight;
}

export function DispositionExplanation({
  insight,
}: DispositionExplanationProps) {
  const {
    gender,
    assessmentScoreBucketStart,
    assessmentScoreBucketEnd,
    offense,
  } = insight;
  const genderString = getGenderString(gender);

  return (
    <span>
      This information represents the percentage of cases sentenced to
      particular dispositions over the past three years. The rates are based on{" "}
      <span>
        <Styled.Bold>{genderString}</Styled.Bold>
        <LsirScoreSpan
          rollupAssessmentScoreBucketStart={assessmentScoreBucketStart}
          rollupAssessmentScoreBucketEnd={assessmentScoreBucketEnd}
        />{" "}
        with <Styled.Bold>{offense} convictions</Styled.Bold>
      </span>
      .
    </span>
  );
}
