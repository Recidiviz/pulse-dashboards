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

import {
  formatOffenseLabel,
  printFormattedRecordString,
} from "../../../../../../src/utils/utils";
import { CaseInsight } from "../../../../../api";
import ciLegendImg from "../../../../assets/ci-legend.png";
import { INDIVIDUALS_STRING } from "../common/constants";
import { getDescriptionGender } from "../common/utils";
import { LsirScoreText } from "../components/LsirScoreText";
import * as Styled from "../components/Styles";

interface OffenseSpanProps {
  rollupOffense: string | undefined;
  rollupNcicCategory: string | null;
  rollupCombinedOffenseCategory: string | null;
  rollupViolentOffense: boolean | null;
}

export function getOffenseName({
  rollupOffense,
  rollupNcicCategory,
  rollupCombinedOffenseCategory,
}: Omit<OffenseSpanProps, "rollupViolentOffense">) {
  return rollupOffense || rollupCombinedOffenseCategory || rollupNcicCategory;
}

export function OffenseText({
  rollupOffense,
  rollupNcicCategory,
  rollupCombinedOffenseCategory,
  rollupViolentOffense,
}: OffenseSpanProps) {
  const offenseString =
    getOffenseName({
      rollupOffense,
      rollupNcicCategory,
      rollupCombinedOffenseCategory,
    }) ||
    (rollupViolentOffense === true ? "violent" : null) ||
    (rollupViolentOffense === false ? "non-violent" : null);

  return offenseString ? (
    <span>{formatOffenseLabel(offenseString)}</span>
  ) : null;
}

interface RecidivismPlotExplanationProps {
  insight: CaseInsight;
  isTooltip?: boolean;
}

export function RecidivismPlotExplanation({
  insight,
  isTooltip = false,
}: RecidivismPlotExplanationProps) {
  const {
    rollupGender,
    rollupOffense,
    rollupNcicCategory,
    rollupCombinedOffenseCategory,
    rollupViolentOffense,
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
        with{" "}
        <OffenseText
          rollupOffense={rollupOffense}
          rollupNcicCategory={rollupNcicCategory}
          rollupCombinedOffenseCategory={rollupCombinedOffenseCategory}
          rollupViolentOffense={rollupViolentOffense}
        />
        , using IDOC data from 2010-{moment().utc().year() - 3}.{" "}
        {isTooltip &&
          `The shaded areas represent the confidence intervals, or the range of
      possible values for the true recidivism rate.`}
      </Styled.TextWrapper>
      {!isTooltip && (
        <img
          src={ciLegendImg}
          height="68px"
          alt="Confidence Intervals: Shaded areas represent the range of possible values for the true recidivism rate."
        />
      )}
    </Styled.TextContainer>
  );
}
