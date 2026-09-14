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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { FormEvent, useMemo } from "react";
import styled from "styled-components";

import { Button, palette, spacing, typography } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { SentenceCalculationHost } from "../../types";
import { SentenceCalculationPresenter } from "./SentenceCalculationPresenter";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${rem(spacing.xl)};
  text-align: center;
`;

const Title = styled.h1`
  ${typography.Serif24}

  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
`;

const Subtitle = styled.p`
  ${typography.Sans16}

  color: ${palette.slate70};
  margin-bottom: ${rem(spacing.lg)};
`;

const Form = styled.form`
  display: flex;
  gap: ${rem(spacing.sm)};
  align-items: center;
`;

const Label = styled.label`
  ${typography.Sans16}

  color: ${palette.pine1};
`;

const TextInput = styled.input`
  ${typography.Sans16}

  border: 1px solid ${palette.slate30};
  border-radius: ${rem(4)};
  color: ${palette.pine1};
  padding: ${rem(spacing.sm)};
`;

const Result = styled.p`
  ${typography.Sans16}

  color: ${palette.pine1};
  margin-top: ${rem(spacing.lg)};
`;

const ErrorMessage = styled(Result)`
  color: ${palette.signal.error};
`;

// Same pattern in InsightsSupervisorListPage and RoutePlannerClientCard
const SubmitButton = styled(Button)<{ $waiting: boolean }>`
  ${({ $waiting }) =>
    $waiting &&
    `
      cursor: wait;
    `}
`;

type Props = {
  host: SentenceCalculationHost;
};

function usePresenter({ host }: Props) {
  // the presenter holds this view's local state (the field contents and the
  // last response), so it must survive re-renders
  return useMemo(() => new SentenceCalculationPresenter(host), [host]);
}

const ManagedComponent = observer(function SentenceCalculationPage({
  presenter,
}: Props & { presenter: SentenceCalculationPresenter }) {
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    presenter.submit();
  };

  return (
    <Wrapper>
      <Title>Sentence Calculation</Title>
      <Subtitle>
        This dashboard is under construction. Check back soon.
      </Subtitle>
      <Form onSubmit={onSubmit}>
        <Label htmlFor="sentence-calculation-echo">Text to send</Label>
        <TextInput
          id="sentence-calculation-echo"
          value={presenter.inputValue}
          onChange={(e) => presenter.setInputValue(e.target.value)}
        />
        <SubmitButton
          type="submit"
          disabled={!presenter.canSubmit}
          $waiting={presenter.isSubmitting}
        >
          Send
        </SubmitButton>
      </Form>
      {presenter.response && (
        <Result>
          {`The backend echoed "${presenter.response.echo}" for ${presenter.response.stateCode}.`}
        </Result>
      )}
      {presenter.error && (
        <ErrorMessage>{presenter.error.message}</ErrorMessage>
      )}
    </Wrapper>
  );
});

export const SentenceCalculationPage = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
});
