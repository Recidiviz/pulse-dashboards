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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { ButtonLink } from "../ButtonLink/ButtonLink";

export const Section = styled.section`
  border: 1px solid ${palette.slate20};
  border-radius: clamp(${rem(2)}, 2vw, ${rem(24)});
  margin: ${rem(spacing.lg)} 0;
  padding: clamp(${rem(spacing.md)}, 4vw, ${rem(spacing.xl)});
  text-wrap: pretty;

  ${ButtonLink} {
    margin-top: ${rem(spacing.lg)};
  }
`;

export const SectionHeading = styled.h2`
  ${typography.Sans24}

  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.xl)};
`;
