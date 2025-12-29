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
import { format } from "date-fns";
import { rem } from "polished";
import styled from "styled-components";

import { palette } from "~design-system";

const Container = styled.div``;

const Wrapper = styled.div`
  width: 100%;
  height: ${rem(40)};
  background-color: ${palette.slate20};
  border-radius: ${rem(4)};
  overflow: hidden;
  margin: ${rem(spacing.sm)} 0 ${rem(spacing.xs)} 0;
`;

const Fill = styled.div<{ $percentage: number }>`
  width: ${(props) => props.$percentage}%;
  height: 100%;
  background-color: ${palette.signal.links};
  transition: width 0.3s ease;
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  ${typography.Sans14};
  color: ${palette.slate70};
`;

interface ChecklistProgressBarProps {
  completedItems: number;
  totalItems: number;
  completedSections: number;
  totalSections: number;
  lastSavedTimestamp?: Date;
}

export function ChecklistProgressBar({
  completedItems,
  totalItems,
  completedSections,
  totalSections,
  lastSavedTimestamp,
}: ChecklistProgressBarProps) {
  const progressPercentage =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Container>
      <Wrapper>
        <Fill $percentage={progressPercentage} />
      </Wrapper>
      <Footer>
        <span>
          {completedSections}/{totalSections} Sections Complete
        </span>
        {lastSavedTimestamp && (
          <span>Saved {format(lastSavedTimestamp, "MMMM d, yyyy")}</span>
        )}
      </Footer>
    </Container>
  );
}
