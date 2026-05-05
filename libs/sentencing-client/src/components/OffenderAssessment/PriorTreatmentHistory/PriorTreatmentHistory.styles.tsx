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

export const PriorTreatmentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  overflow: hidden;
  background: ${palette.white};
  border-radius: 0.625rem;
  border: 1px solid ${palette.slate10};
  box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.35) inset;
`;

export const PriorTreatmentHistorySectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 50rem;
  left: 26rem;
  position: sticky;
  gap: 1.5rem;
  background: transparent;
`;

export const DOCPriorTreatmentHistorySubheader = styled.h2`
  color: ${palette.slate70};
  font-family: "Public Sans";
  font-size: 15px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.14px;
  align-self: stretch;
`;

export const DOCPriorTreatmentCategoryContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 6px;
  flex: 1 0 0;
`;

export const DOCPriorTreatmentCategory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  flex: 1 0 0;
`;

export const DOCPriorTreatmentCategoryHeader = styled.div`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.16px;
`;

export const DOCPriorTreatmentCategoryContent = styled.div`
  color: ${palette.slate85};
  align-self: stretch;
  font-family: "Public Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
`;

export const DOCEmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  border: 1px solid ${palette.slate20};
  background: ${palette.slate05};
`;

export const DOCEmptyStateTitle = styled.h3`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%;
  letter-spacing: -0.16px;
  margin: 0;
`;

export const DOCEmptyStateText = styled.p`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 130%;
  letter-spacing: -0.12px;
  margin: 0;
`;
