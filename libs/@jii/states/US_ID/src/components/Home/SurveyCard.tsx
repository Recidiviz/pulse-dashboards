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
import { FC } from "react";
import styled from "styled-components";

import {
  Card,
  CardHeading,
  CardValue,
  Chip,
  GoButton,
  SlateCopy,
} from "~@jii/common-ui";
import { useRootStore, useSingleResidentContext } from "~@jii/data";
import { MainContentHydratorWithoutErrorLogging } from "~@jii/layout";
import { ReentryAssessment } from "~@jii/paths";
import { useUsIdTranslations } from "~@jii/translation";
import { spacing } from "~design-system";
import { withPresenterManager } from "~hydration-utils";

import { SurveyCardPresenter } from "./SurveyCardPresenter";

const CardSection = styled.div`
  margin-top: ${rem(spacing.lg)};
`;

const ManagedComponent: FC<{ presenter: SurveyCardPresenter }> = ({
  presenter,
}) => {
  return (
    <Card>
      <CardHeading>
        {presenter.heading}
        <Chip color={presenter.chipColor}>{presenter.chip}</Chip>
      </CardHeading>
      <CardValue>{presenter.value}</CardValue>
      <CardSection>
        <SlateCopy options={{ forceBlock: true }}>{presenter.body}</SlateCopy>
      </CardSection>
      {presenter.linkText && (
        <CardSection>
          <GoButton to={ReentryAssessment.buildRelativePath({})}>
            {presenter.linkText}
          </GoButton>
        </CardSection>
      )}
    </Card>
  );
};

function usePresenter() {
  const { userStore, firebaseAuthClient } = useRootStore();
  const { resident } = useSingleResidentContext();
  const { t } = useUsIdTranslations();
  const { surveyCard } = t(($) => $.reentry, { returnObjects: true });

  return new SurveyCardPresenter(
    resident,
    firebaseAuthClient,
    userStore,
    surveyCard,
  );
}

export const SurveyCard = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: false,
  HydratorComponent: MainContentHydratorWithoutErrorLogging,
});
