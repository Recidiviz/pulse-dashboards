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

import { palette, typography } from "@recidiviz/design-system";
import styled from "styled-components/macro";

import { customPalette } from "../../../styles/palette";

const REPORT_PAGE_HEIGHT = 1340;

export const ReportContainer = styled.div`
  width: 935px;
`;

export const Header = styled.div`
  ${typography.Sans16}
  font-size: 11.5px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const Footer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  bottom: 50px;
  padding-right: 100px;
  color: ${customPalette.black};
  font-size: 8px;

  div {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  img {
    margin-bottom: 3px;
  }
`;

export const Disclaimer = styled.div`
  ${typography.Sans12}
  font-size: 9px;
  border-top: 1px solid ${customPalette.black};
  border-bottom: 1px solid ${customPalette.black};
  padding: 5px 0;
  position: absolute;
  bottom: 70px;
  max-width: 826px;

  span {
    font-weight: 800;
  }
`;

export const Page = styled.div`
  padding: 50px;
  height: ${REPORT_PAGE_HEIGHT}px;
  break-after: page;
  position: relative;
  color: ${customPalette.black};
  &:not(:first-child) {
    padding-top: 50px;
  }
`;

export const Title = styled.div`
  ${typography.Serif34}
  max-width: 424px;
  margin-bottom: 32px;
`;

export const SnapshotContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 40px;
`;

export const SectionTitle = styled.div<{ noMargin?: boolean }>`
  ${typography.Sans18}
  margin-bottom: ${({ noMargin }) => (noMargin ? 0 : 8)}px;
  font-weight: 700;

  span {
    font-weight: 400;
  }
`;

export const AttributesContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  margin-bottom: 8px;
`;

export const TitleAttributesWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
`;

export const CaseOverview = styled.div`
  display: flex;
  border: 0.5px solid ${customPalette.black};
  border-radius: 4px;
`;

export const OverviewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 16px;

  &:not(:last-child) {
    min-width: 210px;
    border-right: 0.5px solid ${customPalette.black};
  }
`;

export const OverviewTitle = styled.div`
  ${typography.Sans12}
  font-size: 9px;
`;

export const Name = styled.div`
  ${typography.Sans16}
  font-weight: 600;
`;

export const HistoricalDetails = styled(CaseOverview)`
  height: 100%;
  padding: 14px 16px;

  span {
    border-bottom: 1px solid ${customPalette.black};
  }
`;

export const BreakdownByDisposition = styled.div`
  margin-bottom: 76px;
`;

export const DispositionCardWrapper = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
`;

export const DispositionCardTitle = styled.div`
  font-weight: 700;
  font-size: 17px;
  margin-bottom: 32px;
`;

export const SentencingRecidivismRateContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  border: 0.5px solid ${customPalette.black};
  border-radius: 4px;
  padding: 16px;
`;

export const SentencingRecidivismRateWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const SentencingRecidivismRateSection = styled.div`
  width: 243px;
`;

export const ChartCaption = styled.div`
  ${typography.Sans12}
  font-weight: 500;
  margin-top: 8px;
`;

export const HistoricalSentencingExplanation = styled.div``;

export const RateDetailsTitlePercentage = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 6px;
`;

export const RateDetailsTitle = styled.div`
  ${typography.Sans16}
  font-weight: 600;
`;

export const RateDetailsPercentage = styled.div`
  ${typography.Sans16}
  font-weight: 600;
  line-height: 18px;
`;

export const ProgressBar = styled.div<{ percentage?: number }>`
  height: 12px;
  border: 0.25px solid ${customPalette.black};
  position: relative;

  &::before {
    content: "";
    position: absolute;
    z-index: 1;
    height: 100%;
    width: ${({ percentage }) => percentage ?? 0}%;
    background: ${customPalette.black};
  }
`;

export const ChartContainer = styled.div``;

export const CardCaption = styled.div`
  ${typography.Sans12}
  height: 32px;
  width: 100%;
  display: flex;
  align-items: center;
  position: absolute;
  bottom: 0px;
  left: 0;
  border-radius: 0 0 4px 4px;
  padding: 10px 12px;
  line-height: 12px;
`;

export const DispositionCard = styled.div<{ selected?: boolean }>`
  ${typography.Sans16}
  width: 267px;
  height: 378px;
  border-radius: 4px;
  border: ${({ selected }) => (selected ? 2 : 1)}px solid ${customPalette.black};
  padding: 12px;
  position: relative;

  ${CardCaption} {
    ${({ selected }) =>
      selected
        ? `
          background: ${customPalette.black};
          color: ${palette.white};
            bottom: -2px;`
        : `
          background: ${palette.white};
          color: ${customPalette.black};
    `}
  }
`;

export const HistoricalSentencingExplanationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin-bottom: 19px;
`;

export const CumulativeRecidivismRateExplanationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 11px;
`;

export const NumberOfRecords = styled.div`
  ${typography.Sans12}
  font-size: 10px;
  font-weight: 400;
  margin-bottom: 4px;
`;

export const AttributeChipsWrapper = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;

  div:first-child {
    text-transform: capitalize;
  }
`;

export const AttributeChip = styled.div`
  ${typography.Sans12}
  width: fit-content;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  padding: 4px 8px;
  border: 1px solid ${customPalette.black};
  border-radius: 4px;
  white-space: nowrap;
`;

export const ExternalId = styled.span`
  color: ${palette.slate85};
  font-size: 18px;
`;

export const RecommendationSection = styled.div`
  margin-bottom: 28px;
`;

export const Subtitle = styled.div`
  ${typography.Serif24}
  color: ${palette.pine3};
  margin-bottom: 8px;
`;

export const RecommendationContainer = styled.div`
  color: ${palette.pine1};
  font-size: 20px;
  font-weight: 500;
  background-color: #2b696908;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #00665f66;
`;

export const InsightSubtitle = styled.div`
  ${typography.Sans14}
  font-weight: 500;
  margin-bottom: 16px;
  color: #355362cc;
`;

export const PlotContainer = styled.div`
  margin-bottom: 16px;
`;

export const Bold = styled.span`
  font-weight: bold;
`;

export const Explanation = styled.span`
  ${typography.Sans12}
  color: ${customPalette.black};
  font-weight: 400;
`;
