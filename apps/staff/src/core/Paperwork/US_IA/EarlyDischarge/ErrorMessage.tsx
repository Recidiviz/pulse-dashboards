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
import { ReactNode } from "react";
import styled from "styled-components";

import { Icon, IconSVG, palette } from "~design-system";

const ErrorRow = styled.p`
  ${typography.Sans14}
  color: ${palette.signal.error};
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
  margin: 0;

  svg {
    flex: none;
  }
`;

/** An error announced to screen readers, shown in red after the Error icon. */
export function ErrorMessage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ErrorRow role="alert" className={className}>
      <Icon
        kind={IconSVG.Error}
        size={16}
        color={palette.signal.error}
        aria-hidden
      />
      {children}
    </ErrorRow>
  );
}
