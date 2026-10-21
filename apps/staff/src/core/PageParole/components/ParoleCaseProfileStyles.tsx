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

import { FactRowStack, SectionCard, SubsectionTitle } from "./shared";

/** Corner radius of every case profile card, in both columns. */
export const PAROLE_CARD_CORNER_RADIUS = rem(10);

/** Corner radius of a record box inside a card, such as a DOR card. */
export const PAROLE_RECORD_CORNER_RADIUS = rem(4);

/** Background of every case profile card, in both columns. */
export const PAROLE_CARD_BACKGROUND_COLOR = palette.white;

/**
 * A case profile card. The title sits inside the card body, above the
 * subsections, rather than in a tinted header bar.
 */
export const ParoleSectionCard = styled(SectionCard)`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background-color: ${PAROLE_CARD_BACKGROUND_COLOR};
  border-radius: ${PAROLE_CARD_CORNER_RADIUS};
  padding: ${rem(spacing.lg)};
  /* SectionCard clips to keep a header bar inside its rounded corners. This
   * card has no header bar, and the clip cut off dropdown menus, such as the
   * case notes filter, that extend past the card's bottom edge. */
  overflow: visible;
`;

export const ParoleSectionTitle = styled.h4`
  ${typography.Sans18}
  font-size: ${rem(20)};
  line-height: ${rem(28)};
  font-weight: 600;
  color: ${palette.pine1};
`;

/**
 * One subsection of a ParoleSectionCard: its heading, then its content, then
 * any pager, stacked with a fixed gap. Children carry no outer margins.
 */
export const ParoleSubsection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
`;

/** Groups a ParoleSubsectionTitle with the ParoleSubsectionCaption under it. */
export const ParoleSubsectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

/** Color of a ParoleSubsectionTitle, and of the labels that match it. */
export const PAROLE_SUBSECTION_TITLE_COLOR = palette.slate85;

export const ParoleSubsectionTitle = styled.h5`
  ${typography.Sans18}
  font-size: ${rem(18)};
  line-height: ${rem(26)};
  font-weight: 600;
  color: ${PAROLE_SUBSECTION_TITLE_COLOR};
`;

/**
 * Line below a ParoleSubsectionTitle saying what the subsection holds, or that
 * it holds nothing.
 */
export const ParoleSubsectionCaption = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
`;

/**
 * Box around one record in a subsection, such as an offense or a
 * disciplinary report. A css block rather than a component, so a record that
 * opens on click can put it on a button.
 */
export const paroleRecordCardStyles = css`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.md)};
  background-color: ${palette.marble2};
  border: 1px solid ${palette.slate10};
  padding: ${rem(spacing.md)};
`;

/** A fact's label above its value, 4px apart. */
export const ParoleFactStack = styled(FactRowStack)`
  gap: ${rem(spacing.xs)};
`;

export const ParoleFactLabel = styled.div`
  ${typography.Sans14}
  color: ${palette.slate85};
`;

export const ParoleFactValue = styled.div`
  ${typography.Sans16}
  color: ${palette.pine1};
`;

/** A block title in the sidebar, at the sidebar's 14px text size. */
export const ParoleSidebarTitle = styled(SubsectionTitle)`
  ${typography.Sans14}
  font-weight: 600;
`;

/** A ParoleFactValue at 14px. */
export const ParoleSmallFactValue = styled(ParoleFactValue)`
  ${typography.Sans14}
`;

/** The resident's name and the short lines under it at the top of the sidebar. */
export const ParoleIdentityBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

export const ParolePersonName = styled.div`
  ${typography.Serif24}
  color: ${palette.pine2};
`;

export const ParoleIdentityDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${rem(spacing.xs)};
`;

export const ParoleIdentityDetail = styled.div`
  ${typography.Sans14}
  line-height: ${rem(24)};
  color: ${palette.slate80};
`;

/**
 * Makes a record box act as a button that opens the full record. Spread it
 * after paroleRecordCardStyles on a button element.
 */
export const paroleClickableRecordStyles = css`
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition:
    background 0.1s ease,
    border-color 0.1s ease;

  &:hover,
  &:focus-visible {
    background: ${palette.marble1};
    border-color: ${palette.slate60};
  }
`;

export const ParoleRecordHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${rem(spacing.md)};
`;

export const ParoleRecordHeading = styled.div`
  ${typography.Sans16}
  display: flex;
  align-items: baseline;
  gap: ${rem(spacing.sm)};
  min-width: 0;
  line-height: 1.5;
  color: ${palette.pine2};
`;

export const ParoleRecordHeaderDetail = styled.div`
  ${typography.Sans14}
  flex-shrink: 0;
  white-space: nowrap;
  color: ${palette.slate85};
`;
