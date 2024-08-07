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

import CheckIcon from "../../assets/green-check-icon.svg?react";
import * as Styled from "../CaseDetails.styles";
import { RecommendationOption, RecommendationsOptionProps } from "./types";

export const Opportunities: React.FC<{
  opportunities: RecommendationOption["opportunities"];
}> = ({ opportunities }) => {
  if (!opportunities) return null;
  return (
    <Styled.OpportunitiesSelections>
      <Styled.OpportunitiesWrapper>
        <Styled.OpportunitiesText>Opportunities</Styled.OpportunitiesText>
        <Styled.OpportunitiesCount>
          {opportunities.length}
        </Styled.OpportunitiesCount>
      </Styled.OpportunitiesWrapper>

      {opportunities.map((opportunity) => (
        <Styled.OpportunitiesWrapper key={opportunity}>
          <CheckIcon />
          <Styled.OpportunitiesText>{opportunity}</Styled.OpportunitiesText>
        </Styled.OpportunitiesWrapper>
      ))}
    </Styled.OpportunitiesSelections>
  );
};

export const HistoricalOutcomes: React.FC<{ option: RecommendationOption }> = ({
  option,
}) => {
  const { recidivismRate, historicalSentencingRate } = option;
  return (
    <Styled.RecommendationOutcome>
      <Styled.PercentageWrapper>
        <Styled.Percentage>{recidivismRate}%</Styled.Percentage>
        <Styled.PercentageLabel>Recidivism Rate</Styled.PercentageLabel>
      </Styled.PercentageWrapper>
      <Styled.PercentageWrapper>
        <Styled.Percentage>{historicalSentencingRate}%</Styled.Percentage>
        <Styled.PercentageLabel>Historical Sentencing</Styled.PercentageLabel>
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
  children,
}) => {
  return (
    <Styled.RecommendationOption
      selected={isSelectedRecommendation}
      key={option.key}
      onClick={() => handleRecommendationUpdate(option.key)}
    >
      <Styled.InputSelection
        id={option.key}
        type="radio"
        checked={isSelectedRecommendation}
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

export const NoneOption: React.FC<{
  optionProps: RecommendationsOptionProps;
}> = ({ optionProps }) => <RecommendationOptionBase {...optionProps} />;

export const ProbationOption: React.FC<{
  optionProps: RecommendationsOptionProps;
}> = ({ optionProps }) => {
  const { isSelectedRecommendation, option } = optionProps;
  const showOpportunities = Boolean(
    isSelectedRecommendation && option.opportunities?.length,
  );

  return (
    <RecommendationOptionBase {...optionProps}>
      {showOpportunities && (
        <Opportunities opportunities={option.opportunities} />
      )}
      <HistoricalOutcomes option={option} />
    </RecommendationOptionBase>
  );
};

export const TermOrRiderOption: React.FC<{
  optionProps: RecommendationsOptionProps;
}> = ({ optionProps }) => {
  return (
    <RecommendationOptionBase {...optionProps}>
      <HistoricalOutcomes option={optionProps.option} />
    </RecommendationOptionBase>
  );
};
