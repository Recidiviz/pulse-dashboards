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

import React, { Fragment, useState } from "react";

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
  handleRecommendationUpdate,
  saveRecommendation,
  setCaseStatusCompleted,
}) => {
  const [showSummaryReport, setShowSummaryReport] = useState(false);

  const hideSummaryReport = () => setShowSummaryReport(false);

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
      recidivismRate: 22, // Placeholder until insights data is connected
      historicalSentencingRate: 23, // Placeholder until insights data is connected
    },
    {
      key: RecommendationType.Rider,
      label: RecommendationType.Rider,
      recidivismRate: 32,
      historicalSentencingRate: 47,
    },
    {
      key: RecommendationType.Term,
      label: RecommendationType.Term,
      recidivismRate: 52,
      historicalSentencingRate: 73,
    },
    {
      key: RecommendationType.None,
      label: "I do not wish to make a recommendation",
    },
  ];

  return (
    <>
      {showSummaryReport && (
        <SummaryReport
          fullName={fullName}
          firstName={firstName}
          hideSummaryReport={hideSummaryReport}
          setCaseStatusCompleted={setCaseStatusCompleted}
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
                    <ProbationOption optionProps={baseProps} />
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
            }}
          >
            {lastSavedRecommendation ? "Update" : "Create"}
          </Styled.ActionButton>
          <Styled.Description>
            Clicking “Create” or "Update" will generate a downloadable report
            for the judge.
          </Styled.Description>
        </Styled.RecommendationActionButtonWrapper>
      </Styled.Recommendations>
    </>
  );
};
