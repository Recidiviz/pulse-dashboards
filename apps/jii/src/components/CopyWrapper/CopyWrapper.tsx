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

import { palette, spacing, typography } from "@recidiviz/design-system";
import Markdown from "markdown-to-jsx";
import { rem } from "polished";
import styled from "styled-components/macro";

/**
 * Renders Markdown children (via {@link https://www.npmjs.com/package/markdown-to-jsx|markdown-to-jsx})
 * and applies a standard stylesheet to the result
 */
export const CopyWrapper = styled(Markdown)`
  h2 {
    ${typography.Sans18}

    color: ${palette.text.normal};
    margin: 0 0 ${rem(spacing.lg)};
  }

  p {
    ${typography.Body14}

    color: ${palette.text.normal};
  }
`;
