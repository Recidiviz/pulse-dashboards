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

export const Container = styled.div`
  display: flex;
  width: 50rem;
  padding: 2rem 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  font-weight: 500;
  line-height: 120%;
  letter-spacing: -0.00875rem;
  font-family: "Public Sans";
`;

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-self: stretch;
`;

export const Checkbox = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: ${palette.pine4};
`;

export const CheckboxLabel = styled.span`
  font-size: 0.875rem;
  padding-left: 2.5rem;
`;

export const ClientInfoRow = styled.div`
  display: flex;
  gap: 0.375rem;
  align-self: stretch;
  font-size: 0.75 rem;
`;

export const ClientInfoColumn = styled.div`
  flex: 1;
  display: flex;
  padding-left: 2.5rem;
  flex-direction: column;
`;

export const SubsectionTitle = styled.div`
  color: ${palette.pine1};
  padding-bottom: 1rem;
  font-size: 1rem;
`;
