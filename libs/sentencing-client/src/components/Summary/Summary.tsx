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
  formatBooleanDisplay,
  formatClassification,
  formatDateRange,
  formatDisplayDate,
  formatJudgeAndDivision,
  formatMonthYear,
  printFormattedRecordString,
  titleCase,
} from "../../utils/utils";
import DownloadIcon from "../assets/download-icon.svg?react";
import * as CommonStyled from "../CaseDetails/components/charts/components/Styles";
import { HISTORICAL_PRECEDENT_TEXT } from "../CaseDetails/components/charts/constants";
import { DispositionDonutChart } from "../CaseDetails/components/charts/DispositionChart/DispositionDonutChart";
import { SARDispositionChartExplanation } from "../CaseDetails/components/charts/DispositionChart/SARDispositionChartExplanation";
import { getSARDispositionChartSubtitle } from "../CaseDetails/components/charts/DispositionChart/sarUtils";
import { RISK_LEVEL_KEYS, RISK_LEVELS } from "../OffenderAssessment/constants";
import {
  DOC_INCARCERATION_DESCRIPTION,
  MAX_DOC_HISTORIES_PER_CATEGORY,
  TREATMENT_PROGRAM_CATEGORY_LABELS,
} from "../OffenderAssessment/PriorTreatmentHistory/constants";
import {
  DOCTreatmentHistory,
  TreatmentProgramCategory,
} from "../OffenderAssessment/PriorTreatmentHistory/types";
import {
  DRUG_HISTORY_COLUMNS,
  formatSubstanceName,
  FrequencyOfUseLabels,
  MethodOfUseLabels,
} from "../OffenderAssessment/SubstanceUse/constants";
import { SARSection } from "../SARDetails/constants";
import { useStore } from "../StoreProvider/StoreProvider";
import { InfoIconWithTooltip } from "../Tooltip/Tooltip";
import { MissingBadge } from "./MissingBadge";
import { exportSARtoPDF } from "./SARPdfExport";
import { SentencingAssessmentReport } from "./SentencingAssessmentReport";
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

const SummaryOrMissing: React.FC<{
  summary: string | null | undefined;
  labeled?: boolean;
}> = ({ summary, labeled = false }) => {
  if (summary) return <div>{summary}</div>;
  if (labeled)
    return (
      <Styled.InlineRow>
        Summary: <MissingBadge />
      </Styled.InlineRow>
    );
  return <MissingBadge />;
};

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

  const { activeFeatureVariants } = useStore();
  const hasSARDownload = Boolean(activeFeatureVariants["SARBuilder"]);

  const isReadyForDownload = Object.values(sectionStatuses).every(
    (s) => s === "complete",
  );

  const sarData = presenter.SARData;

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

  // --- Offender Assessment ---
  const { groupedByRisk, offenderAssessmentDisplay } =
    presenter.offenderAssessment;

  const { fatherName, motherName, guardianName } = sarData?.client ?? {};

  // --- Prior Treatment History ---
  const priorTreatmentHistories =
    presenter.priorTreatmentHistory.priorTreatmentHistories;
  const docHistoriesByCategory =
    presenter.priorTreatmentHistory.DOCTreatmentHistoriesByCategory;

  // --- Recommendation (per sub-section) ---
  const communityValue = sarData?.communityStrategyRecommendation?.trim();
  const homePlanValue = sarData?.homePlan?.trim();
  const institutionalValue =
    sarData?.institutionalStrategyRecommendation?.trim();

  const insightData = presenter.insightData;
  const sortedDispositionData = presenter.sortedDispositionData;
  const targetRef = React.useRef<HTMLDivElement>(null);
  const fileName = `Sentencing Assessment Report - ${titleCase(sarData?.client?.fullName ?? "")}`;
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleClickToDownload = async () => {
    if (!hasSARDownload || !targetRef.current || isDownloading) return;
    setIsDownloading(true);
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
              disabled={!isReadyForDownload || !hasSARDownload || isDownloading}
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

          {/* Offender Assessment + Prior Treatment History + Recommendation */}
          {!presenter.defendantDeclinedToParticipate && (
            <>
              <Styled.SectionCard>
                <Styled.SectionTitle>Offender Assessment</Styled.SectionTitle>

                {offenderAssessmentDisplay && (
                  <Styled.SectionBody>
                    {offenderAssessmentDisplay}
                  </Styled.SectionBody>
                )}

                <Styled.DetailContainer>
                  {presenter.offenderAssessment.hasOrasAssessment && (
                    <Styled.DetailSubsection>
                      <Styled.SubsectionTitle>
                        Risk Category Summary
                      </Styled.SubsectionTitle>
                      <Styled.CategoryRow>
                        {RISK_LEVEL_KEYS.map((level) => (
                          <Styled.CategoryColumn key={level}>
                            <Styled.CategoryColumnHeader>
                              Scored {RISK_LEVELS[level]}
                            </Styled.CategoryColumnHeader>
                            <div>{groupedByRisk[level].join(", ") || "—"}</div>
                          </Styled.CategoryColumn>
                        ))}
                      </Styled.CategoryRow>
                    </Styled.DetailSubsection>
                  )}

                  {presenter.offenderAssessment.domains.map((domain) => {
                    const summary =
                      presenter.offenderAssessment.getDomainSummary(domain);

                    // Non-null for domains with extra content below the summary;
                    // drives the "Summary: missing" label in SummaryOrMissing.
                    let extraContent: React.ReactNode = null;
                    if (domain.key === "substanceUse") {
                      extraContent = (
                        <>
                          {sarData?.drugHistories &&
                            sarData.drugHistories.length > 0 && (
                              <Styled.AssessmentTable>
                                <Styled.TableHeaderRow>
                                  {DRUG_HISTORY_COLUMNS.map((col) => (
                                    <Styled.TableHeaderCell key={col}>
                                      {col}
                                    </Styled.TableHeaderCell>
                                  ))}
                                </Styled.TableHeaderRow>
                                {sarData.drugHistories.map((history) => (
                                  <Styled.TableDataRow key={history.id}>
                                    <Styled.TableDataCell>
                                      {formatSubstanceName(
                                        history.substance,
                                        history.otherSubstanceName,
                                      ) ?? "—"}
                                    </Styled.TableDataCell>
                                    <Styled.TableDataCell>
                                      {history.ageOfRegularUse ?? "—"}
                                    </Styled.TableDataCell>
                                    <Styled.TableDataCell>
                                      {history.lastUse
                                        ? formatMonthYear(history.lastUse)
                                        : "—"}
                                    </Styled.TableDataCell>
                                    <Styled.TableDataCell>
                                      {history.heaviestUse
                                        ? FrequencyOfUseLabels[
                                            history.heaviestUse
                                          ]
                                        : "—"}
                                    </Styled.TableDataCell>
                                    <Styled.TableDataCell>
                                      {history.method
                                        ? MethodOfUseLabels[history.method]
                                        : "—"}
                                    </Styled.TableDataCell>
                                  </Styled.TableDataRow>
                                ))}
                              </Styled.AssessmentTable>
                            )}
                        </>
                      );
                    } else if (domain.key === "educationEmployment") {
                      extraContent = (
                        <>
                          <Styled.AssessmentTable>
                            <Styled.InlineRow>
                              Highest Level of Education:{" "}
                              {sarData?.levelOfEducation || <MissingBadge />}
                            </Styled.InlineRow>
                            <Styled.InlineRow>
                              Employed at Time of Offense:{" "}
                              {sarData?.employedAtOffense !== undefined ? (
                                formatBooleanDisplay(sarData.employedAtOffense)
                              ) : (
                                <MissingBadge />
                              )}
                            </Styled.InlineRow>
                          </Styled.AssessmentTable>
                          {sarData?.employmentHistories &&
                            sarData.employmentHistories.length > 0 && (
                              <Styled.AssessmentTable>
                                <Styled.TableHeaderRow>
                                  <Styled.TableHeaderCell>
                                    Name of Employer
                                  </Styled.TableHeaderCell>
                                  <Styled.TableHeaderCell>
                                    Start/End Date
                                  </Styled.TableHeaderCell>
                                  <Styled.TableHeaderCell>
                                    Verified by Report Author
                                  </Styled.TableHeaderCell>
                                </Styled.TableHeaderRow>
                                {sarData.employmentHistories.map((history) => (
                                  <Styled.TableDataRow key={history.id}>
                                    <Styled.TableDataCell>
                                      {history.employerName || "—"}
                                    </Styled.TableDataCell>
                                    <Styled.TableDataCell>
                                      {formatDateRange(
                                        history.startDate,
                                        history.endDate,
                                      )}
                                    </Styled.TableDataCell>
                                    <Styled.TableDataCell>
                                      {formatBooleanDisplay(
                                        history.verifiedByReportAuthor,
                                      )}
                                    </Styled.TableDataCell>
                                  </Styled.TableDataRow>
                                ))}
                              </Styled.AssessmentTable>
                            )}
                        </>
                      );
                    } else if (domain.key === "familySocialSupport") {
                      extraContent = (
                        <Styled.AssessmentTable>
                          <Styled.FamilyFieldRow>
                            <Styled.FamilyFieldLabel>
                              Father:
                            </Styled.FamilyFieldLabel>
                            {fatherName || <MissingBadge />}
                          </Styled.FamilyFieldRow>
                          <Styled.FamilyFieldRow>
                            <Styled.FamilyFieldLabel>
                              Mother:
                            </Styled.FamilyFieldLabel>
                            {motherName || <MissingBadge />}
                          </Styled.FamilyFieldRow>
                          <Styled.FamilyFieldRow>
                            <Styled.FamilyFieldLabel>
                              Who Raised Offender:
                            </Styled.FamilyFieldLabel>
                            {guardianName || <MissingBadge />}
                          </Styled.FamilyFieldRow>
                        </Styled.AssessmentTable>
                      );
                    }

                    return (
                      <Styled.DetailSubsection key={domain.key}>
                        <Styled.SubsectionTitle>
                          {domain.title}
                        </Styled.SubsectionTitle>
                        <Styled.SectionBody>
                          <SummaryOrMissing
                            summary={summary}
                            labeled={extraContent !== null}
                          />
                          {extraContent}
                        </Styled.SectionBody>
                      </Styled.DetailSubsection>
                    );
                  })}
                </Styled.DetailContainer>
              </Styled.SectionCard>

              {/* Prior Treatment History */}
              <Styled.SectionCard>
                <Styled.SectionTitle>
                  Prior Treatment History
                </Styled.SectionTitle>
                <Styled.DetailContainer>
                  <Styled.DetailSubsection>
                    <Styled.SubsectionTitle>
                      Community Treatments and Programming
                    </Styled.SubsectionTitle>
                    <Styled.SectionBody>
                      <SummaryOrMissing
                        summary={sarData?.priorTreatmentHistorySummary}
                        labeled
                      />
                      {priorTreatmentHistories.length > 0 && (
                        <Styled.AssessmentTable>
                          <Styled.TableHeaderRow>
                            <Styled.TableHeaderCell>
                              Year Completed
                            </Styled.TableHeaderCell>
                            <Styled.TableHeaderCell>
                              Program
                            </Styled.TableHeaderCell>
                            <Styled.TableHeaderCell>
                              Verified by Report Author
                            </Styled.TableHeaderCell>
                          </Styled.TableHeaderRow>
                          {priorTreatmentHistories.map((history) => (
                            <Styled.TableDataRow key={history.id}>
                              <Styled.TableDataCell>
                                {history.yearCompleted ?? "—"}
                              </Styled.TableDataCell>
                              <Styled.TableDataCell>
                                {history.programName ?? "—"}
                              </Styled.TableDataCell>
                              <Styled.TableDataCell>
                                {formatBooleanDisplay(
                                  history.verifiedByReportAuthor,
                                )}
                              </Styled.TableDataCell>
                            </Styled.TableDataRow>
                          ))}
                        </Styled.AssessmentTable>
                      )}
                    </Styled.SectionBody>
                  </Styled.DetailSubsection>

                  {Object.keys(docHistoriesByCategory).length > 0 && (
                    <Styled.DetailSubsection>
                      <Styled.SubsectionTitle>
                        Department of Corrections Incarceration Program
                        Completion History
                      </Styled.SubsectionTitle>
                      <Styled.SectionBody>
                        <div>{DOC_INCARCERATION_DESCRIPTION}</div>
                        <Styled.CategoryRow>
                          {Object.entries(docHistoriesByCategory)
                            .filter(
                              (
                                entry,
                              ): entry is [
                                TreatmentProgramCategory,
                                DOCTreatmentHistory[],
                              ] =>
                                entry[1] !== undefined && entry[1].length > 0,
                            )
                            .map(([category, histories]) => {
                              const labels =
                                TREATMENT_PROGRAM_CATEGORY_LABELS[category];
                              const label =
                                histories.length === 1
                                  ? labels.singular
                                  : labels.plural;
                              const displayed = histories.slice(
                                0,
                                MAX_DOC_HISTORIES_PER_CATEGORY,
                              );
                              const remaining =
                                histories.length - displayed.length;
                              return (
                                <Styled.CategoryColumn key={category}>
                                  <Styled.CategoryColumnHeader>
                                    {histories.length} {label}
                                  </Styled.CategoryColumnHeader>
                                  {displayed.map((history) => (
                                    <React.Fragment key={history.id}>
                                      {history.completedOn && (
                                        <div>
                                          {formatDisplayDate(
                                            history.completedOn,
                                          )}
                                        </div>
                                      )}
                                      <div>{history.programName}</div>
                                    </React.Fragment>
                                  ))}
                                  {remaining > 0 && (
                                    <Styled.MoreText>
                                      and {remaining} more
                                    </Styled.MoreText>
                                  )}
                                </Styled.CategoryColumn>
                              );
                            })}
                        </Styled.CategoryRow>
                      </Styled.SectionBody>
                    </Styled.DetailSubsection>
                  )}
                </Styled.DetailContainer>
              </Styled.SectionCard>

              {/* Recommendation */}
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

        {/* Insights — separate card, below the sticky summary panel */}
        {insightData && insightData.dispositionNumRecords > 0 && (
          <Styled.InsightsSidePanel>
            <Styled.SectionTitle>Insights</Styled.SectionTitle>
            <Styled.InsightsSubtitle>
              This information represents outcomes for cases similar to that of
              the current client, {titleCase(sarData?.client?.fullName)}, based
              on gender, risk score, and most severe offense.
            </Styled.InsightsSubtitle>
            <Styled.InsightsChartCard>
              <CommonStyled.ChartTitle>
                Historical Precedent{" "}
                <InfoIconWithTooltip
                  headerText={HISTORICAL_PRECEDENT_TEXT}
                  content={
                    <CommonStyled.ChartTooltipContentSection>
                      <SARDispositionChartExplanation insight={insightData} />
                    </CommonStyled.ChartTooltipContentSection>
                  }
                />
              </CommonStyled.ChartTitle>
              <CommonStyled.ChartSubTitle>
                {getSARDispositionChartSubtitle(insightData)}{" "}
                <span>
                  (Based on {insightData.dispositionNumRecords.toLocaleString()}{" "}
                  {printFormattedRecordString(
                    insightData.dispositionNumRecords,
                  )}
                  )
                </span>
              </CommonStyled.ChartSubTitle>
              <Styled.InsightsDonutWrapper>
                <DispositionDonutChart
                  datapoints={sortedDispositionData}
                  numberOfRecords={insightData.dispositionNumRecords}
                  selectedRecommendation={null}
                  inlineLayout
                />
              </Styled.InsightsDonutWrapper>
            </Styled.InsightsChartCard>
          </Styled.InsightsSidePanel>
        )}
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
