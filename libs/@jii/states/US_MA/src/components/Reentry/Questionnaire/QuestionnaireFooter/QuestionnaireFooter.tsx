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
import { Button, Icon, spacing } from "~design-system";

import { Callout } from "../../Callout/Callout";
import { QUESTIONNAIRE_FOOTER_ERROR_HEIGHT } from "../constants";
import { useShouldShowScrollCue } from "../hooks/useShouldShowScrollCue";
import { ScrollCue } from "../ScrollCue/ScrollCue";
import {
  Actions,
  BackLinkButton,
  Inner,
  LeadingActions,
  Row,
  Wrapper,
} from "./QuestionnaireFooter.styles";

type QuestionnaireFooterProps = {
  onBack?: () => void;
  onCancel?: () => void;
  error?: ReactNode;
  children: ReactNode;
};

export const QuestionnaireFooter = ({
  onBack,
  onCancel,
  error,
  children,
}: QuestionnaireFooterProps) => {
  const { t } = useUsMaTranslations();
  // The layout reserves room for the error banner and a gap below the content.
  const shouldShowScrollCue = useShouldShowScrollCue({
    blankSpaceBelowContent: QUESTIONNAIRE_FOOTER_ERROR_HEIGHT + spacing.lg,
  });

  return (
    <Wrapper>
      <Inner>
        {shouldShowScrollCue && <ScrollCue />}
        {error && (
          <Callout
            tone="error"
            variant="slim"
            role="alert"
            icon={<Icon kind="Error" size={20} />}
            description={error}
          />
        )}
        <Row>
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
        </Row>
      </Inner>
    </Wrapper>
  );
};
