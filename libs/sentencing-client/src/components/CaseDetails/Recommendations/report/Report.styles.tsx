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

import styled from "styled-components/macro";

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 32px;
  font-size: 16;
`;

export const Footer = styled.div`
  display: flex;
  width: 100vw;
  justify-content: space-between;
  position: absolute;
  bottom: 50px;
  padding-right: 100px;
`;

export const Page = styled.div`
  padding: 50px;
  height: 100vh;
  break-after: page;
  position: relative;

  &:not(:first-child) {
    padding-top: 50px;
  }
`;

export const Title = styled.div`
  padding-bottom: 21px;
  margin-bottom: 24px;
  border-bottom: 1px solid #35536233;
`;

export const Name = styled.span`
  font-family: Libre Baskerville;
  font-size: 34px;
  margin-right: 8px;
`;

export const ExternalId = styled.span`
  color: #2b5469d9;
  font-size: 18px;
`;

export const RecommendationSection = styled.div`
  margin-bottom: 28px;
`;

export const Subtitle = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

export const RecommendationContainer = styled.div`
  font-size: 20px;
  background-color: #2b696908;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #00665f66;
`;

export const InsightSubtitle = styled.div`
  font-size: 14px;
  margin-bottom: 16px;
  color: #355362cc;
`;

export const PlotContainer = styled.div`
  margin-bottom: 16px;
`;

export const Bold = styled.span`
  font-weight: bold;
`;