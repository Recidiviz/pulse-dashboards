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

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  border: 1px solid ${palette.slate20};
  border-radius: 0.5rem;
  background: ${palette.white};
`;

export const CardTitle = styled.div`
  margin: 0 0 1.5rem 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const ORASTitle = styled.span`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.0225rem;
`;
export const ORASUpdatedText = styled.span`
  color: ${palette.slate60};
  font-family: "Public Sans";
  font-weight: 500;
  font-size: 15px;
  line-height: 120%;
  letter-spacing: -0.15px;
`;

export const CardContent = styled.div`
  display: flex;
  gap: 2.5rem;
  align-items: center;
  padding: 2rem 1rem 0 0;
`;

export const MetadataSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const MetadataLabel = styled.span`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 1rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.01rem;
`;

export const MetadataValue = styled.span`
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 150%;
`;

export const EmptyState = styled.div`
  color: ${palette.slate60};
  text-align: center;
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.00875rem;
  padding-top: 1.5rem;
`;
