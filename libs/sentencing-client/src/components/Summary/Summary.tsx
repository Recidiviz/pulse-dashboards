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

import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { formatDisplayDate, formatJudgeAndDivision } from "../../utils/utils";
import DownloadIcon from "../assets/download-icon.svg?react";
import { NeedsToBeAddressed, ProtectiveFactors } from "../constants";
import { mapEnumKeysToDisplay } from "../KeyConsiderations/utils";
import {
  calculateRiskLevel,
  RISK_LEVELS,
} from "../OffenderAssessment/constants";
import { getDomainsForAssessmentType } from "../OffenderAssessment/utils";
import * as Styled from "./Summary.styles";

const NONE_LISTED = "None listed";

const SummaryOffenseCard: React.FC<{
  charge: SARDetailsPresenter["charges"][number];
}> = ({ charge }) => {
  const judgeAndDivision = formatJudgeAndDivision(charge);

  return (
    <Styled.OffenseCardContainer>
      <Styled.OffenseColumn>
        <Styled.OffenseColumnTitle>
          Offense Information
        </Styled.OffenseColumnTitle>
        <div>Offense: {charge.offense || "—"}</div>
        <div>Class: {charge.felonyClass || "—"}</div>
      </Styled.OffenseColumn>

      <Styled.OffenseColumn>
        <Styled.OffenseColumnTitle>Case Information</Styled.OffenseColumnTitle>
        <div>Case Number: {charge.causeNum || "—"}</div>
        <div>Judge/ Division: {judgeAndDivision || "—"}</div>
        <div>Prosecuting Attorney: {charge.prosecutingAttorney || "—"}</div>
        <div>Defense Attorney: {charge.defenseAttorney || "—"}</div>
        <div>Plea Agreement: {charge.pleaAgreement || "—"}</div>
        <div>
          Date of Plea/ Finding of Guilt: {formatDisplayDate(charge.pleaDate)}
        </div>
        <div>
          Date of Sentencing: {formatDisplayDate(charge.sentencingDate)}
        </div>
      </Styled.OffenseColumn>
    </Styled.OffenseCardContainer>
  );
};

interface SummaryProps {
  presenter: SARDetailsPresenter;
}

export const Summary: React.FC<SummaryProps> = observer(function Summary({
  presenter,
}) {
  const {
    charges,
    formattedBirthDate,
    formattedGender,
    defendantStatementSkipped,
    victimImpactStatementSkipped,
    recommendationSkipped,
    needsSkipped,
    factorsSkipped,
  } = presenter;

  const sarData = presenter.SARData;

  // Needs and Mitigation display
  const needsDisplay =
    needsSkipped || !sarData?.needsToBeAddressed?.length
      ? NONE_LISTED
      : mapEnumKeysToDisplay(
          NeedsToBeAddressed,
          sarData.needsToBeAddressed,
        ).join(", ");

  const mitigationDisplay =
    factorsSkipped || !sarData?.mitigatingFactors?.length
      ? NONE_LISTED
      : mapEnumKeysToDisplay(ProtectiveFactors, sarData.mitigatingFactors).join(
          ", ",
        );

  // Defendant's Version display
  const defendantVersionDisplay = defendantStatementSkipped
    ? NONE_LISTED
    : sarData?.defendantStatement || NONE_LISTED;

  // Victim Impact display
  const victimImpactDisplay = victimImpactStatementSkipped
    ? NONE_LISTED
    : sarData?.victimImpactStatement || NONE_LISTED;

  // Offender Assessment summary — group domains by risk level
  const domains = getDomainsForAssessmentType(sarData?.assessmentType ?? null);
  const groupedByRisk: Record<keyof typeof RISK_LEVELS, string[]> = {
    HIGH: [],
    MODERATE: [],
    LOW: [],
  };

  domains.forEach((domain) => {
    const score = sarData?.[domain.scoreField as keyof typeof sarData];
    if (typeof score === "number") {
      const level = calculateRiskLevel(score);
      groupedByRisk[level].push(domain.title);
    }
  });

  const offenderAssessmentParts: string[] = [];
  (["HIGH", "MODERATE", "LOW"] as const).forEach((level) => {
    if (groupedByRisk[level].length > 0) {
      offenderAssessmentParts.push(
        `${RISK_LEVELS[level].toLowerCase()} in ${groupedByRisk[level].join(", ")}`,
      );
    }
  });
  const offenderAssessmentDisplay =
    offenderAssessmentParts.length > 0
      ? `Offender scored ${offenderAssessmentParts.join(" and ")}.`
      : NONE_LISTED;

  // Recommendation display
  const communityDisplay = recommendationSkipped
    ? NONE_LISTED
    : sarData?.communityStrategyRecommendation || NONE_LISTED;
  const homePlanDisplay = recommendationSkipped
    ? NONE_LISTED
    : sarData?.homePlan || NONE_LISTED;
  const institutionalDisplay = recommendationSkipped
    ? NONE_LISTED
    : sarData?.institutionalStrategyRecommendation || NONE_LISTED;

  return (
    <Styled.Container>
      {/* Download header */}
      <Styled.DownloadHeader>
        <Styled.DownloadHeaderText>
          <Styled.DownloadTitle>Download SAR</Styled.DownloadTitle>
          <Styled.DownloadSubtitle>
            Clicking &ldquo;Download&rdquo; will generate a PDF report.
          </Styled.DownloadSubtitle>
        </Styled.DownloadHeaderText>
        <Styled.DownloadButton aria-label="Download SAR report">
          <DownloadIcon />
          Download
        </Styled.DownloadButton>
      </Styled.DownloadHeader>
      {/* Case Information */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Case Information</Styled.SectionTitle>
        <Styled.SectionBody>
          <div>Date of Birth: {formattedBirthDate || "—"}</div>
          <div>Gender: {formattedGender || "—"}</div>
        </Styled.SectionBody>
      </Styled.SectionCard>

      {/* Offense cards - one per charge */}
      {charges.map((charge) => (
        <SummaryOffenseCard key={charge.id} charge={charge} />
      ))}

      {/* Key Considerations */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Key Considerations</Styled.SectionTitle>
        <Styled.SectionBody>
          <div>Needs: {needsDisplay}</div>
          <div>Mitigation: {mitigationDisplay}</div>
        </Styled.SectionBody>
      </Styled.SectionCard>

      {/* Defendant's Version */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Defendant&apos;s Version</Styled.SectionTitle>
        <Styled.SectionBody>{defendantVersionDisplay}</Styled.SectionBody>
      </Styled.SectionCard>

      {/* Victim Impact */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Victim Impact</Styled.SectionTitle>
        <Styled.SectionBody>{victimImpactDisplay}</Styled.SectionBody>
      </Styled.SectionCard>

      {/* Offender Assessment */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Offender Assessment</Styled.SectionTitle>
        <Styled.SectionBody>{offenderAssessmentDisplay}</Styled.SectionBody>
      </Styled.SectionCard>

      {/* Recommendation */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Recommendation</Styled.SectionTitle>
        <Styled.RecommendationSection>
          <Styled.RecommendationLabel>
            Community Strategy
          </Styled.RecommendationLabel>
          <Styled.SectionBody>{communityDisplay}</Styled.SectionBody>
          <Styled.RecommendationLabel>Home Plan</Styled.RecommendationLabel>
          <Styled.SectionBody>{homePlanDisplay}</Styled.SectionBody>
          <Styled.RecommendationLabel>
            Institutional Strategy
          </Styled.RecommendationLabel>
          <Styled.SectionBody>{institutionalDisplay}</Styled.SectionBody>
        </Styled.RecommendationSection>
      </Styled.SectionCard>
    </Styled.Container>
  );
});
