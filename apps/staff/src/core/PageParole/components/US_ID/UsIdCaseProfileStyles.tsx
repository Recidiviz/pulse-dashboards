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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { css } from "styled-components";

import { palette } from "~design-system";

import { FactRowStack, SectionCard } from "../shared";

/** Corner radius of every US_ID case profile card, in both columns. */
export const US_ID_CARD_CORNER_RADIUS = rem(10);

/** Background of every US_ID case profile card, in both columns. */
export const US_ID_CARD_BACKGROUND_COLOR = palette.white;

/**
 * A US_ID case profile card. The title sits inside the card body, above the
 * subsections, rather than in a tinted header bar.
 */
export const UsIdSectionCard = styled(SectionCard)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background-color: ${US_ID_CARD_BACKGROUND_COLOR};
  border-radius: ${US_ID_CARD_CORNER_RADIUS};
  padding: ${rem(spacing.lg)};
`;

export const UsIdSectionTitle = styled.h4`
  ${typography.Sans18}
  font-size: ${rem(20)};
  line-height: ${rem(28)};
  font-weight: 600;
  color: ${palette.pine1};
`;

/**
 * One subsection of a UsIdSectionCard: its heading, then its content, then
 * any pager, stacked with a fixed gap. Children carry no outer margins.
 */
export const UsIdSubsection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

/** Groups a UsIdSubsectionTitle with the UsIdSubsectionCaption under it. */
export const UsIdSubsectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

export const UsIdSubsectionTitle = styled.h5`
  ${typography.Sans18}
  font-size: ${rem(18)};
  line-height: ${rem(26)};
  font-weight: 600;
  color: ${palette.slate85};
`;

/**
 * Line below a UsIdSubsectionTitle saying what the subsection holds, or that
 * it holds nothing.
 */
export const UsIdSubsectionCaption = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

/**
 * Box around one record in a US_ID subsection, such as an offense or a
 * disciplinary report. A css block rather than a component, so a record that
 * opens on click can put it on a button.
 */
export const usIdRecordCardStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background-color: ${palette.marble2};
  border: 1px solid ${palette.slate10};
  padding: ${rem(spacing.md)};
`;

/** A fact's label above its value, 4px apart. */
export const UsIdFactStack = styled(FactRowStack)`
  gap: ${rem(spacing.xs)};
`;

export const UsIdFactLabel = styled.div`
  ${typography.Sans14}
  color: ${palette.slate85};
`;

export const UsIdFactValue = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
`;
