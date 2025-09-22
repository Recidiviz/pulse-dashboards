// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { css, FlattenSimpleInterpolation } from "styled-components/macro";

import * as sassVars from "../scss/typography/_variables.scss";

const TYPOGRAPHY_LEVELS = [
  "Sans12",
  "Sans14",
  "Sans16",
  "Sans18",
  "Sans24",
  "Serif24",
  "Serif34",
  "Header88",
  "Header56",
  "Header34",
  "Header24",
  "Body48",
  "Body40",
  "Body32",
  "Body24",
  "Body19",
  "Body16",
  "Body14",
  "Body12",
] as const;
type TypographyLevel = (typeof TYPOGRAPHY_LEVELS)[number];

export type TypographyStyles = Record<
  TypographyLevel,
  FlattenSimpleInterpolation
>;

export const typography: TypographyStyles = TYPOGRAPHY_LEVELS.reduce(
  (accumulatedStyles, level) => {
    let additionalStyles = css``;

    if (level.startsWith("Body")) {
      additionalStyles = css`
        margin-bottom: ${sassVars.paragraphSpacingBody};

        p {
          margin-bottom: ${sassVars.paragraphSpacingBody};
        }

        a {
          color: ${sassVars.linkColorBody};
          text-decoration: underline;
        }

        ul {
          list-style: ${sassVars.listStyleBody};
          margin-top: ${sassVars.paragraphSpacingBody};
          padding-left: ${sassVars.listPaddingBody};
        }

        li {
          margin: ${sassVars.listItemSpacingBody} 0;
        }

        strong {
          font-weight: 700;
        }
      `;
    }

    if (level.startsWith("Header")) {
      additionalStyles = css`
        margin-bottom: ${sassVars.paragraphSpacingHeader};

        a {
          color: ${sassVars.linkColorBody};
          text-decoration: underline;
        }
      `;
    }

    return {
      ...accumulatedStyles,
      [level]: css`
        font: ${sassVars[`font${level}`]};
        letter-spacing: ${sassVars[`letterSpacing${level}`]};
        ${additionalStyles}
      `,
    };
  },
  {} as TypographyStyles,
);
