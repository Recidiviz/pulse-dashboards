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

import { CaseInsight } from "../../../api/APIClient";
import { GeoConfig } from "../../../geoConfigs/types";
import PlusIcon from "../../assets/plus-icon.svg?react";
import DraggableScrollContainer from "../../DraggableScrollContainer/DraggableScrollContainer";
import * as Styled from "../CaseDetails.styles";
import { DispositionChart } from "../components/charts/DispositionChart/DispositionChart";
import { RecidivismChart } from "../components/charts/RecidivismChart/RecidivismChart";
import { SelectedRecommendation } from "../types";

export interface InsightsProps {
  selectedRecommendation: SelectedRecommendation;
  insight?: CaseInsight;
  fullName?: string;
  lsirScore?: number | null;
  openEditCaseDetailsModal: () => void;
  geoConfig: GeoConfig;
}

export const Insights = ({
  insight,
  selectedRecommendation,
  fullName,
  lsirScore,
  openEditCaseDetailsModal,
  geoConfig,
}: InsightsProps) => {
  const recommendationType = geoConfig.recommendation.type;

  return (
    <Styled.Insights>
      <Styled.InsightsHeaderWrapper>
        <Styled.Title>Insights</Styled.Title>
        <Styled.Description>
          This information represents outcomes for cases similar to that of the
          current client, {fullName}, based on gender, risk score, and type of
          conviction. Please keep in mind that data on past conduct is not a
          guarantee of future outcomes.
        </Styled.Description>
        {!lsirScore && lsirScore !== 0 && (
          <Styled.AddLsirScoreContainer>
            Add LSI-R draft score for most accurate insights{" "}
            <Styled.ActionButton
              kind="bordered"
              onClick={openEditCaseDetailsModal}
            >
              <PlusIcon /> Add LSI-R Score
            </Styled.ActionButton>
          </Styled.AddLsirScoreContainer>
        )}
      </Styled.InsightsHeaderWrapper>

      {/* Charts */}
      <DraggableScrollContainer>
        <Styled.Charts>
          {/* Recidivism Rates Chart */}
          <Styled.Chart $marginRight={16}>
            <RecidivismChart
              orgName={geoConfig.orgName}
              insight={insight}
              selectedRecommendation={selectedRecommendation}
              recommendationType={recommendationType}
              baseOptionsTemplate={geoConfig.recommendation.baseOptionsTemplate}
            />
          </Styled.Chart>

          {/* Previous Sentence Rates Chart */}
          <Styled.Chart>
            <DispositionChart
              insight={insight}
              selectedRecommendation={selectedRecommendation}
              recommendationType={recommendationType}
              orgName={geoConfig.orgName}
            />
          </Styled.Chart>
        </Styled.Charts>
      </DraggableScrollContainer>
    </Styled.Insights>
  );
};
