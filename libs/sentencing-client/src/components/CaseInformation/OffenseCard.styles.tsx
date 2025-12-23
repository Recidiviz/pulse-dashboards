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

export const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  gap: 1.5rem;
`;

export const Divider = styled.div`
  width: 100%;
  height: 0.0625rem;
  background: ${palette.slate20};
`;

export const Card = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  align-self: stretch;
  padding-left: 2.5rem;
  padding-right: 2rem;
`;

export const SubsectionTitle = styled.div`
  color: ${palette.pine1};
  padding-bottom: 1rem;
  font-size: 1rem;
  padding-left: 2.5rem;
`;

export const ColumnSection = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 50%;
  align-self: stretch;
  flex-direction: column;
  color: ${palette.slate85};
`;

export const SectionHeader = styled.h3`
  color: ${palette.pine1};
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 1.2rem */
  letter-spacing: -0.01rem;
`;
