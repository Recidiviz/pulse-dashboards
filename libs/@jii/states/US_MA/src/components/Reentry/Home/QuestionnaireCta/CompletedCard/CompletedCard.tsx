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

import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { useReentryChecklist } from "../../../../../hooks/useReentryChecklist";
import { QUESTIONNAIRE_STATUS_COPY } from "../../../ctaConfigs";
import {
  Description,
  Heading,
  IconBlock,
  IconCircle,
  SummaryCard,
  SummaryContent,
  ViewChecklistButton,
} from "./CompletedCard.styles";

export const CompletedCard = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);
  const { personalizedItemCount } = useReentryChecklist();
  const { heading, recommendedTaskCount, cta } =
    QUESTIONNAIRE_STATUS_COPY.COMPLETED(t);

  return (
    <SummaryCard>
      <IconBlock>
        <IconCircle>
          <Icon kind="Check" size={20} />
        </IconCircle>
      </IconBlock>
      <SummaryContent>
        <Heading>{heading}</Heading>
        <Description>{recommendedTaskCount(personalizedItemCount)}</Description>
        <ViewChecklistButton
          kind="primary"
          to={State.Resident.UsMaReentry.Checklist.buildPath(routeParams)}
        >
          {cta}
        </ViewChecklistButton>
      </SummaryContent>
    </SummaryCard>
  );
};
