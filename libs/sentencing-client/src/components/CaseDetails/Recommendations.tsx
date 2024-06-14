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

import verifiedIcon from "../assets/verified-icon.svg";
import * as Styled from "./CaseDetails.styles";
import { RecommendationType } from "./types";

type RecommendationsProps = {
  selectedRecommendation?: RecommendationType;
  updateRecommendation: (recommendation: RecommendationType) => void;
};

// TODO(Recidiviz/recidiviz-data#30651) Implement Recommendations flow
export const Recommendations: React.FC<RecommendationsProps> = ({
  selectedRecommendation,
  updateRecommendation,
}) => {
  return (
    <Styled.Recommendations>
      <Styled.RecommendationsWrapper>
        <Styled.Header>
          <Styled.Title>Recommendations</Styled.Title>
          <Styled.Description>
            Select the disposition below that you plan to recommend for Joshua.
            Then click “Generate Recommendation” to generate a summary paragraph
            and downloadable insights report for the judge.
          </Styled.Description>
        </Styled.Header>

        {/* Probation */}
        <Styled.RecommendationOption
          selected={selectedRecommendation === RecommendationType.Probation}
        >
          <Styled.Checkbox
            type="checkbox"
            checked={selectedRecommendation === RecommendationType.Probation}
            onChange={() => updateRecommendation(RecommendationType.Probation)}
          />
          <Styled.RecommendationDetails>
            <Styled.RecommendationOptionLabel>
              Probation
            </Styled.RecommendationOptionLabel>
            <Styled.OpportunitiesSelections>
              <Styled.OpportunitiesWrapper>
                <Styled.OpportunitiesText>
                  Opportunities
                </Styled.OpportunitiesText>
                <Styled.OpportunitiesCount>0</Styled.OpportunitiesCount>
              </Styled.OpportunitiesWrapper>
              <Styled.OpportunitiesWrapper>
                <Styled.NoOpportunitiesSelectedText>
                  None Yet
                </Styled.NoOpportunitiesSelectedText>
                <Styled.InfoIcon />
              </Styled.OpportunitiesWrapper>
              <Styled.OpportunitiesWrapper>
                <img src={verifiedIcon} alt="" style={{ marginRight: "6px" }} />
                <Styled.OpportunitiesText>
                  District 2 Connection & Intervention Station - IDOC
                </Styled.OpportunitiesText>
              </Styled.OpportunitiesWrapper>
            </Styled.OpportunitiesSelections>
            <Styled.RecommendationOutcome>
              <Styled.PercentageWrapper>
                <Styled.Percentage>22%</Styled.Percentage>
                <Styled.PercentageLabel>Recidivism Rate</Styled.PercentageLabel>
              </Styled.PercentageWrapper>
              <Styled.PercentageWrapper>
                <Styled.Percentage>22%</Styled.Percentage>
                <Styled.PercentageLabel>
                  Sentence Disposition Distribution
                </Styled.PercentageLabel>
              </Styled.PercentageWrapper>
            </Styled.RecommendationOutcome>
          </Styled.RecommendationDetails>
        </Styled.RecommendationOption>

        {/* Rider */}
        <Styled.RecommendationOption
          selected={selectedRecommendation === RecommendationType.Rider}
        >
          <Styled.Checkbox
            type="checkbox"
            checked={selectedRecommendation === RecommendationType.Rider}
            onChange={() => updateRecommendation(RecommendationType.Rider)}
          />
          <Styled.RecommendationDetails>
            <Styled.RecommendationOptionLabel>
              Rider
            </Styled.RecommendationOptionLabel>

            <Styled.RecommendationOutcome>
              <Styled.PercentageWrapper>
                <Styled.Percentage>42%</Styled.Percentage>
                <Styled.PercentageLabel>Recidivism Rate</Styled.PercentageLabel>
              </Styled.PercentageWrapper>
              <Styled.PercentageWrapper>
                <Styled.Percentage>12%</Styled.Percentage>
                <Styled.PercentageLabel>
                  Sentence Disposition Distribution
                </Styled.PercentageLabel>
              </Styled.PercentageWrapper>
            </Styled.RecommendationOutcome>
          </Styled.RecommendationDetails>
        </Styled.RecommendationOption>

        {/* Term */}
        <Styled.RecommendationOption
          selected={selectedRecommendation === RecommendationType.Term}
        >
          <Styled.Checkbox
            type="checkbox"
            checked={selectedRecommendation === RecommendationType.Term}
            onChange={() => updateRecommendation(RecommendationType.Term)}
          />
          <Styled.RecommendationDetails>
            <Styled.RecommendationOptionLabel>
              Term
            </Styled.RecommendationOptionLabel>

            <Styled.RecommendationOutcome>
              <Styled.PercentageWrapper>
                <Styled.Percentage>32%</Styled.Percentage>
                <Styled.PercentageLabel>Recidivism Rate</Styled.PercentageLabel>
              </Styled.PercentageWrapper>
              <Styled.PercentageWrapper>
                <Styled.Percentage>7%</Styled.Percentage>
                <Styled.PercentageLabel>
                  Sentence Disposition Distribution
                </Styled.PercentageLabel>
              </Styled.PercentageWrapper>
            </Styled.RecommendationOutcome>
          </Styled.RecommendationDetails>
        </Styled.RecommendationOption>

        {/* No Recommendation */}
        <Styled.RecommendationOption
          selected={selectedRecommendation === RecommendationType.None}
        >
          <Styled.Checkbox
            type="checkbox"
            checked={selectedRecommendation === RecommendationType.None}
            onChange={() => updateRecommendation(RecommendationType.None)}
          />
          <Styled.PercentageLabel>
            I do not wish to make a recommendation
          </Styled.PercentageLabel>
        </Styled.RecommendationOption>
      </Styled.RecommendationsWrapper>
      {/* Continue */}
      <Styled.ActionButtons>
        <Styled.ContinueButton>Continue</Styled.ContinueButton>
      </Styled.ActionButtons>
    </Styled.Recommendations>
  );
};
