// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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
import { SARInsight } from "../../../../../api";
import {
  AssessmentTypeKey,
  getOrasBucketScoreRange,
} from "../../../../OffenderAssessment/assessmentTypeUtils";
import { getDescriptionGender } from "../common/utils";
import * as Styled from "../components/Styles";
import { HISTORICAL_PRECEDENT_TEXT } from "../constants";

const BUCKET_TO_RISK_LEVEL: Record<number, string> = {
  0: "low risk",
  1: "moderate risk",
  2: "high risk",
  3: "very high risk",
};

const ORAS_ABBREVIATION: Partial<Record<AssessmentTypeKey, string>> = {
  ORAS_CST: "CST",
  ORAS_SRT: "SRT",
  ORAS_PIT: "PIT",
  ORAS_RT: "RT",
};

interface SARDispositionChartExplanationProps {
  insight: NonNullable<SARInsight>;
  assessmentType: AssessmentTypeKey | null;
}

export function SARDispositionChartExplanation({
  insight,
  assessmentType,
}: SARDispositionChartExplanationProps) {
  const {
    gender,
    assessmentScoreBucketStart,
    offense,
    offenseCategory,
    dispositionNumRecords,
  } = insight;

  const genderString = getDescriptionGender(gender);
  const riskLevel =
    BUCKET_TO_RISK_LEVEL[assessmentScoreBucketStart] ?? "unknown risk";
  const orasAbbrev =
    assessmentType !== null ? ORAS_ABBREVIATION[assessmentType] ?? null : null;
  const orasRange =
    assessmentType !== null
      ? getOrasBucketScoreRange(assessmentScoreBucketStart, assessmentType)
      : null;
  const orasLabel =
    orasAbbrev && orasRange ? `ORAS-${orasAbbrev} ${orasRange}` : null;
  const offenseDescriptor = offenseCategory ?? formatOffenseLabel(offense);

  return (
    <Styled.TextContainer>
      <Styled.TextWrapper>
        {HISTORICAL_PRECEDENT_TEXT} represents the percentage of cases sentenced
        to a particular disposition. The rates are based on{" "}
        {dispositionNumRecords.toLocaleString()}{" "}
        {printFormattedRecordString(dispositionNumRecords)} of{" "}
        <span>{genderString.trim()}</span> with{" "}
        <span>
          {riskLevel} scores{orasLabel ? ` (${orasLabel})` : ""}
        </span>{" "}
        with <span>{offenseDescriptor}</span> convictions, using MODOC data from
        2020-present.
      </Styled.TextWrapper>
    </Styled.TextContainer>
  );
}
