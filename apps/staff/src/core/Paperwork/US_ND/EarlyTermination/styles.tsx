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

export const FormHeadingMotionSection = styled.section`
  text-align: center;
`;
export const FormHeadingSection = styled.section``;

export const FormHeadingLineItemSuffix = styled.span`
  display: inline-block;
  justify-self: flex-end;
  min-width: 2em;
  padding-left: 0.5em;
`;

export const FormHeadingContainer = styled.article`
  display: flex;
  color: gray;

  ${FormHeadingSection}:first-child {
    width: 200px;
    margin-right: 20px;
  }
  ${FormHeadingSection}:last-child ${FormHeadingLineItemSuffix} {
    display: none;
  }

  & div {
    display: flex;
    justify-content: space-between;
  }

  & div span:first-child {
    flex: 1;
  }
`;
