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

import { keyBy } from "lodash";
import React, { Fragment, useState } from "react";

import {
  convertDecimalToPercentage,
  pluralizeDuplicates,
} from "../../../utils/utils";
import * as Styled from "../CaseDetails.styles";
import { createOpportunityProviderDisplayName } from "../Opportunities/utils";
import { RecommendationType } from "../types";
import {
  NoneOption,
  ProbationOption,
  TermOrRiderOption,
} from "./RecommendationOptions";
import { SummaryReport } from "./SummaryReport";
import { RecommendationOption, RecommendationsProps } from "./types";

// TODO(Recidiviz/recidiviz-data#30651) Implement Recommendations flow
export const Recommendations: React.FC<RecommendationsProps> = ({
  firstName,
  fullName,
  selectedRecommendation,
  lastSavedRecommendation,
  recommendedOpportunities,
  insight,
  needs,
  gender,
  externalId,
  analytics,
  handleRecommendationUpdate,
  saveRecommendation,
  setCaseStatusCompleted,
}) => {
  const {
    trackCreateOrUpdateRecommendationClicked,
    trackCopySummaryToClipboardClicked,
    trackDownloadReportClicked,
    trackCaseStatusCompleteClicked,
  } = analytics;

  const [showSummaryReport, setShowSummaryReport] = useState(false);

  const hideSummaryReport = () => setShowSummaryReport(false);

  const { dispositionData, rollupRecidivismSeries } = insight ?? {};

  const dispositionDataByRecommendationType = keyBy(
    dispositionData,
    "recommendationType",
  );
  const rollUpRecidivismSeriesByRecommendationType = keyBy(
    rollupRecidivismSeries,
    "recommendationType",
  );

  const probationDatapoints =
    rollUpRecidivismSeriesByRecommendationType["Probation"]?.dataPoints;
  const riderDatapoints =
    rollUpRecidivismSeriesByRecommendationType["Rider"]?.dataPoints;
  const termDatapoints =
    rollUpRecidivismSeriesByRecommendationType["Term"]?.dataPoints;

  const probationRecidivismRate =
    probationDatapoints &&
    convertDecimalToPercentage(
      probationDatapoints[probationDatapoints.length - 1].eventRate,
    );
  const probationHistoricalRate =
    dispositionDataByRecommendationType[RecommendationType.Probation] &&
    convertDecimalToPercentage(
      dispositionDataByRecommendationType[RecommendationType.Probation]
        .percentage,
    );
  const riderRecidivismRate =
    riderDatapoints &&
    convertDecimalToPercentage(
      riderDatapoints[riderDatapoints.length - 1].eventRate,
    );
  const riderHistoricalRate =
    dispositionDataByRecommendationType[RecommendationType.Rider] &&
    convertDecimalToPercentage(
      dispositionDataByRecommendationType[RecommendationType.Rider]?.percentage,
    );
  const termRecidivismRate =
    termDatapoints &&
    convertDecimalToPercentage(
      termDatapoints[termDatapoints.length - 1].eventRate,
    );
  const termHistoricalRate =
    dispositionDataByRecommendationType[RecommendationType.Term] &&
    convertDecimalToPercentage(
      dispositionDataByRecommendationType[RecommendationType.Term]?.percentage,
    );

  const recommendationOptions: RecommendationOption[] = [
    {
      key: RecommendationType.Probation,
      label: RecommendationType.Probation,
      opportunities: recommendedOpportunities?.map((opp) =>
        createOpportunityProviderDisplayName(
          opp.opportunityName,
          opp.providerName,
        ),
      ),
      recidivismRate: probationRecidivismRate,
      historicalSentencingRate: probationHistoricalRate,
    },
    {
      key: RecommendationType.Rider,
      label: RecommendationType.Rider,
      recidivismRate: riderRecidivismRate,
      historicalSentencingRate: riderHistoricalRate,
    },
    {
      key: RecommendationType.Term,
      label: RecommendationType.Term,
      recidivismRate: termRecidivismRate,
      historicalSentencingRate: termHistoricalRate,
    },
    {
      key: RecommendationType.None,
      label: "I do not wish to make a recommendation",
    },
  ];

  const updateOrCreateDisplayText = lastSavedRecommendation
    ? "Update"
    : "Create";

  const opportunityDescriptions = recommendedOpportunities
    ?.map((opp) => opp.genericDescription)
    .filter((desc) => desc) as string[] | undefined;

  return (
    <>
      {showSummaryReport && (
        <SummaryReport
          fullName={fullName}
          firstName={firstName}
          insight={insight}
          externalId={externalId}
          selectedRecommendation={selectedRecommendation}
          opportunityDescriptions={pluralizeDuplicates(
            opportunityDescriptions ?? [],
          )}
          needs={needs}
          gender={gender}
          hideSummaryReport={hideSummaryReport}
          setCaseStatusCompleted={setCaseStatusCompleted}
          analytics={{
            trackCopySummaryToClipboardClicked,
            trackDownloadReportClicked,
            trackCaseStatusCompleteClicked,
          }}
        />
      )}

      <Styled.Recommendations>
        <Styled.RecommendationsWrapper>
          <Styled.Header>
            <Styled.Title>Create Recommendations</Styled.Title>
            <Styled.Description>
              Select the disposition below that you plan to recommend for{" "}
              {firstName}.
            </Styled.Description>
          </Styled.Header>

          <Styled.RecommendationOptionsWrapper>
            {recommendationOptions.map((option) => {
              const isSelectedRecommendation =
                selectedRecommendation === option.key;
              const isRecorded = lastSavedRecommendation === option.key;
              const isNoneOption = option.key === RecommendationType.None;
              const isProbationOption =
                option.key === RecommendationType.Probation;
              const isTermOrRiderOption =
                option.key === RecommendationType.Term ||
                option.key === RecommendationType.Rider;
              const baseProps = {
                option,
                isSelectedRecommendation,
                handleRecommendationUpdate,
                smallFont: isNoneOption,
                isRecorded,
              };

              return (
                <Fragment key={option.key}>
                  {/* None Option */}
                  {isNoneOption && <NoneOption optionProps={baseProps} />}

                  {/* Probation Option */}
                  {isProbationOption && (
                    <ProbationOption
                      optionProps={baseProps}
                      firstName={firstName}
                    />
                  )}

                  {/* Term or Rider Option */}
                  {isTermOrRiderOption && (
                    <TermOrRiderOption optionProps={baseProps} />
                  )}
                </Fragment>
              );
            })}
          </Styled.RecommendationOptionsWrapper>
        </Styled.RecommendationsWrapper>

        {/* Continue */}
        <Styled.RecommendationActionButtonWrapper>
          <Styled.ActionButton
            fullWidth
            onClick={() => {
              setShowSummaryReport(true);
              saveRecommendation();
              trackCreateOrUpdateRecommendationClicked(
                lastSavedRecommendation ? "update" : "create",
              );
            }}
          >
            {updateOrCreateDisplayText}
          </Styled.ActionButton>
          <Styled.Description rightPadding={36}>
            Clicking "{updateOrCreateDisplayText}" will generate a downloadable
            report for the judge.
          </Styled.Description>
        </Styled.RecommendationActionButtonWrapper>
      </Styled.Recommendations>
    </>
  );
};
