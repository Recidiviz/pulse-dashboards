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
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { FullBleedContainer, PageContainer } from "./BaseLayout/BaseLayout";
import { HeaderPortal } from "./Header/HeaderPortal";

const Container = styled(FullBleedContainer)`
  ${typography.Sans14}

  background: ${palette.marble2};
  color: ${palette.slate85};
  text-align: center;

  ${PageContainer} {
    padding-bottom: ${rem(spacing.md)};
    padding-top: ${rem(spacing.md)};
  }
`;

export function FullWidthBanner({ children }: { children: React.ReactNode }) {
  return (
    <HeaderPortal>
      <Container>
        <PageContainer>{children}</PageContainer>
      </Container>
    </HeaderPortal>
  );
}
