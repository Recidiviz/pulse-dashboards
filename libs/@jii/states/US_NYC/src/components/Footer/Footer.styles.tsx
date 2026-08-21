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

import { FullBleedContainer } from "~@jii/common-ui";
import { palette, spacing, typography } from "~design-system";

export const FooterWrapper = styled(FullBleedContainer).attrs({ as: "footer" })`
  background: ${palette.pine1};
  padding: ${rem(spacing.xxl)} ${rem(spacing.xl)};
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xl)};
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

export const SectionHeading = styled.p`
  ${typography.Sans16}
  font-weight: 600;
  color: ${palette.white};
  margin: 0;
`;

export const BodyText = styled.p`
  ${typography.Sans14}
  color: ${palette.white90};
  margin: 0;
`;

export const LabelItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.sm)};
`;

export const LabelDescription = styled.p`
  ${typography.Sans14}
  color: ${palette.white90};
  margin: 0;
`;

export const Disclaimer = styled.p`
  ${typography.Sans12}
  color: ${palette.white70};
  margin: 0;
  padding-top: ${rem(spacing.md)};
  border-top: 1px solid ${palette.white40};
`;
