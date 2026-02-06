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

import { typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components";

import { palette, spacing } from "~design-system";

export const RNAResultsTable = styled.table`
  margin-bottom: ${rem(spacing.xl)};

  ${typography.Sans14};
  color: ${palette.pine1};
  text-wrap: pretty;

  tbody > tr {
    border-bottom: 1px solid ${palette.slate30};
    border-top: 1px solid ${palette.slate30};

    &:nth-child(2n + 1) {
      background-color: ${palette.marble3};
    }

    &:hover {
      background-color: ${palette.marble5};
    }
  }

  th,
  td {
    padding: ${rem(10)} ${rem(spacing.xs)};
  }
`;

export const QuestionNum = styled.span`
  width: ${rem(30)};
  padding-right: ${rem(spacing.xs)};
`;

export const MediumQuestion = styled.div`
  max-width: ${rem(100)};
  padding-right: ${rem(spacing.xl)};
`;

export const WideQuestion = styled.div`
  padding-right: ${rem(spacing.xl)};
`;

export const FakeRadioButton = styled.div<{
  $checked: boolean;
  $centered: boolean;
}>`
  ${(props) =>
    props.$checked
      ? `border: 4px solid ${palette.pine4};`
      : `border: 1px solid ${palette.slate50};`}
  ${(props) =>
    props.$centered
      ? `margin: auto;`
      : css`
          display: inline-block;
          vertical-align: text-top;
          margin-right: ${rem(spacing.xs)};
        `}
  width: ${rem(14)};
  height: ${rem(14)};
  border-radius: ${rem(7)};
  background-color: ${palette.marble1};
`;

export const SmallAnswerCell = styled.td`
  width: ${rem(100)};
`;

export const MediumAnswerCell = styled.td`
  width: ${rem(200)};
`;

export const MediumHeader = styled(MediumAnswerCell).attrs({ as: "th" });

export const WideAnswerCell = styled.td`
  width: ${rem(400)};
`;
