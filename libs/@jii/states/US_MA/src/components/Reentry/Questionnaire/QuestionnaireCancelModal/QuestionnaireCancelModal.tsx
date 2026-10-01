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
import { Button, Modal } from "~design-system";

import {
  Actions,
  Description,
  Heading,
} from "./QuestionnaireCancelModal.styles";

export type QuestionnaireCancelModalProps = {
  isOpen: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export const QuestionnaireCancelModal = ({
  isOpen,
  onStay,
  onLeave,
}: QuestionnaireCancelModalProps) => {
  const { t } = useUsMaTranslations();
  const heading = t(($) => $.reentry.questionnaire.cancelModal.heading);

  return (
    <Modal isOpen={isOpen} onRequestClose={onStay} contentLabel={heading}>
      <Heading>{heading}</Heading>

      <Description>
        {t(($) => $.reentry.questionnaire.cancelModal.description)}
      </Description>

      <Actions>
        <Button kind="secondary" onClick={onStay}>
          {t(($) => $.reentry.questionnaire.cancelModal.keepAnswering)}
        </Button>
        <Button kind="primary" onClick={onLeave}>
          {t(($) => $.reentry.questionnaire.cancelModal.confirm)}
        </Button>
      </Actions>
    </Modal>
  );
};
