import { Insight } from "../../../../api";
import { SelectedRecommendation } from "../../../CaseDetails/types";
import { DispositionChart } from "../../components/DispositionChart/DispositionChart";
import { RecidivismPlot } from "../../components/RecidivismPlot/RecidivismPlot";
import {
  DispositionExplanation,
  RecidivismPlotExplanation,
} from "./Descriptions";
import * as Styled from "./Report.styles";

const PLOT_WIDTH = 1050;

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
      <div>{new Date().toLocaleString()}</div>
    </Styled.Header>
  );
}

interface FooterProps {
  pageNumber: number;
}

function Footer({ pageNumber }: FooterProps) {
  return (
    <Styled.Footer>
      <div>Report provided by Recidiviz</div>
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
    <>
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
          />
        </Styled.PlotContainer>
        <DispositionExplanation insight={insight} />
        <Footer pageNumber={2} />
      </Styled.Page>
    </>
  );
}
