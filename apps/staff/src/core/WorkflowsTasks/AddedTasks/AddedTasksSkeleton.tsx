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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled, { keyframes } from "styled-components";

import { palette } from "~design-system";

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const SkeletonWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const SkeletonRow = styled.div`
  padding: ${rem(spacing.md)} 0;

  &:not(:last-of-type) {
    border-bottom: 1px solid ${palette.slate10};
  }
`;

const SkeletonBar = styled.div`
  background-color: ${palette.slate20};
  border-radius: ${rem(2)};
  height: ${rem(16)};
  width: 100%;
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

/**
 * 3 muted skeleton rows used as a loading placeholder while a person's
 * `CustomTasks` subscription is hydrating. Also used as the `<Suspense>`
 * fallback while the `AddedTasksSection` chunk is being fetched, so this
 * component is intentionally eagerly imported.
 */
export function AddedTasksSkeleton() {
  return (
    <SkeletonWrapper aria-label="Loading added tasks" role="status">
      <SkeletonRow>
        <SkeletonBar />
      </SkeletonRow>
      <SkeletonRow>
        <SkeletonBar />
      </SkeletonRow>
      <SkeletonRow>
        <SkeletonBar />
      </SkeletonRow>
    </SkeletonWrapper>
  );
}
