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
import { getDescriptionGender } from "../common/utils";
import * as Styled from "../components/Styles";
import { HISTORICAL_PRECEDENT_TEXT } from "../constants";

const BUCKET_TO_RISK_LEVEL: Record<number, string> = {
  0: "low risk",
  1: "moderate risk",
  2: "high risk",
  3: "very high risk",
};

interface SARDispositionChartExplanationProps {
  insight: NonNullable<SARInsight>;
}

export function SARDispositionChartExplanation({
  insight,
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
  const offenseDescriptor =
    offenseCategory ?? formatOffenseLabel(offense).replace(/\s*offenses$/i, "");

  return (
    <Styled.TextContainer>
      <Styled.TextWrapper>
        {HISTORICAL_PRECEDENT_TEXT} represents the percentage of cases sentenced
        to a particular disposition. The rates are based on{" "}
        {dispositionNumRecords.toLocaleString()}{" "}
        {printFormattedRecordString(dispositionNumRecords)} of{" "}
        <span>{genderString.trim()}</span> with <span>{riskLevel} scores*</span>{" "}
        with <span>{offenseDescriptor} convictions</span>, using MODOC data from
        2020-present.
      </Styled.TextWrapper>
    </Styled.TextContainer>
  );
}
