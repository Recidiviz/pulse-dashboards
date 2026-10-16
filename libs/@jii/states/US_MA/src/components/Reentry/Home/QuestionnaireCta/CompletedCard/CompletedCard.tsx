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

import { IllustratedCard } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { palette } from "~design-system";

import { useReentryChecklist } from "../../../../../hooks/useReentryChecklist";
import { QUESTIONNAIRE_STATUS_COPY } from "../../../ctaConfigs";
import {
  Description,
  Heading,
  SummaryContent,
  ViewChecklistButton,
} from "./CompletedCard.styles";
import illustration from "./illustration.svg";

export const CompletedCard = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);
  const { personalizedItemCount } = useReentryChecklist();
  const { heading, recommendedTaskCount, cta } =
    QUESTIONNAIRE_STATUS_COPY.COMPLETED(t);
  const checklistPath =
    State.Resident.UsMaReentry.Checklist.buildPath(routeParams);

  return (
    <IllustratedCard
      illustrationSrc={illustration}
      illustrationAlt=""
      illustrationBackground={palette.slate10}
      illustrationLink={checklistPath}
    >
      <SummaryContent>
        <Heading>{heading}</Heading>
        {personalizedItemCount > 0 && (
          <Description>
            {recommendedTaskCount(personalizedItemCount)}
          </Description>
        )}
        <ViewChecklistButton kind="primary" to={checklistPath}>
          {cta}
        </ViewChecklistButton>
      </SummaryContent>
    </IllustratedCard>
  );
};
