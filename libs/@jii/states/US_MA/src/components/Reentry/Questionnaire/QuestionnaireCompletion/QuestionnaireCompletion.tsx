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

import { useUsMaTranslations } from "~@jii/translation";
import { Button, Icon } from "~design-system";

import {
  Actions,
  Heading,
  HeadingGroup,
  IconCircle,
  IconHalo,
  InfoCard,
  Subheading,
  Wrapper,
} from "./QuestionnaireCompletion.styles";

type QuestionnaireCompletionProps = {
  onGoToChecklist: () => void;
  onClose: () => void;
};

export const QuestionnaireCompletion = ({
  onGoToChecklist,
  onClose,
}: QuestionnaireCompletionProps) => {
  const { t } = useUsMaTranslations();

  return (
    <Wrapper>
      <IconHalo>
        <IconCircle>
          <Icon kind="Check" size={20} />
        </IconCircle>
      </IconHalo>

      <HeadingGroup>
        <Heading>
          {t(($) => $.reentry.questionnaire.completion.heading)}
        </Heading>
        <Subheading>
          {t(($) => $.reentry.questionnaire.completion.subheading)}
        </Subheading>
      </HeadingGroup>

      <InfoCard>
        <p>{t(($) => $.reentry.questionnaire.completion.checklistReady)}</p>
        <p>{t(($) => $.reentry.questionnaire.completion.changeAnytime)}</p>
      </InfoCard>

      <Actions>
        <Button kind="primary" onClick={onGoToChecklist}>
          {t(($) => $.reentry.questionnaire.completion.checklistCta)}
        </Button>
        <Button kind="link" onClick={onClose}>
          {t(($) => $.reentry.questionnaire.completion.closeCta)}
        </Button>
      </Actions>
    </Wrapper>
  );
};
