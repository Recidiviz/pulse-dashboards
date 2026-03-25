// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import styled from "styled-components";

import { palette } from "~design-system";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 50rem;
  height: fit-content;
  background: transparent;
  left: 26rem;
  position: sticky;
  border-radius: 10px;
  overflow: hidden;
`;

export const DownloadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: ${palette.white};
  position: relative;
  z-index: 1;
  box-shadow:
    0 0 1px 0 rgba(43, 84, 105, 0.1),
    0 4px 8px 0 rgba(43, 84, 105, 0.06),
    0 8px 56px 0 rgba(43, 84, 105, 0.12);
`;

export const DownloadHeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DownloadTitle = styled.h2`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 120%;
  margin: 0;
`;

export const DownloadSubtitle = styled.p`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 150%;
  margin: 0;
`;

export const DownloadButton = styled.button`
  display: flex;
  width: 154px;
  height: 40px;
  padding: 4px 16px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  border-radius: 4px;
  background: ${palette.pine4};
  color: ${palette.white};
  border: none;
  cursor: pointer;
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const SectionCard = styled.div`
  display: flex;
  flex-direction: column;
  background: ${palette.white};
  padding: 24px;
`;

export const SectionTitle = styled.h3`
  align-self: stretch;
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.16px;
  margin: 0;
`;

export const SectionBody = styled.div`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
`;

export const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const RecommendationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const RecommendationLabel = styled.div`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 14px;
  font-weight: 600;
  line-height: 150%;
`;

export const SummaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 50rem;
`;

export const InsightsSidePanel = styled.div`
  display: flex;
  padding: 32px 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  align-self: stretch;
  border-radius: 10px;
  border: 1px solid ${palette.slate10};
  background: ${palette.white};
`;

export const InsightsChartCard = styled.div`
  display: flex;
  padding: 24px;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  align-self: stretch;
  border-radius: 10px;
  border: 1px solid ${palette.slate10};
  background: ${palette.white};
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.35) inset;
`;

export const InsightsSubtitle = styled.p`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  letter-spacing: -0.14px;
  margin: 0;
`;

export const InsightsDonutWrapper = styled.div`
  width: 100%;
  overflow: hidden;
`;

// Positioned off-screen so the report renders in the DOM for html2canvas
// capture without being visible to the user.
export const ReportPDFContainer = styled.div`
  position: absolute;
  left: 100%;
  top: -200%;
`;

export const SummaryReportWrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

/** Offense card: two-column layout */
export const OffenseCardContainer = styled.div`
  display: flex;
  align-self: stretch;
  background: ${palette.white};
  padding: 24px;
`;

export const OffenseColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 50%;
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 150%;
`;

export const OffenseColumnTitle = styled.h4`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.16px;
  margin: 0;
`;
