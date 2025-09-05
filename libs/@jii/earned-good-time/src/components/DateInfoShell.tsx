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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components/macro";

import { CardHeading, Chip } from "~@jii/common-ui";

export type DateInfoShellProps = {
  tag: string;
  label: string;
  muted?: boolean;
  children: ReactNode;
};

const Wrapper = styled.div`
  &:not(:last-child) {
    margin-bottom: ${rem(spacing.lg)};
  }
`;

export const DateInfoShell: FC<DateInfoShellProps> = ({
  tag,
  label,
  muted,
  children,
}) => {
  return (
    <Wrapper>
      <CardHeading>
        {label}
        <Chip color={muted ? "gray" : "green"}>
          <abbr>{tag}</abbr>
        </Chip>
      </CardHeading>
      {children}
    </Wrapper>
  );
};
