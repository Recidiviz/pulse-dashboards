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

import { rgba } from "polished";
import { FC } from "react";
import styled from "styled-components";

import { Card } from "~@jii/common-ui";
import { palette, typography } from "~design-system";

import { DefaultProps } from "./types";

const StyledCard = styled(Card)`
  ${typography.Sans18}

  background-color: ${palette.marble2};
  color: ${rgba(palette.pine1, 0.5)};
  margin: 0;
  text-align: center;
`;

export type HiddenDatesCardProps = DefaultProps;

export const HiddenDatesCard: FC<HiddenDatesCardProps> = (props) => {
  return <StyledCard {...props} />;
};
