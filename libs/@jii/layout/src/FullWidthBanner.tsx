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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { ReactNode } from "react";
import styled, { css } from "styled-components";

import {
  HEADER_ANIMATION_OPTIONS,
  HEADER_HEIGHT,
  HIDDEN_HEADER_OFFSET,
  PageContainer,
  STICKY_HEADER_ZINDEX,
} from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { palette } from "~design-system";

export const stickyHeaderStyles = css`
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-top: -${rem(spacing.xl)};
  position: sticky;
  transition: top ${HEADER_ANIMATION_OPTIONS};
`;

const Container = styled.div<{ $hideHeader: boolean }>`
  ${typography.Sans14}

  background: ${palette.marble3};
  color: ${palette.slate85};
  text-align: center;
  ${stickyHeaderStyles}
  top: ${({ $hideHeader }: { $hideHeader: boolean }) =>
    $hideHeader ? `-${rem(HIDDEN_HEADER_OFFSET)}` : rem(HEADER_HEIGHT)};
  z-index: ${STICKY_HEADER_ZINDEX - 1};

  ${PageContainer} {
    padding-bottom: ${rem(spacing.md)};
    padding-top: ${rem(spacing.md)};
  }
`;

interface FullWidthBannerProps {
  children: ReactNode;
}

export const FullWidthBanner = observer(function FullWidthBanner({
  children,
}: FullWidthBannerProps) {
  const {
    uiStore: { hideHeaderBar },
  } = useRootStore();

  return (
    <Container $hideHeader={hideHeaderBar}>
      <PageContainer>{children}</PageContainer>
    </Container>
  );
});
