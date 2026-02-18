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

/*
 * To use, import publicPathwaysTypography and use it like the design-system
 * typography. The font-family will be overridden to the NY font.
 *
 *   const BodyText = styled.div`
 *     ${publicPathwaysTypography.Body16}
 *   `;
 *
 *   const Label = styled.span`
 *     ${publicPathwaysTypography.Sans14}
 *   `;
 */
import { css } from "styled-components";

import { typography, TypographyStyles } from "~design-system";

const OSWALD_FONT_FAMILY = '"Oswald", sans-serif';

export const publicPathwaysTypography = Object.fromEntries(
  Object.entries(typography).map(([level, styles]) => [
    level,
    css`
      ${styles}
      font-family: ${OSWALD_FONT_FAMILY};
      font-optical-sizing: auto;
    `,
  ]),
) as TypographyStyles;