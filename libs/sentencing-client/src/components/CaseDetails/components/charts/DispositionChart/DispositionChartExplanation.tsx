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

import {
  formatOffenseLabel,
  printFormattedRecordString,
} from "../../../../../../src/utils/utils";
import { CaseInsight } from "../../../../../api";
import { getDescriptionGender } from "../common/utils";
import { LsirScoreText } from "../components/LsirScoreText";
import * as Styled from "../components/Styles";
import { SENTENCE_DISTRIBUTION_TEXT } from "../constants";

interface DispositionChartExplanationProps {
  insight: CaseInsight;
  orgName: string;
}

export function DispositionChartExplanation({
  insight,
  orgName,
}: DispositionChartExplanationProps) {
  const {
    gender,
    assessmentScoreBucketStart,
    assessmentScoreBucketEnd,
    offense,
    dispositionNumRecords,
  } = insight;
  const genderString = getDescriptionGender(gender);
  const genderCohortString = (
    <>
      <span>{genderString}</span>
      <LsirScoreText
        rollupAssessmentScoreBucketStart={assessmentScoreBucketStart}
        rollupAssessmentScoreBucketEnd={assessmentScoreBucketEnd}
      />{" "}
      with <span>{formatOffenseLabel(offense)}</span>
    </>
  );

  const noPreviousRecordCopy = (
    <>
      {SENTENCE_DISTRIBUTION_TEXT} represents the percentage of cases sentenced
      to a particular disposition, using {orgName} data from 2010 to present.
      There are no previous records of {genderCohortString}.
    </>
  );
  const withPreviousRecordsCopy = (
    <>
      {SENTENCE_DISTRIBUTION_TEXT} represents the percentage of cases sentenced
      to a particular disposition. The rates are based on{" "}
      {dispositionNumRecords.toLocaleString()}{" "}
      {printFormattedRecordString(dispositionNumRecords)} of{" "}
      {genderCohortString}, using {orgName} data from 2010 to present.
    </>
  );

  return (
    <Styled.TextContainer>
      <Styled.TextWrapper>
        {dispositionNumRecords ? withPreviousRecordsCopy : noPreviousRecordCopy}
      </Styled.TextWrapper>
    </Styled.TextContainer>
  );
}
