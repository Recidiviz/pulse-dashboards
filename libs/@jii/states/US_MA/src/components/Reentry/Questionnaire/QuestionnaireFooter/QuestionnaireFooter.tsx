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

import { ReactNode } from "react";

import { useUsMaTranslations } from "~@jii/translation";
import { Button } from "~design-system";

import {
  Actions,
  BackLinkButton,
  LeadingActions,
  Wrapper,
} from "./QuestionnaireFooter.styles";

type QuestionnaireFooterProps = {
  onBack?: () => void;
  onCancel?: () => void;
  children: ReactNode;
};

export const QuestionnaireFooter = ({
  onBack,
  onCancel,
  children,
}: QuestionnaireFooterProps) => {
  const { t } = useUsMaTranslations();

  return (
    <Wrapper>
      <LeadingActions>
        {onBack && (
          <BackLinkButton kind="link" onClick={onBack}>
            {t(($) => $.reentry.questionnaire.footer.back)}
          </BackLinkButton>
        )}
        {onCancel && (
          <Button kind="secondary" onClick={onCancel}>
            {t(($) => $.reentry.questionnaire.footer.cancel)}
          </Button>
        )}
      </LeadingActions>
      <Actions>{children}</Actions>
    </Wrapper>
  );
};
