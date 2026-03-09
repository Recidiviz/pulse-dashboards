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
import { FC } from "react";
import styled from "styled-components";

import { palette, spacing } from "~design-system";

const Wrapper = styled.span`
  ${typography.Sans12}
  align-items: center;
  background: ${palette.slate10};
  border-radius: ${rem(4)};
  color: ${palette.slate85};
  column-gap: ${rem(spacing.xs)};
  display: inline-flex;
  padding: ${rem(spacing.sm)};
  position: relative;
  top: -${rem(spacing.sm)};
`;

export const DateInfoTag: FC<{ text: string }> = ({ text }) => {
  return <Wrapper>{text}</Wrapper>;
};
