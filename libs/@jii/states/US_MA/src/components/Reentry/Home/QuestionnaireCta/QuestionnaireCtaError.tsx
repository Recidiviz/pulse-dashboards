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

import styled from "styled-components";

import { useUsMaTranslations } from "~@jii/translation";
import { Button } from "~design-system";

import { Description, Wrapper } from "./QuestionnaireCta.styles";

const CenteredWrapper = styled(Wrapper)`
  align-items: center;
  text-align: center;
`;

const QuestionnaireCtaErrorContent = ({
  resetError,
}: {
  resetError: () => void;
}) => {
  const { t } = useUsMaTranslations();

  return (
    <CenteredWrapper>
      <Description>
        {t(($) => $.reentry.overview.questionnaireCta.loadError)}
      </Description>
      <Button kind="link" onClick={() => resetError()}>
        {t(($) => $.reentry.overview.questionnaireCta.retryCta)}
      </Button>
    </CenteredWrapper>
  );
};

export const QuestionnaireCtaError = (props: { resetError: () => void }) => (
  <QuestionnaireCtaErrorContent {...props} />
);
