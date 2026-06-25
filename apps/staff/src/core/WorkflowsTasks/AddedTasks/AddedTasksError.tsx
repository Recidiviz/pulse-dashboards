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

import { Sans14, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components";

import { Button, palette } from "~design-system";

import { CustomTasks } from "../../../WorkflowsStore/Task/CustomTasks";

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${rem(spacing.sm)};
  padding: ${rem(spacing.md)} 0;
`;

const ErrorText = styled(Sans14)`
  color: ${palette.signal.error};
`;

const RetryButton = styled(Button).attrs({
  kind: "link" as const,
  type: "button" as const,
})`
  text-decoration: underline;

  &:hover,
  &:focus {
    color: ${palette.pine3};
  }
`;

type AddedTasksErrorProps = {
  customTasks?: CustomTasks;
  resetError?: () => void;
};

/**
 * Inline error UI with a Retry action. Used in two places, hence the optional
 * `resetError`:
 *
 * - Hydration failure → rendered inline by `AddedTasksSection` (no boundary).
 *   `customTasks.retry()` re-attaches the Firestore listener (state flips to
 *   `"loading"`), and the still-mounted section re-renders in place through its
 *   loading skeleton until the listener delivers data. No `resetError` needed.
 * - Chunk-load failure → rendered by the container's `<ErrorBoundary>` fallback.
 *   `customTasks.retry()` is a no-op (subscription is hydrated, or `customTasks`
 *   is undefined); `resetError()` triggers the container's lazy retry so the
 *   dynamic import is re-attempted.
 */
export function AddedTasksError({
  customTasks,
  resetError,
}: AddedTasksErrorProps) {
  const handleRetry = () => {
    customTasks?.retry();
    resetError?.();
  };
  return (
    <ErrorWrapper role="alert">
      <ErrorText>Couldn’t load added tasks.</ErrorText>
      <RetryButton onClick={handleRetry}>Retry</RetryButton>
    </ErrorWrapper>
  );
}
