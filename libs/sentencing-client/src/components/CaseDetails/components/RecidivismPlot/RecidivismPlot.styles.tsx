import styled from "styled-components/macro";

export const RecidivismChartLegend = styled.div`
  display: flex;
`;

export const RecidivismChartLegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 24px;
`;

export const RecidivismChartLegendDot = styled.div<{
  $backgroundColor: string;
}>`
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 50%;
  background: ${(props) => props.$backgroundColor};
`;

export const RecidivismChartPlotContainer = styled.div<{
  $width: number;
}>`
  width: ${(props) => props.$width}px;
`;
