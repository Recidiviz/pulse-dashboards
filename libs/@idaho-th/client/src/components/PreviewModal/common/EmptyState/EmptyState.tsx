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

import React from "react";

import * as Styled from "./EmptyState.styles";

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading?: React.ReactNode;
  subHeading?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  heading,
  subHeading,
}) => (
  <Styled.Root>
    <Styled.Body>
      {icon && <Styled.IconWrapper>{icon}</Styled.IconWrapper>}
      {(heading || subHeading) && (
        <Styled.Text>
          {heading && <Styled.Heading>{heading}</Styled.Heading>}
          {subHeading && <Styled.SubHeading>{subHeading}</Styled.SubHeading>}
        </Styled.Text>
      )}
    </Styled.Body>
  </Styled.Root>
);
