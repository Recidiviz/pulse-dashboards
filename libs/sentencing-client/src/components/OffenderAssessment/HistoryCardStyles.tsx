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

export const HistorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const SectionTitle = styled.h3`
  font-family: "Public Sans";
  font-size: 1rem;
  color: ${palette.pine1};
  font-weight: 600;
  margin: 0;
  line-height: 120%;
`;

export const AddButton = styled.button`
  display: flex;
  width: fit-content;
  min-width: 6rem;
  height: 2rem;
  padding: 0.5rem 1rem;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border-radius: 2rem;
  border: 1px solid ${palette.slate20};
  background: transparent;
  color: ${palette.slate85};
  font-family: "Public Sans";
  font-size: 0.8125rem;
  font-style: normal;
  font-weight: 500;
  line-height: 1rem;
  letter-spacing: -0.00813rem;
  cursor: pointer;
  outline: none;

  &:hover {
    background: ${palette.marble1};
  }

  &:focus,
  &:active {
    outline: none;
  }
`;

export const HistoryTable = styled.div`
  display: flex;
  flex-direction: column;
`;

export const TableHeaderRow = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-right: 2.5rem; /* Space for edit/delete icons */
`;

export const TableHeaderCell = styled.span`
  flex: 1;
  font-family: "Public Sans";
  font-size: 0.875rem;
  font-weight: 700;
  color: ${palette.slate85};
  line-height: 1.5;
`;

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3125rem; /* 5px */
`;

export const EmptyState = styled.div`
  font-family: "Public Sans";
  font-size: 0.875rem;
  color: ${palette.slate70};
  text-align: center;
  padding: 2rem;
  border: 1px dashed ${palette.slate30};
  border-radius: 0.5rem;
  line-height: 1.5;
`;
