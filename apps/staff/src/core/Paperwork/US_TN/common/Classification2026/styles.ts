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

import { rem } from "polished";
import styled, { css } from "styled-components";

import { Item, LeftColumn, SubItem } from "../ScoredAssessmentQuestion";

export const FormFont = css`
  font-family: "Arial", sans-serif;
`;

export const BoldWeight = css`
  font-weight: 600;
`;

export const ClassificationFormPage = styled.div`
  ${FormFont}
  display: flex;
  height: 100%;
  flex-direction: column;
  font-size: ${rem(10)};
  color: black;
  background-color: white;
  padding: 3rem 4.25rem;

  ${LeftColumn} {
    width: 100%;
  }

  ${Item} {
    margin: 0.5rem 0;
    ${SubItem} {
      margin-left: 0.5rem;
    }
  }
`;
