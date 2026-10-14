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

import { Callout } from "../../Callout/Callout";

const QuestionnaireCtaErrorContent = ({
  resetError,
}: {
  resetError: () => void;
}) => {
  const { t } = useUsMaTranslations();

  return (
    <Callout
      tone="warning"
      icon={<Icon kind="Info" size={24} />}
      heading={t(($) => $.reentry.overview.questionnaireCta.loadError.heading)}
      description={t(
        ($) => $.reentry.overview.questionnaireCta.loadError.description,
      )}
      action={
        <Button kind="link" onClick={() => resetError()}>
          {t(($) => $.reentry.overview.questionnaireCta.retryCta)}
        </Button>
      }
    />
  );
};

export const QuestionnaireCtaError = (props: { resetError: () => void }) => (
  <QuestionnaireCtaErrorContent {...props} />
);
