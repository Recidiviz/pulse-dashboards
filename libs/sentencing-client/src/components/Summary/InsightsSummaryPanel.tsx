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
import { printFormattedRecordString, titleCase } from "../../utils/utils";
import * as CommonStyled from "../CaseDetails/components/charts/components/Styles";
import { SENTENCE_DISTRIBUTION_TEXT } from "../CaseDetails/components/charts/constants";
import { DispositionDonutChart } from "../CaseDetails/components/charts/DispositionChart/DispositionDonutChart";
import { SARDispositionChartExplanation } from "../CaseDetails/components/charts/DispositionChart/SARDispositionChartExplanation";
import { getSARDispositionChartSubtitle } from "../CaseDetails/components/charts/DispositionChart/sarUtils";
import { InfoIconWithTooltip } from "../Tooltip/Tooltip";
import { buildInsightsFootnoteText } from "./insightsUtils";
import * as Styled from "./Summary.styles";

interface InsightsSummaryPanelProps {
  presenter: SARDetailsPresenter;
}

export const InsightsSummaryPanel: React.FC<InsightsSummaryPanelProps> =
  observer(function InsightsSummaryPanel({ presenter }) {
    const insightData = presenter.insightData;
    const sortedDispositionData = presenter.sortedDispositionData;
    const hasOrasAssessment = presenter.offenderAssessment.hasOrasAssessment;
    const emptyStateContext = presenter.emptyStateDescriptionContext;
    const clientFullName = presenter.SARData?.client?.fullName;

    if (!insightData && !emptyStateContext) return null;

    return (
      <Styled.InsightsSidePanel>
        <Styled.SectionTitle>Insights</Styled.SectionTitle>
        {insightData && insightData.dispositionNumRecords > 0 && (
          <Styled.InsightsSubtitle>
            This information represents outcomes for cases similar to that of
            the current client
            {clientFullName ? `, ${titleCase(clientFullName)},` : ""} based on
            gender, risk score, and type of conviction. The statistics below are
            pulled from historical sentencing data and will appear in the report
            to provide context for judges, attorneys, and others involved in the
            case.
          </Styled.InsightsSubtitle>
        )}
        <Styled.InsightsChartCard
          $isEmpty={!insightData || insightData.dispositionNumRecords === 0}
        >
          {insightData && insightData.dispositionNumRecords > 0 ? (
            <>
              <CommonStyled.ChartTitle>
                Sentence Distribution{" "}
                <InfoIconWithTooltip
                  headerText={SENTENCE_DISTRIBUTION_TEXT}
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
              <Styled.InsightsSimilarCases>
                Similar cases
              </Styled.InsightsSimilarCases>
            </>
          ) : (
            <>
              <CommonStyled.ChartTitle>
                Sentence Distribution
              </CommonStyled.ChartTitle>
              <Styled.InsightsEmptyState>
                <Styled.InsightsEmptyText>
                  {hasOrasAssessment
                    ? "There are no previous sentencing records matching this client's gender, risk score, and offense."
                    : "An ORAS assessment score is required to generate sentence distribution data for this client."}
                </Styled.InsightsEmptyText>
              </Styled.InsightsEmptyState>
            </>
          )}
        </Styled.InsightsChartCard>
        {insightData &&
          insightData.dispositionNumRecords > 0 &&
          insightData.assessmentScoreBucketStart != null && (
            <Styled.InsightsFootnote>
              {buildInsightsFootnoteText(
                insightData.dispositionNumRecords,
                insightData.gender,
                insightData.assessmentScoreBucketStart,
              )}
            </Styled.InsightsFootnote>
          )}
      </Styled.InsightsSidePanel>
    );
  });
