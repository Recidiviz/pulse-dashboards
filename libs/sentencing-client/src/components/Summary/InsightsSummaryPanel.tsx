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
import React, { useRef, useState } from "react";

import { palette } from "~design-system";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import {
  formatTimeServedPct,
  printFormattedRecordString,
} from "../../utils/utils";
import ChevronLeftIcon from "../assets/chevron-left.svg?react";
import ChevronRightIcon from "../assets/chevron-right.svg?react";
import * as CommonStyled from "../CaseDetails/components/charts/components/Styles";
import { SENTENCE_DISTRIBUTION_TEXT } from "../CaseDetails/components/charts/constants";
import { DispositionDonutChart } from "../CaseDetails/components/charts/DispositionChart/DispositionDonutChart";
import { SARDispositionChartExplanation } from "../CaseDetails/components/charts/DispositionChart/SARDispositionChartExplanation";
import { getSARDispositionChartSubtitle } from "../CaseDetails/components/charts/DispositionChart/sarUtils";
import DraggableScrollContainer, {
  DraggableScrollContainerHandle,
} from "../DraggableScrollContainer/DraggableScrollContainer";
import { TimeServed } from "../TimeServed/TimeServed";
import { InfoIconWithTooltip } from "../Tooltip/Tooltip";
import {
  buildInsightsFootnoteText,
  InsightSubjectSpans,
} from "./insightsUtils";
import * as Styled from "./Summary.styles";

const ORAS_REQUIRED_MESSAGE =
  "An ORAS assessment score is required to generate this data for this client.";

function InsightsChartEmptyState({
  hasOrasAssessment,
  noDataMessage,
}: {
  hasOrasAssessment: boolean;
  noDataMessage: string;
}) {
  return (
    <Styled.InsightsEmptyState>
      <Styled.InsightsEmptyText>
        {hasOrasAssessment ? noDataMessage : ORAS_REQUIRED_MESSAGE}
      </Styled.InsightsEmptyText>
    </Styled.InsightsEmptyState>
  );
}

export const InsightsSummaryPanel: React.FC<{
  presenter: SARDetailsPresenter;
}> = observer(function InsightsSummaryPanel({ presenter }) {
  const insightData = presenter.insightData;
  const sortedDispositionData = presenter.sortedDispositionData;
  const hasOrasAssessment = presenter.offenderAssessment.hasOrasAssessment;
  const emptyStateContext = presenter.emptyStateDescriptionContext;
  const clientFullName = presenter.SARAttributes.client?.fullName;

  const carouselRef = useRef<DraggableScrollContainerHandle>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const hasDispositionData =
    !!insightData && insightData.dispositionNumRecords > 0;
  const avgPctServed = insightData?.avgPctServed ?? null;
  const hasTimeServedData =
    !!insightData &&
    insightData.timeServedNumRecords != null &&
    insightData.timeServedNumRecords > 0 &&
    avgPctServed != null;

  if (!insightData && !emptyStateContext) return null;

  const slideFootnotes = [
    hasDispositionData
      ? buildInsightsFootnoteText(
          insightData.dispositionNumRecords,
          insightData.gender,
          insightData.assessmentScoreBucketStart,
        )
      : null,
    hasTimeServedData && insightData.timeServedNumRecords != null
      ? buildInsightsFootnoteText(
          insightData.timeServedNumRecords,
          insightData.gender,
          insightData.assessmentScoreBucketStart,
        )
      : null,
  ];

  const sentenceDistributionSlide = hasDispositionData ? (
    <Styled.InsightsChartCard>
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
          {printFormattedRecordString(insightData.dispositionNumRecords)})
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
  ) : (
    <Styled.InsightsChartCard $isEmpty>
      <CommonStyled.ChartTitle>Sentence Distribution</CommonStyled.ChartTitle>
      <InsightsChartEmptyState
        hasOrasAssessment={hasOrasAssessment}
        noDataMessage="There are no previous sentencing records matching this client's gender, risk score, and offense."
      />
    </Styled.InsightsChartCard>
  );

  const timeServedSlide =
    insightData &&
    insightData.timeServedNumRecords != null &&
    insightData.timeServedNumRecords > 0 &&
    avgPctServed != null ? (
      <Styled.InsightsChartCard>
        <Styled.InsightsChartTitleRow>
          <CommonStyled.ChartTitle>
            Average Time Served{" "}
            <InfoIconWithTooltip
              headerText="Average Time Served"
              content={
                <CommonStyled.ChartTooltipContentSection>
                  Average Time Served shows the average amount of time served in
                  prison for{" "}
                  <InsightSubjectSpans
                    gender={insightData.gender}
                    assessmentScoreBucketStart={
                      insightData.assessmentScoreBucketStart
                    }
                    offense={insightData.offense}
                    offenseCategory={insightData.offenseCategory}
                  />{" "}
                  before being granted parole, using MODOC data from 2017 to
                  present.
                </CommonStyled.ChartTooltipContentSection>
              }
            />
          </CommonStyled.ChartTitle>
        </Styled.InsightsChartTitleRow>
        <CommonStyled.ChartSubTitle>
          {getSARDispositionChartSubtitle(insightData)}{" "}
          <span>
            (Based on {insightData.timeServedNumRecords.toLocaleString()}{" "}
            {printFormattedRecordString(insightData.timeServedNumRecords)})
          </span>
        </CommonStyled.ChartSubTitle>
        <Styled.TimeServedPanelStatsRow>
          <Styled.TimeServedPanelStatColumn>
            <Styled.TimeServedPanelStatLabel>
              Average time served:
            </Styled.TimeServedPanelStatLabel>
            <Styled.TimeServedPanelStatValue>
              {formatTimeServedPct(avgPctServed)}%
            </Styled.TimeServedPanelStatValue>
          </Styled.TimeServedPanelStatColumn>
        </Styled.TimeServedPanelStatsRow>
        <Styled.TimeServedChartWrapper>
          <TimeServed
            avgPctServed={avgPctServed}
            fillColor={palette.data.cornflower1}
            barHeight={100}
            labelColor={palette.slate70}
            labelStyle={Styled.timeServedPanelLabelStyle}
            showLabelsAbove={false}
          />
        </Styled.TimeServedChartWrapper>
      </Styled.InsightsChartCard>
    ) : (
      <Styled.InsightsChartCard $isEmpty>
        <Styled.InsightsChartTitleRow>
          <CommonStyled.ChartTitle>Average Time Served</CommonStyled.ChartTitle>
        </Styled.InsightsChartTitleRow>
        <InsightsChartEmptyState
          hasOrasAssessment={hasOrasAssessment}
          noDataMessage="There are not enough historical records of time served to show this data."
        />
      </Styled.InsightsChartCard>
    );

  return (
    <Styled.InsightsSidePanel>
      <Styled.SectionTitle>Insights</Styled.SectionTitle>
      {hasDispositionData && (
        <Styled.InsightsSubtitle>
          This information represents outcomes for cases similar to that of the
          current client
          {clientFullName ? `, ${clientFullName},` : ""} based on gender, risk
          score, and type of conviction. The statistics below are pulled from
          historical sentencing data and will appear in the report to provide
          context for judges, attorneys, and others involved in the case.
        </Styled.InsightsSubtitle>
      )}
      <DraggableScrollContainer
        ref={carouselRef}
        scrollOffset={Styled.INSIGHTS_CHART_SCROLL_OFFSET}
        hideArrowButtons
        onSlideChange={setCurrentSlide}
      >
        <Styled.Charts>
          {sentenceDistributionSlide}
          {timeServedSlide}
        </Styled.Charts>
      </DraggableScrollContainer>
      <Styled.CarouselNav>
        <Styled.CarouselArrowButton
          onClick={() => carouselRef.current?.scrollLeft()}
          aria-label="Scroll left"
        >
          <ChevronLeftIcon />
        </Styled.CarouselArrowButton>
        <Styled.CarouselArrowButton
          onClick={() => carouselRef.current?.scrollRight()}
          aria-label="Scroll right"
        >
          <ChevronRightIcon />
        </Styled.CarouselArrowButton>
      </Styled.CarouselNav>
      {slideFootnotes[currentSlide] && (
        <Styled.InsightsFootnote>
          {slideFootnotes[currentSlide]}
        </Styled.InsightsFootnote>
      )}
    </Styled.InsightsSidePanel>
  );
});
