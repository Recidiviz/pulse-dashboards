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
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components";

import {
  HIDDEN_HEADER_OFFSET,
  PageContainer,
  STICKY_HEADER_ZINDEX,
} from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { stickyHeaderStyles } from "~@jii/layout";
import { palette } from "~design-system";

const ProgressContainer = styled.div<{
  $hideHeader: boolean;
}>`
  ${stickyHeaderStyles}
  z-index: ${STICKY_HEADER_ZINDEX + 1};
  top: ${({ $hideHeader }) => rem($hideHeader ? 0 : HIDDEN_HEADER_OFFSET)};

  padding: ${rem(spacing.md)} 0;

  background-color: ${palette.marble1};
  border-bottom: 1px solid ${palette.slate20};
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ProgressBackground = styled.div`
  width: 100%;
  height: ${rem(12)};
  border-radius: ${rem(8)};
  background-color: ${palette.marble5};
  margin-bottom: ${rem(spacing.sm)};
`;

const ProgressValue = styled.div<{ $width: number }>`
  width: ${({ $width }) => $width}%;
  transition: width 0.3s ease;
  border-top-left-radius: ${rem(8)};
  border-bottom-left-radius: ${rem(8)};
  height: 100%;
  background-color: ${palette.pine4};
`;

/**
 * renders a progress bar based on a percentage amount out of 100
 */
function ProgressBar({ percentDone }: { percentDone: number }) {
  return (
    <ProgressBackground>
      <ProgressValue $width={percentDone} />
    </ProgressBackground>
  );
}

export const ProgressHeader = observer(function ProgressHeader({
  section,
  totalSections,
  percentDone,
}: {
  section: number;
  totalSections: number;
  percentDone: number;
}) {
  const {
    uiStore: { hideHeaderBar },
  } = useRootStore();

  return (
    <ProgressContainer $hideHeader={hideHeaderBar}>
      <PageContainer>
        <ProgressBar percentDone={percentDone} />
        <ProgressLabel>
          <span>
            Section {section} of {totalSections}
          </span>
          <span>{Math.trunc(percentDone)}% complete</span>
        </ProgressLabel>
      </PageContainer>
    </ProgressContainer>
  );
});
