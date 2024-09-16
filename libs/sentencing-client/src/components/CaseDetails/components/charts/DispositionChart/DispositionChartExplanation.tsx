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

import { CaseInsight } from "../../../../../api";
import { getDescriptionGender } from "../common/utils";
import { LsirScoreText } from "../components/LsirScoreText";
import { TextContainer } from "../components/Styles";

interface DispositionChartExplanationProps {
  insight: CaseInsight;
}

export function DispositionChartExplanation({
  insight,
}: DispositionChartExplanationProps) {
  const {
    gender,
    assessmentScoreBucketStart,
    assessmentScoreBucketEnd,
    offense,
  } = insight;
  const genderString = getDescriptionGender(gender);

  return (
    <TextContainer>
      This information represents the percentage of cases sentenced to
      particular dispositions over the past three years. The rates are based on{" "}
      <span>{genderString}</span>
      <LsirScoreText
        rollupAssessmentScoreBucketStart={assessmentScoreBucketStart}
        rollupAssessmentScoreBucketEnd={assessmentScoreBucketEnd}
      />{" "}
      with <span>{offense} convictions</span>.
    </TextContainer>
  );
}
