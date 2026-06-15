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

import { rem } from "polished";
import styled from "styled-components";

import { palette, spacing } from "../../styles";

export interface CardProps {
  stacked?: boolean;
}

export const CardSection = styled.div``;

export const Card = styled.div<CardProps>`
  background-color: ${palette.white};
  border: 1px solid ${palette.slate30};
  border-radius: ${rem(8)};
  display: flex;
  flex-direction: ${(props) => (props.stacked ? "column" : "row")};
  margin-bottom: ${rem(spacing.xs)};
  position: relative;

  ${(props) =>
    props.stacked
      ? `
        > ${CardSection} {
           border-bottom: 1px solid ${palette.slate20};
           flex: 1 0 auto;
        }

        > ${CardSection}:last-child {
          border-bottom: none;
        }
      `
      : ` > ${CardSection} { flex: 1 0 0%; }`}
`;
