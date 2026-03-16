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
import { RISK_LEVELS, RiskLevelKey } from "../OffenderAssessment/constants";
import { getDomainsForAssessmentType } from "../OffenderAssessment/utils";
import { SARSection } from "../SARDetails/constants";
import { MissingBadge } from "./MissingBadge";
import * as Styled from "./Summary.styles";

const NONE_LISTED = "None listed";

/** Renders a field value or <MissingBadge /> when empty */
const FieldOrMissing: React.FC<{
  label: string;
  value: string | null | undefined;
}> = ({ label, value }) => (
  <Styled.InlineRow>
    {label}: {value || <MissingBadge />}
  </Styled.InlineRow>
);

const SummaryOffenseCard: React.FC<{
  charge: SARDetailsPresenter["charges"][number];
  presenter: SARDetailsPresenter;
}> = ({ charge, presenter }) => {
  const judgeAndDivision = formatJudgeAndDivision(charge);
  const isComplete = presenter.isChargeComplete(charge);

  return (
    <Styled.OffenseCardContainer>
      <Styled.OffenseColumn>
        <Styled.OffenseColumnTitle>
          Offense Information
        </Styled.OffenseColumnTitle>
        <div>Offense: {charge.offense || "—"}</div>
        <div>
          Class:{" "}
          {charge.classificationType
            ? `${charge.classificationType}${charge.classificationSubtype ? ` - ${charge.classificationSubtype}` : ""}`
            : "—"}
        </div>
      </Styled.OffenseColumn>

      <Styled.OffenseColumn>
        <Styled.OffenseColumnTitle>Case Information</Styled.OffenseColumnTitle>
        <div>Case Number: {charge.causeNum || "—"}</div>
        <div>Judge/ Division: {judgeAndDivision || "—"}</div>
        {isComplete ? (
          <>
            <div>Prosecuting Attorney: {charge.prosecutingAttorney || "—"}</div>
            <div>Defense Attorney: {charge.defenseAttorney || "—"}</div>
            <div>Plea Agreement: {charge.pleaAgreement || "—"}</div>
            <div>
              Date of Plea/ Finding of Guilt:{" "}
              {formatDisplayDate(charge.pleaDate)}
            </div>
            <div>
              Date of Sentencing: {formatDisplayDate(charge.sentencingDate)}
            </div>
          </>
        ) : (
          <>
            <FieldOrMissing
              label="Prosecuting Attorney"
              value={charge.prosecutingAttorney}
            />
            <FieldOrMissing
              label="Defense Attorney"
              value={charge.defenseAttorney}
            />
            <FieldOrMissing
              label="Plea Agreement"
              value={charge.pleaAgreement}
            />
            <Styled.InlineRow>
              Date of Plea/ Finding of Guilt:{" "}
              {charge.pleaDate ? (
                formatDisplayDate(charge.pleaDate)
              ) : (
                <MissingBadge />
              )}
            </Styled.InlineRow>
            <Styled.InlineRow>
              Date of Sentencing:{" "}
              {charge.sentencingDate ? (
                formatDisplayDate(charge.sentencingDate)
              ) : (
                <MissingBadge />
              )}
            </Styled.InlineRow>
          </>
        )}
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
    sectionStatuses,
  } = presenter;

  const isReadyForDownload = Object.values(sectionStatuses).every(
    (s) => s === "complete",
  );

  const sarData = presenter.SARData;

  // --- Key Considerations ---
  const needsComplete =
    needsSkipped ||
    (!!sarData?.needsToBeAddressed && sarData.needsToBeAddressed.length > 0);
  const needsListText = sarData?.needsToBeAddressed?.length
    ? mapEnumKeysToDisplay(NeedsToBeAddressed, sarData.needsToBeAddressed).join(
        ", ",
      )
    : null;
  const needsDisplay = needsSkipped ? NONE_LISTED : needsListText;

  const factorsComplete =
    factorsSkipped ||
    (!!sarData?.mitigatingFactors && sarData.mitigatingFactors.length > 0);
  const mitigationListText = sarData?.mitigatingFactors?.length
    ? mapEnumKeysToDisplay(ProtectiveFactors, sarData.mitigatingFactors).join(
        ", ",
      )
    : null;
  const mitigationDisplay = factorsSkipped ? NONE_LISTED : mitigationListText;

  // --- Defendant's Version ---
  const isDefendantComplete =
    sectionStatuses[SARSection.DEFENDANTS_VERSION] === "complete";
  const defendantDisplay = defendantStatementSkipped
    ? NONE_LISTED
    : sarData?.defendantStatement;

  // --- Victim Impact ---
  const isVictimImpactComplete =
    sectionStatuses[SARSection.VICTIM_IMPACT] === "complete";
  const victimImpactDisplay = victimImpactStatementSkipped
    ? NONE_LISTED
    : sarData?.victimImpactStatement;

  // --- Offender Assessment (always show imported score summary) ---
  const domains = getDomainsForAssessmentType(sarData?.assessmentType ?? null);
  const groupedByRisk: Record<keyof typeof RISK_LEVELS, string[]> = {
    HIGH: [],
    MODERATE: [],
    LOW: [],
  };
  domains.forEach((domain) => {
    if (!domain.riskLevelField) return;
    const storedLevel = sarData?.[
      domain.riskLevelField as keyof typeof sarData
    ] as RiskLevelKey | null;
    if (storedLevel) {
      groupedByRisk[storedLevel].push(domain.title);
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
      : null;

  // --- Recommendation (per sub-section) ---
  const communityValue = sarData?.communityStrategyRecommendation?.trim();
  const homePlanValue = sarData?.homePlan?.trim();
  const institutionalValue =
    sarData?.institutionalStrategyRecommendation?.trim();

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
        <Styled.DownloadButton
          disabled={!isReadyForDownload}
          aria-label="Download SAR report"
        >
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
        <SummaryOffenseCard
          key={charge.id}
          charge={charge}
          presenter={presenter}
        />
      ))}

      {/* Key Considerations */}
      {!presenter.defendantDeclinedToParticipate && (
        <Styled.SectionCard>
          <Styled.SectionTitle>Key Considerations</Styled.SectionTitle>
          <Styled.SectionBody>
            <Styled.InlineRow>
              Needs: {needsComplete ? needsDisplay : <MissingBadge />}
            </Styled.InlineRow>
            <Styled.InlineRow>
              Mitigation:{" "}
              {factorsComplete ? mitigationDisplay : <MissingBadge />}
            </Styled.InlineRow>
          </Styled.SectionBody>
        </Styled.SectionCard>
      )}

      {/* Defendant's Version */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Defendant&apos;s Version</Styled.SectionTitle>
        <Styled.SectionBody>
          {isDefendantComplete ? defendantDisplay : <MissingBadge />}
        </Styled.SectionBody>
      </Styled.SectionCard>

      {/* Victim Impact */}
      <Styled.SectionCard>
        <Styled.SectionTitle>Victim Impact</Styled.SectionTitle>
        <Styled.SectionBody>
          {isVictimImpactComplete ? victimImpactDisplay : <MissingBadge />}
        </Styled.SectionBody>
      </Styled.SectionCard>

      {!presenter.defendantDeclinedToParticipate && (
        <>
          {/* Offender Assessment — always show the imported score summary */}
          <Styled.SectionCard>
            <Styled.SectionTitle>Offender Assessment</Styled.SectionTitle>
            <Styled.SectionBody>
              {offenderAssessmentDisplay || NONE_LISTED}
            </Styled.SectionBody>
          </Styled.SectionCard>

          {/* Recommendation - per sub-section badges */}
          <Styled.SectionCard>
            <Styled.SectionTitle>Recommendation</Styled.SectionTitle>
            {recommendationSkipped ? (
              <Styled.SectionBody>{NONE_LISTED}</Styled.SectionBody>
            ) : (
              <Styled.RecommendationSection>
                <Styled.RecommendationLabel>
                  Community Strategy
                </Styled.RecommendationLabel>
                <Styled.SectionBody>
                  {communityValue || <MissingBadge />}
                </Styled.SectionBody>
                <Styled.RecommendationLabel>
                  Home Plan
                </Styled.RecommendationLabel>
                <Styled.SectionBody>
                  {homePlanValue || <MissingBadge />}
                </Styled.SectionBody>
                <Styled.RecommendationLabel>
                  Institutional Strategy
                </Styled.RecommendationLabel>
                <Styled.SectionBody>
                  {institutionalValue || <MissingBadge />}
                </Styled.SectionBody>
              </Styled.RecommendationSection>
            )}
          </Styled.SectionCard>
        </>
      )}
    </Styled.Container>
  );
});
