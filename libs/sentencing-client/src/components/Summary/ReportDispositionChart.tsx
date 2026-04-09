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

import { arc, pie, PieArcDatum } from "d3-shape";
import React from "react";

import { SARInsight } from "../../api";
import {
  convertDecimalToPercentage,
  formatOffenseLabel,
  printFormattedRecordString,
} from "../../utils/utils";
import {
  getDescriptionGender,
  getSentenceLengthBucketLabel,
} from "../CaseDetails/components/charts/common/utils";
import { BUCKET_TO_RISK_LEVEL } from "../CaseDetails/components/charts/DispositionChart/sarUtils";
import { GenderToDisplayName } from "../CaseDetails/constants";
import { SentencingAssessmentReportSection } from "./ReportBlock";
import {
  arcFill,
  DISPOSITION_FILL,
  DonutPatternDefs,
  FALLBACK_FILL,
  LEGEND_LABELS,
  LegendSwatch,
} from "./ReportDispositionPatterns";
import * as Styled from "./SentencingAssessmentReport.styles";

const SECTION_TITLE = "Historical Outcome Reference";

// Maps assessmentScoreBucketStart to chip label and description-level risk string
const BUCKET_TO_ORAS_CHIP: Record<number, string> = {
  0: "ORAS LOW RISK SCORE",
  1: "ORAS MODERATE RISK SCORE",
  2: "ORAS HIGH RISK SCORE",
  3: "ORAS VERY HIGH RISK SCORE",
};

const DONUT_SIZE = 260;
const DONUT_RADIUS = DONUT_SIZE / 2;
const INNER_RADIUS = Math.round(DONUT_RADIUS * 0.4);

type DataPoint = NonNullable<SARInsight>["dispositionData"][number];

const pieGenerator = pie<DataPoint>()
  .value((d) => d.percentage)
  .sort(null);
const arcGenerator = arc<PieArcDatum<DataPoint>>()
  .innerRadius(INNER_RADIUS)
  .outerRadius(DONUT_RADIUS);

export type InsightDescriptionContext = {
  gender: NonNullable<SARInsight>["gender"];
  assessmentScoreBucketStart: number | null;
  offense: NonNullable<SARInsight>["offense"];
  offenseCategory: NonNullable<SARInsight>["offenseCategory"];
};

interface InsightSubjectSpansProps extends InsightDescriptionContext {
  asterisk?: boolean;
}

/** Renders the bold inline subject segment shared by the full and empty chart states. */
function InsightSubjectSpans({
  gender,
  assessmentScoreBucketStart,
  offense,
  offenseCategory,
  asterisk = false,
}: InsightSubjectSpansProps) {
  const genderString = getDescriptionGender(gender);
  const offenseDescriptor =
    offenseCategory ?? formatOffenseLabel(offense).replace(/\s*offenses$/i, "");

  // Omit risk level clause when no valid bucket is available (e.g. no ORAS assessment).
  if (assessmentScoreBucketStart == null) {
    return (
      <>
        <span>{genderString.trim()}</span> with{" "}
        <span>{offenseDescriptor} convictions</span>
      </>
    );
  }

  const riskLevel =
    BUCKET_TO_RISK_LEVEL[assessmentScoreBucketStart] ?? "unknown risk";
  return (
    <>
      <span>{genderString.trim()}</span> with{" "}
      <span>
        {riskLevel} scores{asterisk ? "*" : ""}
      </span>{" "}
      with <span>{offenseDescriptor} convictions</span>
    </>
  );
}

interface DonutChartProps {
  pieData: DataPoint[];
}

function DispositionDonutSVG({ pieData }: DonutChartProps) {
  const arcs = pieGenerator(pieData);

  return (
    <Styled.DispositionSVG width={DONUT_SIZE} height={DONUT_SIZE}>
      <DonutPatternDefs />
      <g transform={`translate(${DONUT_RADIUS}, ${DONUT_RADIUS})`}>
        {arcs.map((dp) => {
          const label = getSentenceLengthBucketLabel(
            dp.data.recommendationType,
            dp.data.sentenceLengthBucketStart,
            dp.data.sentenceLengthBucketEnd,
          );
          const config = DISPOSITION_FILL[label] ?? FALLBACK_FILL;
          return (
            <path
              key={label}
              d={arcGenerator(dp) ?? undefined}
              fill={arcFill(config)}
              stroke="white"
              strokeWidth={1}
            />
          );
        })}
      </g>
    </Styled.DispositionSVG>
  );
}

interface ReportDispositionChartEmptyProps {
  descriptionContext: InsightDescriptionContext | null;
}

export const ReportDispositionChartEmpty: React.FC<
  ReportDispositionChartEmptyProps
> = ({ descriptionContext }) => (
  <SentencingAssessmentReportSection
    title={SECTION_TITLE}
    noHeaderMargin
    titleRight={
      <Styled.DispositionEmptyBadge>0 Records</Styled.DispositionEmptyBadge>
    }
  >
    <Styled.DispositionEmptyContainer>
      <Styled.DispositionEmptyContent>
        <Styled.DispositionEmptyTitle>
          Sentence Distribution
        </Styled.DispositionEmptyTitle>
        <Styled.DispositionEmptySubheading>
          No previous records
        </Styled.DispositionEmptySubheading>
        <Styled.DispositionEmptyText>
          Sentence Distribution represents the percentage of cases sentenced to
          a particular disposition, using MODOC data from 2020 to present.
          {descriptionContext && (
            <>
              {" "}
              There are no previous records of{" "}
              <InsightSubjectSpans {...descriptionContext} />.
            </>
          )}
        </Styled.DispositionEmptyText>
      </Styled.DispositionEmptyContent>
    </Styled.DispositionEmptyContainer>
  </SentencingAssessmentReportSection>
);

interface ReportDispositionChartProps {
  insight: NonNullable<SARInsight>;
  sortedDispositionData: NonNullable<SARInsight>["dispositionData"];
}

export const ReportDispositionChart: React.FC<ReportDispositionChartProps> = ({
  insight,
  sortedDispositionData,
}) => {
  const {
    gender,
    assessmentScoreBucketStart,
    offense,
    offenseCategory,
    dispositionNumRecords,
  } = insight;

  const genderChip = GenderToDisplayName[gender] ?? gender;
  const orasChip =
    BUCKET_TO_ORAS_CHIP[assessmentScoreBucketStart] ?? "ORAS RISK SCORE";
  const offenseChip = `Category: ${(offenseCategory ?? offense).toUpperCase()}`;

  const percentageByLabel = Object.fromEntries(
    sortedDispositionData.map((dp) => [
      getSentenceLengthBucketLabel(
        dp.recommendationType,
        dp.sentenceLengthBucketStart,
        dp.sentenceLengthBucketEnd,
      ),
      dp.percentage,
    ]),
  );

  const pieData = sortedDispositionData.filter((dp) => dp.percentage > 0);

  return (
    <SentencingAssessmentReportSection title={SECTION_TITLE}>
      <Styled.DispositionChipsRow>
        <Styled.InsightChip>{genderChip}</Styled.InsightChip>
        <Styled.InsightChip>{orasChip}</Styled.InsightChip>
        <Styled.InsightChip>{offenseChip}</Styled.InsightChip>
      </Styled.DispositionChipsRow>

      <Styled.DispositionTwoColumnRow>
        <Styled.DispositionLeftPanel>
          <Styled.DispositionLeftPanelTitle>
            Sentence Distribution
          </Styled.DispositionLeftPanelTitle>
          <Styled.DispositionLeftPanelText>
            Historical precedent represents the percentage of cases sentenced to
            a particular disposition. The rates are based on{" "}
            {dispositionNumRecords.toLocaleString()}{" "}
            {printFormattedRecordString(dispositionNumRecords)} of{" "}
            <InsightSubjectSpans
              gender={gender}
              assessmentScoreBucketStart={assessmentScoreBucketStart}
              offense={offense}
              offenseCategory={offenseCategory}
              asterisk
            />
            , using MODOC data from 2020-present.
          </Styled.DispositionLeftPanelText>
        </Styled.DispositionLeftPanel>

        <Styled.DispositionRightPanel>
          <Styled.DispositionRecordBadge>
            {dispositionNumRecords.toLocaleString()} Records
          </Styled.DispositionRecordBadge>

          <Styled.DispositionChartRow>
            <DispositionDonutSVG pieData={pieData} />

            <Styled.DispositionLegendList>
              {LEGEND_LABELS.map((label) => {
                const rawPct = percentageByLabel[label] ?? 0;
                const pct = convertDecimalToPercentage(rawPct);
                const config = DISPOSITION_FILL[label] ?? FALLBACK_FILL;
                return (
                  <Styled.DispositionLegendItem key={label}>
                    <LegendSwatch config={config} />
                    <Styled.DispositionLegendLabel>
                      {label} - <span>{pct}%</span>
                    </Styled.DispositionLegendLabel>
                  </Styled.DispositionLegendItem>
                );
              })}
            </Styled.DispositionLegendList>
          </Styled.DispositionChartRow>
        </Styled.DispositionRightPanel>
      </Styled.DispositionTwoColumnRow>
    </SentencingAssessmentReportSection>
  );
};
