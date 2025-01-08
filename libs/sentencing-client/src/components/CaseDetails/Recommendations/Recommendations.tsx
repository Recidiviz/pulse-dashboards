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

import { observer } from "mobx-react-lite";
import React, { Fragment, useState } from "react";

import { GEO_CONFIG } from "../../../../src/geoConfigs/geoConfigs";
import { pluralizeDuplicates } from "../../../utils/utils";
import * as Styled from "../CaseDetails.styles";
import { createOpportunityProviderDisplayName } from "../Opportunities/utils";
import { RecommendationType } from "../types";
import { RecommendationOptionType } from "./constants";
import { RecommendationRadioOption } from "./RecommendationOptions";
import { SummaryReport } from "./SummaryReport";
import { RecommendationsProps } from "./types";
import { generateRecommendationOptions } from "./utils";

const Recommendations: React.FC<RecommendationsProps> = ({
  firstName,
  lastName,
  fullName,
  age,
  stateCode,
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

  const optionsBase =
    GEO_CONFIG[stateCode]?.recommendation.baseOptionsTemplate ?? [];
  const recommendationOptionType =
    GEO_CONFIG[stateCode]?.recommendation.type ??
    RecommendationOptionType.SentenceType;
  const matchingRecommendationOptionsForOpportunities =
    GEO_CONFIG[stateCode]?.recommendation
      .matchingRecommendationOptionsForOpportunities;

  const recommendedOpps = recommendedOpportunities?.map((opp) =>
    createOpportunityProviderDisplayName(opp.opportunityName, opp.providerName),
  );

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
          lastName={lastName}
          stateCode={stateCode}
          age={age}
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
            {generateRecommendationOptions(
              recommendationOptionType,
              optionsBase,
              insight,
              recommendedOpps,
            ).map((option) => {
              const isSelectedRecommendation =
                selectedRecommendation === option.key;
              const isRecorded = lastSavedRecommendation === option.key;
              const isNoneOption = option.key === RecommendationType.None;
              const baseProps = {
                option,
                isSelectedRecommendation,
                handleRecommendationUpdate,
                smallFont: isNoneOption,
                isRecorded,
                matchingRecommendationOptionsForOpportunities,
              };

              return (
                <Fragment key={option.key}>
                  <RecommendationRadioOption
                    optionProps={baseProps}
                    firstName={firstName}
                  />
                </Fragment>
              );
            })}
          </Styled.RecommendationOptionsWrapper>
        </Styled.RecommendationsWrapper>

        {/* Continue */}
        <Styled.RecommendationActionButtonWrapper>
          <Styled.ActionButton
            fullWidth
            disabled={!selectedRecommendation}
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

export default observer(Recommendations);
