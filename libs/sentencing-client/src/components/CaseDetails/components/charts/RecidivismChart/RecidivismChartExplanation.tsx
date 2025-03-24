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

import moment from "moment";

import { CaseInsight } from "../../../../../api";
import { printFormattedRecordString } from "../../../../../utils/utils";
import ciLegendImg from "../../../../assets/ci-legend.png";
import { RecommendationOptionType } from "../../../Recommendations/constants";
import { INDIVIDUALS_STRING } from "../common/constants";
import { getDescriptionGender } from "../common/utils";
import { LsirScoreText } from "../components/LsirScoreText";
import * as Styled from "../components/Styles";

interface OffenseSpanProps {
  rollupOffenseDescription: string;
}

export function OffenseText({ rollupOffenseDescription }: OffenseSpanProps) {
  return <span>{rollupOffenseDescription}</span>;
}

interface RecidivismChartExplanationProps {
  insight: CaseInsight;
  recommendationOptionType: RecommendationOptionType;
  orgName: string;
  isTooltip?: boolean;
}

export function RecidivismChartExplanation({
  insight,
  recommendationOptionType,
  orgName,
  isTooltip = false,
}: RecidivismChartExplanationProps) {
  const {
    rollupGender,
    rollupOffenseDescription,
    rollupAssessmentScoreBucketStart,
    rollupAssessmentScoreBucketEnd,
    rollupRecidivismNumRecords,
  } = insight;
  const genderString = rollupGender && getDescriptionGender(rollupGender);

  return (
    <Styled.TextContainer>
      <Styled.TextWrapper>
        These recidivism rates represent the percentage of individuals who have
        been incarcerated, re-incarcerated, or been given a new probation
        sentence during the three years immediately after the start of their
        probation sentence or their release into the community. The rates are
        based on {rollupRecidivismNumRecords.toLocaleString()}{" "}
        {printFormattedRecordString(rollupRecidivismNumRecords)} of{" "}
        {genderString === INDIVIDUALS_STRING || !genderString ? (
          INDIVIDUALS_STRING
        ) : (
          <span>{genderString}</span>
        )}
        <LsirScoreText
          rollupAssessmentScoreBucketStart={rollupAssessmentScoreBucketStart}
          rollupAssessmentScoreBucketEnd={rollupAssessmentScoreBucketEnd}
        />{" "}
        with <OffenseText rollupOffenseDescription={rollupOffenseDescription} />
        , using {orgName} data from 2010-{moment().utc().year() - 3}.{" "}
        {isTooltip &&
          `The shaded areas represent the confidence intervals, or the range of
      possible values for the true recidivism rate.`}
      </Styled.TextWrapper>
      {!isTooltip &&
        recommendationOptionType === RecommendationOptionType.SentenceType && (
          <img
            src={ciLegendImg}
            height="68px"
            alt="Confidence Intervals: Shaded areas represent the range of possible values for the true recidivism rate."
          />
        )}
    </Styled.TextContainer>
  );
}
