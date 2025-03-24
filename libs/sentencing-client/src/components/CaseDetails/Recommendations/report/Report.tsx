// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { CaseInsight } from "../../../../api";
import { GeoConfig } from "../../../../geoConfigs/types";
import { printFormattedRecordString } from "../../../../utils/utils";
import InfoIcon from "../../../assets/info-icon.svg?react";
import RecidivizLogo from "../../../assets/recidiviz-logo-bw.png";
import { SelectedRecommendation } from "../../../CaseDetails/types";
import { INDIVIDUALS_STRING } from "../../components/charts/common/constants";
import {
  getSubtitleGender,
  getSubtitleLsirScore,
} from "../../components/charts/common/utils";
import { DispositionChartExplanation } from "../../components/charts/DispositionChart/DispositionChartExplanation";
import {
  OffenseText,
  RecidivismChartExplanation,
} from "../../components/charts/RecidivismChart/RecidivismChartExplanation";
import { RecommendationOptionType } from "../constants";
import {
  DispositionSectionForSentenceLength,
  DispositionSectionForSentenceType,
  RecidivismRateSectionForSentenceLength,
  RecidivismRateSectionForSentenceType,
} from "./components";
import * as Styled from "./Report.styles";

interface ReportProps {
  fullName?: string;
  externalId: string;
  age?: number;
  selectedRecommendation: SelectedRecommendation;
  insight?: CaseInsight;
  geoConfig: GeoConfig;
}

function Header() {
  return (
    <Styled.Header>
      <div>Report Attachment</div>
      <div>{moment().utc().format("MMMM DD, YYYY")}</div>
    </Styled.Header>
  );
}

function Footer() {
  return (
    <Styled.Footer>
      <div>
        Report provided by
        <img src={RecidivizLogo} width="38px" alt="Recidiviz logo" />
      </div>
    </Styled.Footer>
  );
}

interface HistoricalSentencingAttributeChipsProps {
  insight?: CaseInsight;
}

function HistoricalSentencingAttributeChips({
  insight,
}: HistoricalSentencingAttributeChipsProps) {
  if (!insight) return null;
  const numberOfRecords = insight?.dispositionNumRecords.toLocaleString();
  const genderString = getSubtitleGender(insight.gender);
  const lsirScore = getSubtitleLsirScore(
    insight.assessmentScoreBucketStart,
    insight.assessmentScoreBucketEnd,
  );

  return (
    <Styled.AttributesContainer>
      {numberOfRecords && (
        <Styled.NumberOfRecords>
          {numberOfRecords}{" "}
          {printFormattedRecordString(insight?.dispositionNumRecords)}
        </Styled.NumberOfRecords>
      )}
      <Styled.AttributeChipsWrapper>
        {genderString && genderString !== INDIVIDUALS_STRING && (
          <Styled.AttributeChip>{genderString}</Styled.AttributeChip>
        )}
        {lsirScore && <Styled.AttributeChip>{lsirScore}</Styled.AttributeChip>}
        <Styled.AttributeChip>{insight?.offense}</Styled.AttributeChip>
      </Styled.AttributeChipsWrapper>
    </Styled.AttributesContainer>
  );
}

interface CumulativeRecidivismRatesAttributeChipsProps {
  insight?: CaseInsight;
}

function CumulativeRecidivismRatesAttributeChips({
  insight,
}: CumulativeRecidivismRatesAttributeChipsProps) {
  if (!insight) return null;

  const genderString = getSubtitleGender(insight.rollupGender);
  const lsirScore = getSubtitleLsirScore(
    insight.rollupAssessmentScoreBucketStart,
    insight.rollupAssessmentScoreBucketEnd,
  );
  const numberOfRecords = insight?.rollupRecidivismNumRecords.toLocaleString();

  return (
    <Styled.AttributesContainer>
      {numberOfRecords && (
        <Styled.NumberOfRecords>
          {numberOfRecords}{" "}
          {printFormattedRecordString(insight?.rollupRecidivismNumRecords)}
        </Styled.NumberOfRecords>
      )}
      <Styled.AttributeChipsWrapper>
        {genderString && genderString !== INDIVIDUALS_STRING && (
          <Styled.AttributeChip>{genderString}</Styled.AttributeChip>
        )}
        {lsirScore && <Styled.AttributeChip>{lsirScore}</Styled.AttributeChip>}
        <Styled.AttributeChip>
          <OffenseText
            rollupOffenseDescription={insight.rollupOffenseDescription}
          />
        </Styled.AttributeChip>
      </Styled.AttributeChipsWrapper>
    </Styled.AttributesContainer>
  );
}

export function Report({
  insight,
  fullName,
  age,
  selectedRecommendation,
  geoConfig,
}: ReportProps) {
  const recommendationOptionType = geoConfig.recommendation.type;
  const recommendationOrder = geoConfig.recommendation.baseOptionsTemplate;

  const gender = (
    insight?.gender || insight?.rollupGender
  )?.toLocaleLowerCase();

  let dispositionSection;
  if (insight?.dispositionNumRecords) {
    dispositionSection =
      recommendationOptionType === RecommendationOptionType.SentenceType ? (
        <DispositionSectionForSentenceType
          insight={insight}
          recommendationOrder={recommendationOrder}
        />
      ) : (
        <DispositionSectionForSentenceLength
          insight={insight}
          recommendationOrder={recommendationOrder}
        />
      );
  } else {
    dispositionSection = (
      <Styled.RateDetailsTitle>No previous records</Styled.RateDetailsTitle>
    );
  }

  const recidivismRateSection =
    insight &&
    (recommendationOptionType === RecommendationOptionType.SentenceType ? (
      <RecidivismRateSectionForSentenceType
        insight={insight}
        recommendationOrder={recommendationOrder}
      />
    ) : (
      <RecidivismRateSectionForSentenceLength insight={insight} />
    ));

  return (
    <Styled.ReportContainer>
      <Styled.Page>
        <Header />
        <Styled.Title>Case Insights</Styled.Title>

        {/* Case Overview */}
        <Styled.SnapshotContainer>
          <Styled.SectionTitle>Overview</Styled.SectionTitle>
          <Styled.CaseOverview>
            <Styled.OverviewWrapper>
              <Styled.OverviewTitle>Name</Styled.OverviewTitle>
              <Styled.Name>{fullName}</Styled.Name>
            </Styled.OverviewWrapper>

            <Styled.OverviewWrapper>
              <Styled.OverviewTitle>Recommendation by PSI</Styled.OverviewTitle>
              <Styled.Name>{selectedRecommendation}</Styled.Name>
            </Styled.OverviewWrapper>

            <Styled.OverviewWrapper>
              <Styled.OverviewTitle>Case Details</Styled.OverviewTitle>
              <Styled.AttributeChipsWrapper>
                {insight && (
                  <>
                    <Styled.AttributeChip>
                      Gender: {gender}
                    </Styled.AttributeChip>
                    <Styled.AttributeChip>Age: {age}</Styled.AttributeChip>
                    <Styled.AttributeChip>
                      Offense: {insight.offense}
                    </Styled.AttributeChip>
                  </>
                )}
              </Styled.AttributeChipsWrapper>
            </Styled.OverviewWrapper>
          </Styled.CaseOverview>
        </Styled.SnapshotContainer>

        {/* Historical Sentencing */}
        <Styled.HistoricalBreakdown>
          <Styled.TitleAttributesWrapper>
            <Styled.SectionTitle>Historical Sentencing</Styled.SectionTitle>
            <HistoricalSentencingAttributeChips insight={insight} />
          </Styled.TitleAttributesWrapper>

          <Styled.SentencingRecidivismRateContainer>
            <Styled.DispositionCardWrapper>
              {dispositionSection}
            </Styled.DispositionCardWrapper>
            {insight && (
              <Styled.Explanation>
                <DispositionChartExplanation
                  insight={insight}
                  orgName={geoConfig.orgName}
                />
              </Styled.Explanation>
            )}
          </Styled.SentencingRecidivismRateContainer>
        </Styled.HistoricalBreakdown>

        {/* Cumulative Recidivism Rate */}
        <Styled.CumulativeBreakdown>
          <Styled.TitleAttributesWrapper>
            <Styled.SectionTitle>
              Cumulative Recidivism Rate <span>(36 months)</span>
            </Styled.SectionTitle>
            <CumulativeRecidivismRatesAttributeChips insight={insight} />
          </Styled.TitleAttributesWrapper>

          <Styled.SentencingRecidivismRateContainer>
            <Styled.SentencingRecidivismRateWrapper>
              {recidivismRateSection}
            </Styled.SentencingRecidivismRateWrapper>
            {insight && (
              <Styled.Explanation>
                <RecidivismChartExplanation
                  insight={insight}
                  recommendationOptionType={recommendationOptionType}
                  orgName={geoConfig.orgName}
                />
              </Styled.Explanation>
            )}
          </Styled.SentencingRecidivismRateContainer>
        </Styled.CumulativeBreakdown>

        {/* Recidiviz Info Page Link */}
        {geoConfig.infoPageLink && (
          <Styled.InfoPageLink>
            <InfoIcon />
            <span>
              Visit <strong> {geoConfig.infoPageLink} </strong> to learn more
              about the information presented in this report.
            </span>
          </Styled.InfoPageLink>
        )}

        <Styled.Disclaimer>
          <span>DISCLAIMER</span> This report is generated by Recidiviz and is
          for informational purposes only. Recidiviz does not guarantee the
          accuracy, completeness, validity, timeliness, or suitability of the
          information in this report and is not liable for any errors,
          omissions, or consequences of using the information. The information
          is not legal advice. Data on past conduct is not a guarantee of future
          outcomes. Users are solely responsible for their use of the
          information and agree that Recidiviz is not liable for any claim,
          loss, or damage arising from the use of this report.
        </Styled.Disclaimer>
        <Footer />
      </Styled.Page>
    </Styled.ReportContainer>
  );
}
