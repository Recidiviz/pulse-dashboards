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

import { rem } from "polished";
import { FC, ReactNode } from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { FullBleedContainer, PageContainer } from "../BaseLayout/BaseLayout";
import { HEADER_BORDER_WIDTH } from "./constants";

const FullWidthWrapper = styled(FullBleedContainer)`
  background: ${palette.white};
  border-bottom: ${rem(HEADER_BORDER_WIDTH)} solid ${palette.slate20};
`;

export const HeaderBarContainer: FC<{
  className?: string;
  children: ReactNode;
}> = ({ children, className }) => {
  return (
    <FullWidthWrapper className={className}>
      <PageContainer>{children}</PageContainer>
    </FullWidthWrapper>
  );
};
