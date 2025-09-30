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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components/macro";

import { preventFlexibleLayoutOverflow, SlateCopy } from "~@jii/common-ui";
import { palette } from "~design-system";

export type CreditTypeCardProps = {
  label: string;
  children: ReactNode;
};

const CreditTypeCardShell = styled.div`
  flex: 1;
  border-right: 1px solid ${palette.slate10};
  margin: 0;
  padding: ${rem(spacing.md)};
  border-radius: ${rem(spacing.sm)} 0 0 ${rem(spacing.sm)};

  ${preventFlexibleLayoutOverflow}

  &:last-child {
    border-right: none;
  }
`;

const CardValue = styled.div`
  ${typography.Sans24};

  font-size: ${rem(24)};
`;

export const CreditTypeCard: FC<CreditTypeCardProps> = ({
  label,
  children,
}) => {
  return (
    <CreditTypeCardShell>
      <SlateCopy>{label}</SlateCopy>
      <CardValue>{children}</CardValue>
    </CreditTypeCardShell>
  );
};
