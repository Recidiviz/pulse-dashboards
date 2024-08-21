import styled from "styled-components/macro";

export const DispositionChartContainer = styled.div<{
  $justify: string;
}>`
  display: flex;
  justify-content: ${(props) => props.$justify};
  align-items: flex-end;
  padding-top: 32px;
  padding: 32px 20px 0 20px;
  margin-top: auto;
`;

export const DispositionChartCircleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
`;

export const DispositionChartCircle = styled.div<{
  $height: number;
  $backgroundColor: string;
  $borderColor?: string;
}>`
  width: ${(props) => props.$height}px;
  height: ${(props) => props.$height}px;
  line-height: ${(props) => props.$height}px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border-radius: 50%;
  font-size: 26px;
  font-weight: 400;
  color: #ffffff;
  text-align: center;
  background: ${(props) => props.$backgroundColor};
  border: ${(props) =>
    props.$borderColor ? `4px solid ${props.$borderColor}` : "none"};
`;

export const DispositionChartCircleLabel = styled.div<{
  $color: string;
}>`
  color: ${(props) => props.$color};
`;
