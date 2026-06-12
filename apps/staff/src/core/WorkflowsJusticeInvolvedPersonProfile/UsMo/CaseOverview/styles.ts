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

import { palette, typography } from "~design-system";

/**
 * Shared styled primitives for the US_MO Case Overview card. Extracted from
 * `ClientInformationCard.tsx` so additional sections (e.g. SAR Reports) can
 * mount inside the same `CardFrame` and pick up the divider rule that ties
 * adjacent `<Section>` elements together.
 *
 * Tokens come from Figma nodes 7364-3879 / 7432-2685.
 */

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  padding: ${rem(16)};
  width: 100%;
`;

export const SectionHeading = styled.h3`
  color: ${palette.slate60};
  ${typography.Sans14}
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0 0 ${rem(8)};
  padding-right: ${rem(16)};
`;

export const Row = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${rem(12)};
  font-weight: 500;
  gap: ${rem(8)};
  letter-spacing: -0.01em;
  line-height: 1.2;
  padding: ${rem(8)} ${rem(16)} ${rem(8)} 0;
`;

export const Label = styled.div`
  ${typography.Sans12}
  color: ${palette.pine1};
`;

export const Value = styled.div.attrs({ className: "fs-exclude" })`
  ${typography.Sans12}
  color: ${palette.slate85};
  display: flex;
  flex-direction: column;
  gap: ${rem(2)};
`;

/**
 * Row layout with a label on the left and a trailing action (typically a link)
 * on the right. Used by the SAR Reports section; defined here so the typography
 * stays in sync with the other section primitives.
 */
export const RowWithAction = styled.div`
  align-items: center;
  display: flex;
  ${typography.Sans12}
  gap: ${rem(16)};
  justify-content: space-between;
  letter-spacing: -0.01em;
  line-height: 1.2;
  padding: ${rem(8)} 0;
`;

export const RowLabel = styled.div`
  ${typography.Sans12}
  color: ${palette.pine1};
`;

export const RowActionLink = styled.a`
  ${typography.Sans12}
  color: ${palette.signal.links};
  text-decoration: none;

  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;
