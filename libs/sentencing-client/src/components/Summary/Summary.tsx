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
import {
  formatClassification,
  formatDisplayDate,
  formatJudgeAndDivision,
} from "../../utils/utils";
import DownloadIcon from "../assets/download-icon.svg?react";
import { SARSection } from "../SARDetails/constants";
import { useStore } from "../StoreProvider/StoreProvider";
import { ESignatureSection } from "./ESignatureSection";
import { InsightsSummaryPanel } from "./InsightsSummaryPanel";
import { MissingBadge } from "./MissingBadge";
import { exportSARtoPDF } from "./SARPdfExport";
import { SentencingAssessmentReport } from "./SentencingAssessmentReport";
import * as Styled from "./Summary.styles";
import { SummaryOffenderAssessment } from "./SummaryOffenderAssessment";
import { SummaryPriorTreatmentHistory } from "./SummaryPriorTreatmentHistory";

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
        <div>Class: {formatClassification(charge) || "—"}</div>
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
  const { activeFeatureVariants } = useStore();
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
  const declined = presenter.defendantDeclinedToParticipate;

  // --- Key Considerations ---
  const needsComplete =
    needsSkipped ||
    (!!sarData?.needsToBeAddressed && sarData.needsToBeAddressed.length > 0);
  const needsDisplay = needsSkipped
    ? NONE_LISTED
    : presenter.needsDisplayItems.join(", ") || null;

  const factorsComplete =
    factorsSkipped ||
    (!!sarData?.mitigatingFactors && sarData.mitigatingFactors.length > 0);
  const mitigationDisplay = factorsSkipped
    ? NONE_LISTED
    : presenter.factorsDisplayItems.join(", ") || null;

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

  // --- Recommendation (per sub-section) ---
  const communityValue = sarData?.communityStrategyRecommendation?.trim();
  const homePlanValue = sarData?.homePlan?.trim();
  const institutionalValue =
    sarData?.institutionalStrategyRecommendation?.trim();

  const targetRef = React.useRef<HTMLDivElement>(null);
  const fileName = `Sentencing Assessment Report - ${presenter.SARAttributes.client?.fullName ?? ""}`;
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleClickToDownload = async () => {
    if (!targetRef.current || isDownloading) return;
    setIsDownloading(true);
    // Track the click intent before the async export so failures are still captured.
    presenter.trackSARDownloadReportClicked();
    try {
      await exportSARtoPDF(targetRef.current, fileName);
    } catch (e) {
      console.error("SAR PDF export failed:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Styled.SummaryReportWrapper>
      <Styled.SummaryWrapper>
        <Styled.Container>
          {/* Download header */}
          <Styled.DownloadHeader>
            <Styled.DownloadHeaderText>
              <Styled.DownloadTitle>Download SAR</Styled.DownloadTitle>
              <Styled.DownloadSubtitle>
                Clicking &ldquo;Download&rdquo; will generate and save the PDF
                directly.
              </Styled.DownloadSubtitle>
            </Styled.DownloadHeaderText>
            <Styled.DownloadButton
              disabled={!isReadyForDownload || isDownloading}
              aria-label="Download SAR report"
              onClick={handleClickToDownload}
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
          {!declined && (
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

          {!declined && (
            <Styled.SectionCard>
              <Styled.SectionTitle>
                Defendant&apos;s Version
              </Styled.SectionTitle>
              <Styled.SectionBody>
                {isDefendantComplete ? defendantDisplay : <MissingBadge />}
              </Styled.SectionBody>
            </Styled.SectionCard>
          )}

          {/* Victim Impact */}
          <Styled.SectionCard>
            <Styled.SectionTitle>Victim Impact</Styled.SectionTitle>
            <Styled.SectionBody>
              {isVictimImpactComplete ? victimImpactDisplay : <MissingBadge />}
            </Styled.SectionBody>
          </Styled.SectionCard>

          <SummaryOffenderAssessment presenter={presenter} />

          <SummaryPriorTreatmentHistory presenter={presenter} />

          {!declined && (
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
          )}

          {!declined &&
            activeFeatureVariants["SARBuilder"] &&
            !sarData?.mostSevereOffenseName && (
              <Styled.SectionCard>
                <Styled.SectionTitle>Insights</Styled.SectionTitle>
                <Styled.SectionBody>
                  <MissingBadge />
                  Most severe offense must be selected in Case Information.
                </Styled.SectionBody>
              </Styled.SectionCard>
            )}
        </Styled.Container>

        {!declined &&
          activeFeatureVariants["SARBuilder"] &&
          sarData?.mostSevereOffenseName && (
            <InsightsSummaryPanel presenter={presenter} />
          )}

        <ESignatureSection
          presenter={presenter}
          isReportComplete={isReadyForDownload}
        />
      </Styled.SummaryWrapper>

      {/* PDF report — off-screen, captured by html2canvas + jsPDF on download */}
      <Styled.ReportPDFContainer>
        <div ref={targetRef}>
          <SentencingAssessmentReport presenter={presenter} />
        </div>
      </Styled.ReportPDFContainer>
    </Styled.SummaryReportWrapper>
  );
});
