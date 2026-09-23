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

import { rem } from "polished";
import styled from "styled-components";

import { Card, JIIButton, SlateCopy } from "~@jii/common-ui";
import { asErrorBoundaryFallback } from "~@jii/layout";
import { useUsNeTranslations } from "~@jii/translation";
import { palette, spacing } from "~design-system";
import { Icon } from "~design-system";

type TodosErrorProps = { resetError: () => void };

const ErrorIcon = styled(Icon).attrs({
  size: 16,
  kind: "Error",
  color: palette.slate85,
})<{
  kind?: never;
}>`
  margin-top: ${rem(spacing.xs)};
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${rem(spacing.sm)};
`;

const UsNeTodosErrorContent: React.FC<TodosErrorProps> = ({ resetError }) => {
  const { t } = useUsNeTranslations();
  return (
    <Card>
      <ErrorMessage>
        <ErrorIcon />
        <SlateCopy>{t(($) => $.home.todos.error.message)}</SlateCopy>
      </ErrorMessage>
      <JIIButton onClick={() => resetError()}>
        {t(($) => $.home.todos.error.retryCta)}
      </JIIButton>
    </Card>
  );
};

export const UsNeTodosError = asErrorBoundaryFallback(UsNeTodosErrorContent);
