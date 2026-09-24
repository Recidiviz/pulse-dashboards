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

import { LayoutGrid } from "lucide-react";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";
import { Icon } from "~design-system";

import { useReentryQuestionnaire } from "../../../../hooks/useReentryQuestionnaire";
import { QUESTIONNAIRE_STATUS_COPY } from "../../ctaConfigs";
import { CompletedCard } from "./CompletedCard/CompletedCard";
import {
  CompletedWrapper,
  Description,
  Heading,
  MetadataItem,
  MetadataRow,
  StartButton,
  Wrapper,
} from "./QuestionnaireCta.styles";
import { ReviewCard } from "./ReviewCard/ReviewCard";

const PLACEHOLDER_SECTION_COUNT = 8;

export const QuestionnaireCta = () => {
  const { t } = useUsMaTranslations();
  const routeParams = useTypedParams(State.Resident);
  const { status } = useReentryQuestionnaire();

  if (status === "COMPLETED") {
    return (
      <CompletedWrapper>
        <CompletedCard />
        <ReviewCard />
      </CompletedWrapper>
    );
  }

  const getCopy =
    status === "IN_PROGRESS"
      ? QUESTIONNAIRE_STATUS_COPY.IN_PROGRESS
      : QUESTIONNAIRE_STATUS_COPY.NOT_STARTED;
  const { heading, description, cta } = getCopy(t);

  return (
    <Wrapper>
      <Heading>{heading}</Heading>
      <Description>{description}</Description>
      <MetadataRow>
        <MetadataItem>
          <Icon kind="Clock" size={16} />
          {t(($) => $.reentry.overview.questionnaireCta.duration)}
        </MetadataItem>
        <MetadataItem>
          <LayoutGrid size={16} />
          {t(($) => $.reentry.overview.questionnaireCta.sectionCount, {
            count: PLACEHOLDER_SECTION_COUNT,
          })}
        </MetadataItem>
        <MetadataItem>
          <Icon kind="Check" size={16} />
          {t(($) => $.reentry.overview.questionnaireCta.saveAndReturn)}
        </MetadataItem>
      </MetadataRow>
      <StartButton
        kind="primary"
        to={State.Resident.UsMaReentry.Questionnaire.buildPath(routeParams)}
      >
        {cta}
      </StartButton>
    </Wrapper>
  );
};
