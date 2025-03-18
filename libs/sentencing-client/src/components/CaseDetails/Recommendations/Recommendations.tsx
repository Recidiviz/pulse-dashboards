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
import React, { Fragment } from "react";

import { useStore } from "../../StoreProvider/StoreProvider";
import * as Styled from "../CaseDetails.styles";
import { createOpportunityProviderDisplayName } from "../Opportunities/utils";
import { RecommendationType } from "../types";
import MandatoryMinimums from "./MandatoryMinimums";
import { RecommendationRadioOption } from "./RecommendationOptions";
import { RecommendationsProps } from "./types";
import {
  generateRecommendationOptions,
  getMandatoryMinimumsData,
} from "./utils";

const Recommendations: React.FC<RecommendationsProps> = ({
  firstName,
  geoConfig,
  selectedRecommendation,
  lastSavedRecommendation,
  recommendedOpportunities,
  insight,
  analytics,
  handleRecommendationUpdate,
  saveRecommendation,
  openSummaryReport,
  isCreatingRecommendation,
  setIsCreatingRecommendation,
}) => {
  const { caseStore, activeFeatureVariants } = useStore();
  const { trackCreateOrUpdateRecommendationClicked } = analytics;

  const optionsBase = geoConfig.recommendation.baseOptionsTemplate ?? [];
  const matchingRecommendationOptionsForOpportunities =
    geoConfig.recommendation.matchingRecommendationOptionsForOpportunities;

  const recommendedOpps = recommendedOpportunities?.map((opp) =>
    createOpportunityProviderDisplayName(opp.opportunityName, opp.providerName),
  );

  const updateOrCreateDisplayText = isCreatingRecommendation
    ? "Create"
    : "Update";

  // Mandatory Minimum
  const hasMandatoryMinimumFVEnabled = Boolean(
    activeFeatureVariants["mandatoryMinimum"],
  );
  const currentOffense = caseStore.caseAttributes.offense;
  const {
    mandatoryMinimums,
    mandatoryMinimumAutoSelectionRecommendation,
    disabledMandatoryMinimumOptions,
  } = currentOffense
    ? getMandatoryMinimumsData(
        optionsBase,
        caseStore.offensesByName[currentOffense]?.mandatoryMinimums,
      )
    : {};

  return (
    <Styled.Recommendations>
      <Styled.RecommendationsContainer>
        <Styled.RecommendationsWrapper>
          <Styled.Header>
            <Styled.Title>Create Recommendations</Styled.Title>
            <Styled.Description>
              Select the disposition below that you plan to recommend for{" "}
              {firstName}.
            </Styled.Description>
          </Styled.Header>
          <MandatoryMinimums
            mandatoryMinimums={mandatoryMinimums}
            hasMandatoryMinimumFVEnabled={hasMandatoryMinimumFVEnabled}
            mandatoryMinimumAutoSelectionRecommendation={
              mandatoryMinimumAutoSelectionRecommendation
            }
            handleRecommendationUpdate={handleRecommendationUpdate}
          />
          <Styled.RecommendationOptionsWrapper>
            {generateRecommendationOptions(
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
                isDisabled:
                  hasMandatoryMinimumFVEnabled &&
                  disabledMandatoryMinimumOptions?.length
                    ? disabledMandatoryMinimumOptions.includes(option.key)
                    : false,
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
              openSummaryReport();
              saveRecommendation();
              trackCreateOrUpdateRecommendationClicked(
                lastSavedRecommendation ? "update" : "create",
              );
              setIsCreatingRecommendation(
                lastSavedRecommendation ? false : true,
              );
            }}
          >
            {updateOrCreateDisplayText}
          </Styled.ActionButton>
          <Styled.Description rightPadding={100}>
            Clicking "{updateOrCreateDisplayText}" will generate a downloadable
            report for the judge.
          </Styled.Description>
        </Styled.RecommendationActionButtonWrapper>
      </Styled.RecommendationsContainer>
    </Styled.Recommendations>
  );
};

export default observer(Recommendations);
