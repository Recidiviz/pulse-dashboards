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

import React from "react";

import { SARInsight } from "../../api";
import {
  convertDecimalToPercentage,
  formatOffenseLabel,
  formatTimeServedPct,
} from "../../utils/utils";
import {
  getDescriptionGender,
  getSentenceLengthBucketLabel,
  sentenceLengthLabelFilter,
} from "../CaseDetails/components/charts/common/utils";
import { getRiskLevelDescription } from "../CaseDetails/components/charts/DispositionChart/sarUtils";
import {
  getAssessmentTypeShortName,
  getOrasRiskLevelScoreRange,
  ORAS_TOOL_KEYS,
} from "../OffenderAssessment/assessmentTypeUtils";
import { RiskLevelKey } from "../OffenderAssessment/constants";

export type InsightDescriptionContext = {
  gender: NonNullable<SARInsight>["gender"];
  riskLevel: RiskLevelKey | null;
  offense: NonNullable<SARInsight>["offense"];
  offenseCategory: NonNullable<SARInsight>["offenseCategory"];
};

/** Renders the bold inline subject segment shared by the full and empty chart states. */
export function InsightSubjectSpans({
  gender,
  riskLevel,
  offense,
  offenseCategory,
}: InsightDescriptionContext) {
  const genderString = getDescriptionGender(gender);
  const offenseDescriptor =
    offenseCategory ?? formatOffenseLabel(offense).replace(/\s*offenses$/i, "");

  // Omit the risk level clause when there's no risk level (e.g. no ORAS assessment).
  if (riskLevel == null) {
    return (
      <>
        <span>{genderString.trim()}</span> with{" "}
        <span>{offenseDescriptor} convictions</span>
      </>
    );
  }

  return (
    <>
      <span>{genderString.trim()}</span> with{" "}
      <span>{getRiskLevelDescription(riskLevel)} scores*</span> with{" "}
      <span>{offenseDescriptor} convictions</span>
    </>
  );
}

/**
 * Builds the footnote string for the Insights panel.
 * e.g. "*These rates are based on 1,234 records of male with moderate scores (0-7 for the ORAS-CST, ...)"
 */
export function buildInsightsFootnoteText(
  numRecords: number,
  gender: NonNullable<SARInsight>["gender"],
  riskLevel: RiskLevelKey | null,
): string {
  const genderString = getDescriptionGender(gender).trim();
  if (riskLevel == null) {
    return `*These rates are based on ${numRecords.toLocaleString()} records of ${genderString}`;
  }
  const rangeFragments = ORAS_TOOL_KEYS.map((tool, i) => {
    const range = getOrasRiskLevelScoreRange(riskLevel, tool, gender);
    const shortName = getAssessmentTypeShortName(tool);
    const prefix = i === ORAS_TOOL_KEYS.length - 1 ? "or " : "";
    return `${prefix}${range} for the ${shortName}`;
  });
  return `*These rates are based on ${numRecords.toLocaleString()} records of ${genderString} with ${getRiskLevelDescription(riskLevel)} scores (${rangeFragments.join(", ")})`;
}

/**
 * Builds the Key Finding paragraph for the time-served section.
 * The most common sentence label, incarceration %, and avg pct served are bolded.
 * e.g. "The most common sentence given for previous, similar cases was probation. Of the 23% of
 *       defendants sentenced to incarceration, on average individuals served 16% of their sentence
 *       in custody before being granted parole."
 * e.g. "The most common sentence given for previous, similar cases was probation." (no time-served data)
 */
export function buildKeyFindingText(
  dispositionData: NonNullable<SARInsight>["dispositionData"],
  avgPctServed?: number | null,
): React.ReactNode {
  if (dispositionData.length === 0) return null;
  const mostCommon = dispositionData.reduce((best, d) =>
    d.percentage > best.percentage ? d : best,
  );

  const mostCommonLabel = getSentenceLengthBucketLabel(
    mostCommon.recommendationType,
    mostCommon.sentenceLengthBucketStart,
    mostCommon.sentenceLengthBucketEnd,
  ).toLowerCase();

  const baseText = (
    <>
      The most common sentence given for previous, similar cases was{" "}
      <strong>{mostCommonLabel}</strong>.
    </>
  );

  if (avgPctServed == null) {
    return baseText;
  }

  const incarcerationPct = dispositionData
    .filter((d) => !sentenceLengthLabelFilter(d))
    .reduce((sum, d) => sum + convertDecimalToPercentage(d.percentage), 0);
  const pct = formatTimeServedPct(avgPctServed);

  return (
    <>
      {baseText} Of the <strong>{incarcerationPct}%</strong> of defendants
      sentenced to incarceration, on average individuals served{" "}
      <strong>{pct}%</strong> of their sentence in custody before being granted
      parole.
    </>
  );
}
