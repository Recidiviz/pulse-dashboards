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

import {
  computeAvgTimeServedYears,
  formatTimeServedPct,
  printFormattedRecordString,
} from "../../utils/utils";
import { TimeServed } from "../TimeServed/TimeServed";
import {
  buildInsightsFootnoteText,
  InsightDescriptionContext,
  InsightSubjectSpans,
} from "./insightsUtils";
import { ReportBlock, SectionContinuationHeader } from "./ReportBlock";
import * as Styled from "./SentencingAssessmentReport.styles";

const TIME_SERVED_CALCULATOR_URL = "https://www.courts.mo.gov/sentencing-calc";

const SECTION_TITLE = "Historical Outcome Reference";

interface ReportTimeServedEmptyProps {
  descriptionContext: InsightDescriptionContext;
}

export const ReportTimeServedEmpty: React.FC<ReportTimeServedEmptyProps> = ({
  descriptionContext,
}) => (
  <ReportBlock>
    <SectionContinuationHeader title={`${SECTION_TITLE} Continued...`} />
    <Styled.DispositionEmptyContainer>
      <Styled.DispositionEmptyContent>
        <Styled.DispositionEmptyTitle>
          Average Time Served
        </Styled.DispositionEmptyTitle>
        <Styled.DispositionEmptySubheading>
          There are not enough historical records of time served to show this
          data.
        </Styled.DispositionEmptySubheading>
        <Styled.DispositionEmptyText>
          Average Time Served shows the average amount of time served in prison
          for <InsightSubjectSpans {...descriptionContext} /> before being
          granted parole. There are not enough previous records to show.
        </Styled.DispositionEmptyText>
      </Styled.DispositionEmptyContent>
    </Styled.DispositionEmptyContainer>
  </ReportBlock>
);

interface ReportTimeServedProps {
  descriptionContext: InsightDescriptionContext;
  avgSentenceLengthYears: number;
  /** Percentage of sentence served (0–100), as returned by BigQuery avg_pct_served. */
  avgPctServed: number;
  timeServedNumRecords: number;
}

export const ReportTimeServed: React.FC<ReportTimeServedProps> = ({
  descriptionContext,
  avgSentenceLengthYears,
  avgPctServed,
  timeServedNumRecords,
}) => {
  const pct = formatTimeServedPct(avgPctServed);
  const avgTimeServedYears = computeAvgTimeServedYears(
    avgPctServed,
    avgSentenceLengthYears,
  );

  return (
    <ReportBlock>
      <SectionContinuationHeader title={`${SECTION_TITLE} Continued...`} />
      <Styled.DispositionTwoColumnRow>
        <Styled.DispositionLeftPanel>
          <Styled.DispositionLeftPanelTitle>
            Average Time Served
          </Styled.DispositionLeftPanelTitle>
          <Styled.DispositionLeftPanelText>
            Average Time Served shows the average amount of time{" "}
            <InsightSubjectSpans {...descriptionContext} /> were incarcerated
            before being granted parole. Incarceration includes jail time
            credited as well as time spent in prison. This is based on the
            average sentence length for the{" "}
            {timeServedNumRecords.toLocaleString()}{" "}
            {printFormattedRecordString(timeServedNumRecords)} of such cases,
            using MODOC data from 2020 to present.
          </Styled.DispositionLeftPanelText>
        </Styled.DispositionLeftPanel>

        <Styled.DispositionRightPanel>
          <Styled.DispositionRecordBadge>
            {timeServedNumRecords.toLocaleString()} Records
          </Styled.DispositionRecordBadge>
          <Styled.TimeServedStatsRow>
            <Styled.TimeServedStat>
              <strong>Average prison sentence:</strong> {avgSentenceLengthYears}{" "}
              years
            </Styled.TimeServedStat>
            <Styled.TimeServedStat>
              <strong>Average time served:</strong> {pct}% (~
              {avgTimeServedYears} years)
            </Styled.TimeServedStat>
          </Styled.TimeServedStatsRow>
          <TimeServed
            avgSentenceLengthYears={avgSentenceLengthYears}
            avgPctServed={avgPctServed}
          />
        </Styled.DispositionRightPanel>
      </Styled.DispositionTwoColumnRow>
      <Styled.TimeServedFootnoteContainer>
        <Styled.TimeServedFootnoteText>
          {buildInsightsFootnoteText(
            timeServedNumRecords,
            descriptionContext.gender,
            descriptionContext.assessmentScoreBucketStart,
          )}
        </Styled.TimeServedFootnoteText>
        <Styled.TimeServedFootnoteText>
          Visit{" "}
          <a href={TIME_SERVED_CALCULATOR_URL} target="_blank" rel="noreferrer">
            www.courts.mo.gov/sentencing-calc
          </a>{" "}
          to further explore the range of time a defendant may serve in prison
          based on statutory requirements and regulations.
        </Styled.TimeServedFootnoteText>
      </Styled.TimeServedFootnoteContainer>
    </ReportBlock>
  );
};
