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

import { Insight } from "../../../api/APIClient";
import chevronIcon from "../../assets/chevron-down.svg";
import * as Styled from "../CaseDetails.styles";
import { SelectedRecommendation } from "../types";
import { getPlot } from "./utils";

export interface InsightsProps {
  insight?: Insight;
  selectedRecommendation: SelectedRecommendation;
}

export const Insights = ({
  insight,
  selectedRecommendation,
}: InsightsProps) => {
  if (!insight) {
    return null;
  }

  const plot = getPlot(insight, selectedRecommendation);

  return (
    <Styled.Insights>
      <Styled.Title>Insights</Styled.Title>
      <Styled.ChartControls>
        <Styled.CarouselButtons>
          <Styled.CarouselButton>
            <img src={chevronIcon} alt="" />
          </Styled.CarouselButton>
          <Styled.CarouselButton>
            <img src={chevronIcon} alt="" style={{ rotate: "180deg" }} />
          </Styled.CarouselButton>
        </Styled.CarouselButtons>
      </Styled.ChartControls>
      {
        // // TOOD(https://github.com/Recidiviz/recidiviz-data/issues/30951): Add titles and legends to plot
      }
      <Styled.Charts>
        <div
          ref={(ref) => {
            if (!ref) {
              return;
            }
            ref.replaceChildren();
            ref.appendChild(plot);
          }}
        />
      </Styled.Charts>
    </Styled.Insights>
  );
};
