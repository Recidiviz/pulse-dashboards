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

import chevronIcon from "../assets/chevron-down.svg";
import tempCharts from "../assets/temp-insights-charts.png";
import * as Styled from "./CaseDetails.styles";

// TODO(Recidiviz/recidiviz-data#30652) Implement Insights flow
export const Insights = () => {
  return (
    <Styled.Insights>
      <Styled.Title>Insights</Styled.Title>
      <Styled.ChartControls>
        <Styled.Notification>
          Awaiting LSI-R score from Atlas to provide the most accurate data
        </Styled.Notification>
        <Styled.CarouselButtons>
          <Styled.CarouselButton>
            <img src={chevronIcon} alt="" />
          </Styled.CarouselButton>
          <Styled.CarouselButton>
            <img src={chevronIcon} alt="" style={{ rotate: "180deg" }} />
          </Styled.CarouselButton>
        </Styled.CarouselButtons>
      </Styled.ChartControls>
      <Styled.Charts>
        <img src={tempCharts} alt="" width="1200px" />
      </Styled.Charts>
    </Styled.Insights>
  );
};
