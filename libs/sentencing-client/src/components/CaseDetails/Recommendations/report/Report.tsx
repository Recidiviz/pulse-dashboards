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

import moment from "moment";

import { Insight } from "../../../../api";
import RecidivizLogo from "../../../assets/recidiviz-logo.png";
import { SelectedRecommendation } from "../../../CaseDetails/types";
import { DispositionChart } from "../../components/DispositionChart/DispositionChart";
import { RecidivismPlot } from "../../components/RecidivismPlot/RecidivismPlot";
import {
  DispositionExplanation,
  RecidivismPlotExplanation,
} from "./Descriptions";
import * as Styled from "./Report.styles";

const PLOT_WIDTH = 850;

interface ReportProps {
  fullName?: string;
  externalId: string;
  selectedRecommendation: SelectedRecommendation;
  insight: Insight;
}

function Header() {
  return (
    <Styled.Header>
      <div>Case Insights Report</div>
      <div>{moment().format("MMMM DD, YYYY")}</div>
    </Styled.Header>
  );
}

interface FooterProps {
  pageNumber: number;
}

function Footer({ pageNumber }: FooterProps) {
  return (
    <Styled.Footer>
      <div>
        Report provided by{" "}
        <img src={RecidivizLogo} width="58px" alt="Recidiviz logo" />
      </div>
      <div>Page {pageNumber} of 2</div>
    </Styled.Footer>
  );
}

export function Report({
  insight,
  fullName,
  externalId,
  selectedRecommendation,
}: ReportProps) {
  return (
    <Styled.ReportContainer>
      {/* Page 1 */}
      <Styled.Page>
        <Header />
        <Styled.Title>
          <Styled.Name>{fullName}</Styled.Name>
          <Styled.ExternalId>{externalId}</Styled.ExternalId>
        </Styled.Title>
        <Styled.RecommendationSection>
          <Styled.Subtitle>PSI Recommendation</Styled.Subtitle>
          <Styled.RecommendationContainer>
            {selectedRecommendation}
          </Styled.RecommendationContainer>
        </Styled.RecommendationSection>
        <div>
          <Styled.Subtitle>Insights</Styled.Subtitle>
          <Styled.InsightSubtitle>
            The following information represents outcomes for cases similar to
            that of the current client, {fullName}, based on gender, risk score,
            and type of conviction.
          </Styled.InsightSubtitle>
          <Styled.PlotContainer>
            <RecidivismPlot
              insight={insight}
              selectedRecommendation={selectedRecommendation}
              plotWidth={PLOT_WIDTH}
            />
          </Styled.PlotContainer>
          <RecidivismPlotExplanation insight={insight} />
        </div>
        <Footer pageNumber={1} />
      </Styled.Page>

      {/* Page 2 */}
      <Styled.Page>
        <Header />
        <Styled.PlotContainer>
          <DispositionChart
            insight={insight}
            selectedRecommendation={selectedRecommendation}
            justifyContent="flex-start"
            scale={1.5}
          />
        </Styled.PlotContainer>
        <DispositionExplanation insight={insight} />
        <Footer pageNumber={2} />
      </Styled.Page>
    </Styled.ReportContainer>
  );
}
