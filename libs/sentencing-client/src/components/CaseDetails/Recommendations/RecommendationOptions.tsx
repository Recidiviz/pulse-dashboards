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

import { formatListWithAnd, formatPercentage } from "../../../utils/utils";
import CheckIcon from "../../assets/green-check-icon.svg?react";
import { InfoIconWithTooltip } from "../../Tooltip/Tooltip";
import * as Styled from "../CaseDetails.styles";
import { NONE_OPTION, OTHER_OPTION } from "../Form/constants";
import { RecommendationType } from "../types";
import { RecommendationOption, RecommendationsOptionProps } from "./types";

export const OpportunitiesList: React.FC<{
  opportunities: RecommendationOption["opportunities"];
  firstName?: string;
  matchingRecommendationOptionsForOpportunities?: (
    | RecommendationType
    | string
  )[];
}> = ({
  opportunities,
  firstName,
  matchingRecommendationOptionsForOpportunities,
}) => {
  const recommendationWord =
    matchingRecommendationOptionsForOpportunities?.length === 1
      ? `recommendation`
      : `recommendations`;
  const formattedRecommendationNames = formatListWithAnd(
    matchingRecommendationOptionsForOpportunities,
    "",
  );
  const recommendationPhraseText = `${formattedRecommendationNames} ${recommendationWord}`;
  const tooltipText = `When you add opportunities from the “Opportunities${firstName && ` for ${firstName}`}” table, they will appear here under your ${recommendationPhraseText}.`;

  return (
    <Styled.OpportunitiesSelections>
      <Styled.OpportunitiesWrapper>
        <Styled.OpportunitiesText>Opportunities:</Styled.OpportunitiesText>
        <InfoIconWithTooltip headerText="Opportunities" content={tooltipText} />
      </Styled.OpportunitiesWrapper>

      {opportunities?.length ? (
        opportunities.map((opportunity) => (
          <Styled.OpportunitiesWrapper key={opportunity}>
            <CheckIcon width="17px" height="17px" />
            <Styled.OpportunitiesText>{opportunity}</Styled.OpportunitiesText>
          </Styled.OpportunitiesWrapper>
        ))
      ) : (
        <span>None yet</span>
      )}
    </Styled.OpportunitiesSelections>
  );
};

export const HistoricalOutcomes: React.FC<{ option: RecommendationOption }> = ({
  option,
}) => {
  const { recidivismRate, historicalSentencingRate } = option;
  const isMissingRecidivismAndHistoricalSentencingRates =
    !recidivismRate && !historicalSentencingRate;

  return (
    <Styled.RecommendationOutcome>
      <Styled.PercentageWrapper>
        <Styled.Percentage>
          {formatPercentage(recidivismRate) ?? "—%"}
        </Styled.Percentage>
        <Styled.PercentageLabel>Recidivism Rate</Styled.PercentageLabel>
      </Styled.PercentageWrapper>
      <Styled.PercentageWrapper>
        <Styled.Percentage>
          {formatPercentage(historicalSentencingRate) ??
            (isMissingRecidivismAndHistoricalSentencingRates ? "—%" : "0")}
        </Styled.Percentage>
        <Styled.PercentageLabel>Of Previous Sentences</Styled.PercentageLabel>
      </Styled.PercentageWrapper>
    </Styled.RecommendationOutcome>
  );
};

export const RecommendationOptionBase: React.FC<RecommendationsOptionProps> = ({
  option,
  isSelectedRecommendation,
  handleRecommendationUpdate,
  smallFont,
  isRecorded,
  isDisabled,
  children,
}) => {
  return (
    <Styled.RecommendationOption
      selected={isSelectedRecommendation && !isDisabled}
      key={option.key}
      onClick={() => !isDisabled && handleRecommendationUpdate(option.key)}
      isDisabled={isDisabled}
    >
      <Styled.InputSelection
        id={option.key}
        type="radio"
        checked={isSelectedRecommendation}
        disabled={isDisabled}
        readOnly
      />
      <Styled.RecommendationDetails>
        <Styled.RecommendationOptionLabel
          htmlFor={option.key}
          smallFont={smallFont}
        >
          {option.label}{" "}
          {isRecorded && <Styled.Chip color={"teal"}>Recorded</Styled.Chip>}
        </Styled.RecommendationOptionLabel>
        {children}
      </Styled.RecommendationDetails>
    </Styled.RecommendationOption>
  );
};

export const RecommendationRadioOption: React.FC<{
  optionProps: RecommendationsOptionProps;
  firstName?: string;
}> = ({ optionProps, firstName }) => {
  const {
    isSelectedRecommendation,
    option,
    matchingRecommendationOptionsForOpportunities,
  } = optionProps;

  const showOpportunities =
    option.key !== NONE_OPTION &&
    isSelectedRecommendation &&
    (matchingRecommendationOptionsForOpportunities?.includes(option.key) ||
      !matchingRecommendationOptionsForOpportunities);
  const isNoneOrOther = [OTHER_OPTION, NONE_OPTION].includes(option.key);

  return (
    <RecommendationOptionBase {...optionProps}>
      {showOpportunities && (
        <OpportunitiesList
          opportunities={option.opportunities}
          firstName={firstName}
          matchingRecommendationOptionsForOpportunities={
            matchingRecommendationOptionsForOpportunities
          }
        />
      )}
      {!isNoneOrOther && <HistoricalOutcomes option={option} />}
    </RecommendationOptionBase>
  );
};
