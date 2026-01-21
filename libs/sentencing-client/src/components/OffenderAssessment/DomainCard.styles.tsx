// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

export const ScrollWrapper = styled.div`
  scroll-margin-top: 16rem;
`;

export const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background: ${palette.white};
  border-radius: 0.625rem;
  border: 1px solid ${palette.slate10};
`;

export const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.h3`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 1rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01rem;
  margin: 0;
`;

export const HelperText = styled.p`
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.00875rem;
  color: ${palette.slate70};
  margin: 0;
`;

export const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SummarySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SummaryLabel = styled.label`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01rem;
`;

export const InfoBox = styled.div`
  display: flex;
  padding: 1rem 1rem 1rem 1.375rem;
  align-items: center;
  gap: 1rem;
  align-self: stretch;
  border-left: 4px solid ${palette.logoBlue};
  background: rgba(0, 161, 255, 0.07);
  color: ${palette.pine2};
  font-family: "Public Sans";
  font-size: 0.875rem;
  line-height: 150%;
`;
