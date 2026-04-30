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

import moment from "moment";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { formatJudgeName } from "../../utils/utils";
import LearnMoreBannerIcon from "../assets/learn-more-banner-icon.svg?react";
import { SARSection } from "../SARDetails/constants";
import {
  ReportBlock,
  SectionContinuationHeader,
  SentencingAssessmentReportSection,
} from "./ReportBlock";
import { ReportCharge } from "./ReportCharge";
import {
  ReportDispositionChart,
  ReportDispositionChartEmpty,
} from "./ReportDispositionChart";
import { ReportKeyConsiderations } from "./ReportKeyConsiderations";
import { ReportKeyFinding } from "./ReportKeyFinding";
import { ReportOffenderAssessment } from "./ReportOffenderAssessment";
import { ReportPriorTreatmentHistory } from "./ReportPriorTreatmentHistory";
import { ReportRecommendation } from "./ReportRecommendation";
import { ReportRequestedOf } from "./ReportRequestedOf";
import { ReportSignature } from "./ReportSignature";
import { ReportTimeServed, ReportTimeServedEmpty } from "./ReportTimeServed";
import {
  BLOCK_GAP,
  CHIP_GAP,
  LEARN_MORE_BANNER_ATTR,
} from "./SentencingAssessmentReport.constants";
import * as Styled from "./SentencingAssessmentReport.styles";

const OFFENDER_COURT_SECTION_TITLE = "Offender / Court Information";

interface SentencingAssessmentReportProps {
  presenter: SARDetailsPresenter;
}

export const SentencingAssessmentReport: React.FC<
  SentencingAssessmentReportProps
> = ({ presenter }) => {
  const sarData = presenter.SARData;
  if (!sarData) return null;

  const { dateRequested, updatedAt, staff } = sarData;
  const charges = presenter.charges;
  const { needsDisplayItems, factorsDisplayItems } = presenter;
  const declined = presenter.defendantDeclinedToParticipate;
  const insightData = presenter.insightData;
  const insightDescriptionContext = presenter.emptyStateDescriptionContext;
  const timeServedData =
    insightData?.avgPctServed != null &&
    insightData?.timeServedNumRecords != null
      ? {
          avgPctServed: insightData.avgPctServed,
          timeServedNumRecords: insightData.timeServedNumRecords,
        }
      : null;

  const header = (
    <Styled.Header>
      <Styled.DOCHeader>
        <div> Missouri Department of Corrections </div>
        <div> Division of Probation and Parole </div>
        <div> Sentencing Assessment Report </div>
      </Styled.DOCHeader>
      <Styled.DateTimeHeader>
        <div>{moment().format("MMMM D, YYYY")}</div>
        <div>{moment().format("LTS")}</div>
      </Styled.DateTimeHeader>
    </Styled.Header>
  );

  const caseInformation = (
    <Styled.CaseInformationRow gap={5}>
      <Styled.CaseInformationColumn gap={5}>
        <Styled.CaseInformationLabel>Defendant</Styled.CaseInformationLabel>
        <Styled.CaseInformationValue>
          {presenter.formattedClientName}
        </Styled.CaseInformationValue>
      </Styled.CaseInformationColumn>
      <Styled.CaseInformationColumn gap={5}>
        <Styled.CaseInformationLabel>To</Styled.CaseInformationLabel>
        <Styled.CaseInformationValue>
          {sarData.requestingJudgeName
            ? `Honorable ${formatJudgeName(sarData.requestingJudgeName)}`
            : "—"}{" "}
          / {sarData.division}
        </Styled.CaseInformationValue>
      </Styled.CaseInformationColumn>
      <Styled.CaseInformationColumn gap={5}>
        <Styled.CaseInformationLabel>Case Number</Styled.CaseInformationLabel>
        <Styled.CaseInformationValue>
          #{sarData.externalId}
        </Styled.CaseInformationValue>
      </Styled.CaseInformationColumn>
    </Styled.CaseInformationRow>
  );

  const footer = (
    <Styled.Footer>
      <Styled.FooterMessage>
        Defendant: {presenter.formattedClientName} | Cause:{" "}
        {charges
          .map((c) => c.causeNum)
          .filter(Boolean)
          .map((n) => `#${n}`)
          .join(", ")}
      </Styled.FooterMessage>
      {/*
       * The &nbsp; maintains the element's line height so the footer height
       * measurement during PDF export is accurate. The PDF exporter injects
       * the correct page number before capturing each per-page footer image.
       */}
      <Styled.FooterMessage data-sar-page-number="true">
        &nbsp;
      </Styled.FooterMessage>
    </Styled.Footer>
  );

  const clientChips = (
    <Styled.RowFlexContainer gap={CHIP_GAP}>
      <Styled.ReportChip>Gender: {presenter.formattedGender}</Styled.ReportChip>
      <Styled.ReportChip>
        Race: {presenter.formattedRaceOrEthnicity}
      </Styled.ReportChip>
      <Styled.ReportChip>
        Date of Birth: {presenter.formattedBirthDate}
      </Styled.ReportChip>
      <Styled.ReportChip>
        DOC ID: {presenter.SARAttributes.externalId}
      </Styled.ReportChip>
    </Styled.RowFlexContainer>
  );

  return (
    <Styled.ReportTable>
      <thead>
        <tr>
          <Styled.HeaderCell>{header}</Styled.HeaderCell>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <Styled.FooterCell>
            <Styled.LearnMoreBannerWrapper
              {...{ [LEARN_MORE_BANNER_ATTR]: "" }}
            >
              <Styled.LearnMoreBanner>
                <LearnMoreBannerIcon />
                <Styled.LearnMoreBannerText>
                  Visit <strong>https://www.mosac.mo.gov/sar-pilot</strong> to
                  learn more about the information presented in this report.
                </Styled.LearnMoreBannerText>
              </Styled.LearnMoreBanner>
            </Styled.LearnMoreBannerWrapper>
            {footer}
          </Styled.FooterCell>
        </tr>
      </tfoot>
      <tbody>
        <tr>
          <td>
            <Styled.PageContent>
              {caseInformation}
              <ReportRequestedOf
                dateRequested={dateRequested}
                updatedAt={updatedAt}
                staff={staff}
              />
              <SentencingAssessmentReportSection
                title={OFFENDER_COURT_SECTION_TITLE}
                splittable
              >
                <Styled.ColumnFlexContainer gap={BLOCK_GAP}>
                  {clientChips}
                  {charges.map((charge, i) => (
                    <ReportBlock key={charge.id}>
                      {i > 0 && (
                        <SectionContinuationHeader
                          title={`${OFFENDER_COURT_SECTION_TITLE} Continued...`}
                        />
                      )}
                      <ReportCharge charge={charge} index={i} />
                    </ReportBlock>
                  ))}
                </Styled.ColumnFlexContainer>
              </SentencingAssessmentReportSection>
              {!declined && (
                <ReportKeyConsiderations
                  needsDisplayItems={needsDisplayItems}
                  factorsDisplayItems={factorsDisplayItems}
                  riskProfileCardData={presenter.riskProfileCardData}
                />
              )}
              {sarData.defendantStatement &&
                !presenter.defendantStatementSkipped && (
                  <SentencingAssessmentReportSection
                    title={SARSection.DEFENDANTS_VERSION}
                  >
                    <Styled.FreeTextContent>
                      {sarData.defendantStatement}
                    </Styled.FreeTextContent>
                  </SentencingAssessmentReportSection>
                )}
              {sarData.victimImpactStatement &&
                !presenter.victimImpactStatementSkipped && (
                  <SentencingAssessmentReportSection
                    title={SARSection.VICTIM_IMPACT}
                  >
                    <Styled.FreeTextContent>
                      {sarData.victimImpactStatement}
                    </Styled.FreeTextContent>
                  </SentencingAssessmentReportSection>
                )}
              {(sarData.assessmentType || !presenter.hasOrasAssessment) && (
                <ReportOffenderAssessment
                  sarData={sarData}
                  hasOrasAssessment={presenter.hasOrasAssessment}
                />
              )}
              {!declined && (
                <>
                  <ReportPriorTreatmentHistory
                    presenter={presenter.priorTreatmentHistory}
                  />
                  {!presenter.recommendationSkipped && (
                    <ReportRecommendation sarData={sarData} />
                  )}
                </>
              )}
              {insightData?.dispositionNumRecords ? (
                <ReportDispositionChart
                  insight={insightData}
                  sortedDispositionData={presenter.sortedDispositionData}
                />
              ) : (
                <ReportDispositionChartEmpty
                  descriptionContext={insightDescriptionContext}
                />
              )}
              {insightData &&
                insightDescriptionContext &&
                (timeServedData ? (
                  <ReportTimeServed
                    descriptionContext={insightDescriptionContext}
                    {...timeServedData}
                  />
                ) : (
                  <ReportTimeServedEmpty
                    descriptionContext={insightDescriptionContext}
                  />
                ))}
              {insightData?.dispositionNumRecords ? (
                <ReportKeyFinding insight={insightData} />
              ) : null}
              <ReportSignature />
            </Styled.PageContent>
          </td>
        </tr>
      </tbody>
    </Styled.ReportTable>
  );
};
