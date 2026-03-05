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
 * Typography styles for Public Pathways using Proxima Nova.
 *
 * Uses typography from @recidiviz/design-system (the pre-built external
 * package, where SCSS :export values are compiled) and overrides the
 * font-family to Proxima Nova.
 *
 *   const BodyText = styled.div`
 *     ${publicPathwaysTypography.Body16}
 *   `;
 *
 *   const Label = styled.span`
 *     ${publicPathwaysTypography.Sans14}
 *   `;
 */
// Import from the pre-built external package, not ~design-system.
// The monorepo design-system uses SCSS :export to expose typography values,
// but Vite only processes :export in .module.scss files, so the values
// are undefined when imported via ~design-system.
import { typography } from "@recidiviz/design-system";
import { css } from "styled-components";

import { TypographyStyles } from "~design-system";

const PROXIMA_NOVA_FONT_FAMILY = '"Proxima Nova", sans-serif';

export const publicPathwaysTypography = Object.fromEntries(
  Object.entries(typography).map(([level, styles]) => [
    level,
    css`
      ${styles}
      font-family: ${PROXIMA_NOVA_FONT_FAMILY};
      font-optical-sizing: auto;
    `,
  ]),
) as TypographyStyles;
