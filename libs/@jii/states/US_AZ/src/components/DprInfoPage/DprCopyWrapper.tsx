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
import { rem, rgba } from "polished";
import styled from "styled-components";

import { withCopyWrapperOverrides } from "~@jii/common-ui";
import { Icon, palette, spacing } from "~design-system";

const CopyWrapperWithCustomComponents = withCopyWrapperOverrides({
  Icon: Icon,
});

/**
 * Includes some custom formatting that only applies to this page
 */
export const DprCopyWrapper = styled(CopyWrapperWithCustomComponents)`
  h3 {
    ${typography.Sans16}
    color: ${palette.pine4};
    font-weight: bold;
  }

  .important {
    background: ${rgba(palette.signal.important, 0.15)};
    padding: ${rem(spacing.md)};
    margin: ${rem(spacing.lg)} 0;
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: ${rem(spacing.sm)};
    align-items: baseline;

    :last-child {
      margin-bottom: 0;
    }

    svg {
      color: ${palette.signal.important};
      grid-column-start: 1;
    }

    p {
      grid-column-start: 2;
    }
  }
`;
