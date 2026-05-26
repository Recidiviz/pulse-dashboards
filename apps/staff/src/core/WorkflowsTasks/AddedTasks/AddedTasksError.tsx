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
  onRetry: () => void;
};

/**
 * Small inline error message with a Retry button. Shown when the
 * `CustomTasks` subscription's hydrationState transitions to `"failed"`.
 */
export function AddedTasksError({ onRetry }: AddedTasksErrorProps) {
  return (
    <ErrorWrapper role="alert">
      <ErrorText>Couldn’t load added tasks.</ErrorText>
      <RetryButton onClick={onRetry}>Retry</RetryButton>
    </ErrorWrapper>
  );
}
